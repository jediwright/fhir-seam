/**
 * ydoc.js — Y.js document, IndexedDB persistence, and all mutation helpers
 *
 * fhir-seam / Systems of Thought — Local-First Prototype Series (Prototype 3)
 *
 * Architecture:
 *   doc.getMap('intake')      → live form state, written on every field change
 *   doc.getMap('profile')     → patient identity + Y.Array submission_history (lazy-init)
 *   doc.getMap('submissions') → keyed by client UUID; full bundle + status + timestamps
 *
 * Pattern: all mutations are pure helpers that call doc.transact() for atomic writes.
 * No Redux, no React context, no server-side session.
 */

import * as Y from 'yjs'
import { IndexeddbPersistence } from 'y-indexeddb'

// ─── Document + Persistence ──────────────────────────────────────────────────

export const doc = new Y.Doc()

// y-indexeddb writes every transaction to IndexedDB automatically.
// The 'fhir-seam-v1' key is the database name — increment if data model changes.
export const persistence = new IndexeddbPersistence('fhir-seam-v1', doc)

persistence.on('synced', () => {
  console.log('[fhir-seam] IndexedDB synced — local state restored')
})

// ─── Maps ────────────────────────────────────────────────────────────────────

/** Live intake form state. Written on every field change. */
export const intake = doc.getMap('intake')

/** Patient identity + submission history Y.Array (lazy-initialized on first submission). */
export const profile = doc.getMap('profile')

/** Submissions keyed by client-generated UUID. Full bundle + status + timestamps. */
export const submissions = doc.getMap('submissions')

// ─── Intake Mutation Helpers ──────────────────────────────────────────────────

/**
 * Update demographics fields atomically.
 * Merges with existing demographics — partial updates are safe.
 *
 * @param {Object} fields - Any subset of demographics fields:
 *   { firstName, lastName, dateOfBirth, gender, phone,
 *     addressLine1, addressLine2, city, state, zip }
 */
export function updateDemographics(fields) {
  doc.transact(() => {
    const current = intake.get('demographics') ?? {}
    intake.set('demographics', { ...current, ...fields })
    _touchMeta()
  })
}

/**
 * Update clinical fields atomically.
 * @param {Object} fields - Any subset of:
 *   { reasonForVisit, medicalHistory, currentMedications, allergies }
 */
export function updateClinical(fields) {
  doc.transact(() => {
    const current = intake.get('clinical') ?? {}
    intake.set('clinical', { ...current, ...fields })
    _touchMeta()
  })
}

/**
 * Update insurance fields atomically.
 * @param {Object} fields - Any subset of: { provider, memberId, groupNumber }
 */
export function updateInsurance(fields) {
  doc.transact(() => {
    const current = intake.get('insurance') ?? {}
    intake.set('insurance', { ...current, ...fields })
    _touchMeta()
  })
}

/**
 * Initialize form meta on first open (idempotent — safe to call repeatedly).
 * Sets startedAt only if not already set.
 */
export function initMeta() {
  doc.transact(() => {
    const current = intake.get('meta') ?? {}
    if (!current.startedAt) {
      intake.set('meta', {
        startedAt: new Date().toISOString(),
        lastModifiedAt: new Date().toISOString(),
        formVersion: '1.0',
        ...current,
      })
    }
  })
}

/**
 * Internal: update lastModifiedAt timestamp. Called from every mutation helper.
 * Must be called inside an existing doc.transact() block.
 */
function _touchMeta() {
  const current = intake.get('meta') ?? {}
  intake.set('meta', {
    ...current,
    lastModifiedAt: new Date().toISOString(),
    formVersion: current.formVersion ?? '1.0',
  })
}

// ─── Profile Mutation Helpers ─────────────────────────────────────────────────

/**
 * Set patient identity in the profile map.
 * Called on first submission — copies from intake.demographics.
 * @param {Object} identity - { firstName, lastName }
 */
export function setProfileIdentity(identity) {
  doc.transact(() => {
    profile.set('identity', identity)
  })
}

/**
 * Append a summary record to the profile submission_history Y.Array.
 * Lazy-initializes the Y.Array if it doesn't exist.
 *
 * This mirrors the checkout-seam pattern for order_history. The Y.Array is
 * nested inside the profile Y.Map — see useYjs.js for the attachArrayObserver()
 * pattern that handles stale references after IndexedDB hydration.
 *
 * @param {Object} record - Summary record to append:
 *   { submissionId, status, submittedAt, resolvedAt }
 */
export function appendSubmissionHistory(record) {
  doc.transact(() => {
    // Lazy-initialize the Y.Array on first use, same pattern as checkout-seam order_history
    if (!profile.get('submission_history')) {
      profile.set('submission_history', new Y.Array())
    }
    const history = profile.get('submission_history')
    history.push([record])
  })
}

// ─── Submissions Map Mutation Helpers ────────────────────────────────────────

/**
 * Write a new submission record BEFORE the FHIR POST fires.
 * This is the write-before-POST pattern — the client can never lose
 * the intake bundle to a failed or interrupted network request.
 *
 * @param {string} submissionId - Client-generated UUID (crypto.randomUUID())
 * @param {Object} bundle - The full FHIR Bundle that will be POSTed
 * @returns {string} The submissionId (for chaining into the POST call)
 */
export function writeSubmissionPending(submissionId, bundle) {
  doc.transact(() => {
    submissions.set(submissionId, {
      bundle,
      status: 'submitting',
      submittedAt: new Date().toISOString(),
      resolvedAt: null,
      outcome: null,
      retryCount: 0,
    })
  })
  return submissionId
}

/**
 * Resolve a submission to a terminal or retryable state.
 * Called after the FHIR endpoint responds (or after a network error).
 *
 * @param {string} submissionId
 * @param {'accepted'|'failed-retryable'|'failed-permanent'} status
 * @param {Object|null} outcome - The raw FHIR OperationOutcome from the endpoint
 */
export function resolveSubmission(submissionId, status, outcome) {
  doc.transact(() => {
    const current = submissions.get(submissionId)
    if (!current) return
    submissions.set(submissionId, {
      ...current,
      status,
      resolvedAt: new Date().toISOString(),
      outcome,
    })
  })
}

/**
 * Increment the retryCount on an existing submission and reset it to 'submitting'.
 * Called at the start of a retry attempt — before the re-POST fires.
 *
 * @param {string} submissionId
 */
export function markSubmissionRetrying(submissionId) {
  doc.transact(() => {
    const current = submissions.get(submissionId)
    if (!current) return
    submissions.set(submissionId, {
      ...current,
      status: 'submitting',
      resolvedAt: null,
      outcome: null,
      retryCount: (current.retryCount ?? 0) + 1,
    })
  })
}

/**
 * Read all submissions as a plain JS array, sorted by submittedAt descending.
 * Non-reactive — use useSubmissions() hook for reactive reads.
 */
export function readAllSubmissions() {
  const result = []
  submissions.forEach((value, key) => {
    result.push({ submissionId: key, ...value })
  })
  return result.sort((a, b) =>
    new Date(b.submittedAt) - new Date(a.submittedAt)
  )
}
