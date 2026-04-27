/**
 * submission.js — Submission state machine
 *
 * fhir-seam / Phase 5
 *
 * Core invariant: the FHIR bundle is written to IndexedDB BEFORE the POST fires.
 * The patient cannot lose their intake data to a failed or interrupted request.
 *
 * State machine:
 *   idle
 *     └─▶ [user submits] ──▶ submitting
 *                               ├─▶ [HTTP 200] ──▶ accepted (terminal)
 *                               ├─▶ [HTTP 422] ──▶ failed-retryable
 *                               ├─▶ [HTTP 503] ──▶ failed-retryable
 *                               ├─▶ [HTTP 500] ──▶ failed-permanent (terminal)
 *                               └─▶ [network error] ──▶ failed-retryable
 */

import { doc, intake, submissions, profile } from './ydoc'
import { buildIntakeBundle } from '../lib/fhir'
import {
  writeSubmissionPending,
  resolveSubmission,
  markSubmissionRetrying,
  appendSubmissionHistory,
  setProfileIdentity,
} from './ydoc'

// ─── Status Constants ─────────────────────────────────────────────────────────

export const SUBMISSION_STATUS = {
  SUBMITTING:       'submitting',
  ACCEPTED:         'accepted',
  FAILED_RETRYABLE: 'failed-retryable',
  FAILED_PERMANENT: 'failed-permanent',
}

// ─── Status Helpers ───────────────────────────────────────────────────────────

export function isTerminal(status) {
  return status === SUBMISSION_STATUS.ACCEPTED ||
         status === SUBMISSION_STATUS.FAILED_PERMANENT
}

export function isRetryable(status) {
  return status === SUBMISSION_STATUS.FAILED_RETRYABLE
}

export function isSubmitting(status) {
  return status === SUBMISSION_STATUS.SUBMITTING
}

export function httpStatusToSubmissionStatus(httpStatus) {
  if (httpStatus === 200) return SUBMISSION_STATUS.ACCEPTED
  if (httpStatus === 422) return SUBMISSION_STATUS.FAILED_RETRYABLE
  if (httpStatus === 503) return SUBMISSION_STATUS.FAILED_RETRYABLE
  if (httpStatus === 500) return SUBMISSION_STATUS.FAILED_PERMANENT
  return SUBMISSION_STATUS.FAILED_RETRYABLE
}

export function statusDisplay(status) {
  switch (status) {
    case SUBMISSION_STATUS.SUBMITTING:
      return { label: 'Submitting', description: 'Sending intake to the clinic system…', color: 'amber' }
    case SUBMISSION_STATUS.ACCEPTED:
      return { label: 'Accepted', description: 'Your intake was received by the clinic.', color: 'emerald' }
    case SUBMISSION_STATUS.FAILED_RETRYABLE:
      return { label: 'Failed — retry available', description: 'The clinic system did not receive your intake. Your data is preserved. You can retry.', color: 'red' }
    case SUBMISSION_STATUS.FAILED_PERMANENT:
      return { label: 'Failed — contact clinic', description: 'Your intake could not be processed. Your data is saved locally. Please contact the clinic directly.', color: 'purple' }
    default:
      return { label: status, description: '', color: 'gray' }
  }
}

// ─── FHIR POST ────────────────────────────────────────────────────────────────

const FHIR_ENDPOINT = '/api/intake'

async function postFhirBundle(bundle, mockMode = null) {
  const headers = { 'Content-Type': 'application/fhir+json' }
  if (mockMode) headers['x-fhir-mock-mode'] = mockMode

  const response = await fetch(FHIR_ENDPOINT, {
    method: 'POST',
    headers,
    body: JSON.stringify(bundle),
  })

  let outcome = null
  try {
    outcome = await response.json()
  } catch {
    outcome = null
  }

  return { httpStatus: response.status, outcome }
}

// ─── Submit ───────────────────────────────────────────────────────────────────

/**
 * submitIntake — full submission flow with write-before-POST invariant.
 *
 * 1. Build FHIR bundle from current intake state
 * 2. Write bundle to submissions map with status 'submitting' (BEFORE POST)
 * 3. Fire the POST
 * 4. Resolve the submission to terminal or retryable state
 * 5. Append summary to profile submission_history
 * 6. Set profile identity on first submission
 *
 * @param {string|null} mockMode - Optional x-fhir-mock-mode header value for testing
 * @returns {string} The submissionId
 */
export async function submitIntake(mockMode = null) {
  // Build bundle from live intake state
  const bundle = buildIntakeBundle(intake)

  // Generate client-owned submission ID
  const submissionId = crypto.randomUUID()

  // WRITE BEFORE POST — the client can never lose this bundle
  writeSubmissionPending(submissionId, bundle)

  // Set profile identity on first submission (idempotent after first)
  const demographics = intake.get('demographics') ?? {}
  if (demographics.firstName || demographics.lastName) {
    setProfileIdentity({
      firstName: demographics.firstName ?? '',
      lastName: demographics.lastName ?? '',
    })
  }

  // Fire the POST
  let httpStatus, outcome
  try {
    ;({ httpStatus, outcome } = await postFhirBundle(bundle, mockMode))
  } catch {
    // Network error — treat as retryable
    httpStatus = 0
    outcome = {
      resourceType: 'OperationOutcome',
      issue: [{
        severity: 'fatal',
        code: 'transient',
        diagnostics: 'Network error — could not reach the clinic system. Check your connection and retry.',
      }]
    }
  }

  const status = httpStatusToSubmissionStatus(httpStatus)

  // Resolve the submission
  resolveSubmission(submissionId, status, outcome)

  // Append summary to profile history
  appendSubmissionHistory({
    submissionId,
    status,
    submittedAt: new Date().toISOString(),
    resolvedAt: new Date().toISOString(),
  })

  return submissionId
}

/**
 * retrySubmission — resend a failed-retryable submission.
 * Uses the preserved bundle from the submissions map — no re-entry of data.
 *
 * @param {string} submissionId - The ID of the failed submission to retry
 * @param {string|null} mockMode - Optional mock mode header
 * @returns {string} The same submissionId
 */
export async function retrySubmission(submissionId, mockMode = null) {
  const existing = submissions.get(submissionId)
  if (!existing || !isRetryable(existing.status)) return submissionId

  // Mark as retrying (increments retryCount, resets to 'submitting')
  markSubmissionRetrying(submissionId)

  const bundle = existing.bundle

  let httpStatus, outcome
  try {
    ;({ httpStatus, outcome } = await postFhirBundle(bundle, mockMode))
  } catch {
    httpStatus = 0
    outcome = {
      resourceType: 'OperationOutcome',
      issue: [{
        severity: 'fatal',
        code: 'transient',
        diagnostics: 'Network error — could not reach the clinic system. Check your connection and retry.',
      }]
    }
  }

  const status = httpStatusToSubmissionStatus(httpStatus)
  resolveSubmission(submissionId, status, outcome)

  // Update profile history entry
  appendSubmissionHistory({
    submissionId,
    status,
    submittedAt: existing.submittedAt,
    resolvedAt: new Date().toISOString(),
    isRetry: true,
  })

  return submissionId
}
