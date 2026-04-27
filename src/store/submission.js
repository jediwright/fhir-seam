/**
 * submission.js — Submission state machine
 *
 * fhir-seam / Systems of Thought — Local-First Prototype Series (Prototype 3)
 *
 * Phase 1: Stub with state constants and status helpers.
 * Phase 5: Full state machine — writeSubmissionPending, POST, resolveSubmission, retry.
 *
 * State machine:
 *   idle
 *     └─▶ [user submits] ──▶ submitting
 *                               ├─▶ [HTTP 200] ──▶ accepted (terminal)
 *                               ├─▶ [HTTP 422] ──▶ failed-retryable
 *                               ├─▶ [HTTP 503] ──▶ failed-retryable (retry after delay)
 *                               ├─▶ [HTTP 500] ──▶ failed-permanent (terminal)
 *                               └─▶ [network error] ──▶ failed-retryable
 *
 * Write-before-POST invariant: the full FHIR bundle is written to the submissions
 * Y.Map before the POST fires. The client cannot lose intake data to a failed request.
 */

// ─── Status Constants ─────────────────────────────────────────────────────────

export const SUBMISSION_STATUS = {
  SUBMITTING:       'submitting',
  ACCEPTED:         'accepted',
  FAILED_RETRYABLE: 'failed-retryable',
  FAILED_PERMANENT: 'failed-permanent',
}

// ─── Status Helpers ───────────────────────────────────────────────────────────

/** Returns true if the submission is in a terminal state (no retry possible). */
export function isTerminal(status) {
  return status === SUBMISSION_STATUS.ACCEPTED ||
         status === SUBMISSION_STATUS.FAILED_PERMANENT
}

/** Returns true if the submission can be retried. */
export function isRetryable(status) {
  return status === SUBMISSION_STATUS.FAILED_RETRYABLE
}

/** Returns true if the submission is currently in flight. */
export function isSubmitting(status) {
  return status === SUBMISSION_STATUS.SUBMITTING
}

/**
 * Map an HTTP status code to a submission status.
 * Used by the seam POST handler (Phase 5).
 *
 * @param {number} httpStatus
 * @returns {string} One of SUBMISSION_STATUS values
 */
export function httpStatusToSubmissionStatus(httpStatus) {
  if (httpStatus === 200) return SUBMISSION_STATUS.ACCEPTED
  if (httpStatus === 422) return SUBMISSION_STATUS.FAILED_RETRYABLE  // validation error — fix and retry
  if (httpStatus === 503) return SUBMISSION_STATUS.FAILED_RETRYABLE  // transient — retry after delay
  if (httpStatus === 500) return SUBMISSION_STATUS.FAILED_PERMANENT  // server exception — contact clinic
  // Network error, timeout, etc. — treated as retryable (offline or transient)
  return SUBMISSION_STATUS.FAILED_RETRYABLE
}

/**
 * Returns human-readable label and description for a submission status.
 * Used by SubmissionStatus and SubmissionHistory components (Phase 5).
 *
 * @param {string} status
 */
export function statusDisplay(status) {
  switch (status) {
    case SUBMISSION_STATUS.SUBMITTING:
      return {
        label: 'Submitting',
        description: 'Sending intake to the clinic system…',
        color: 'amber',
      }
    case SUBMISSION_STATUS.ACCEPTED:
      return {
        label: 'Accepted',
        description: 'Your intake was received by the clinic.',
        color: 'emerald',
      }
    case SUBMISSION_STATUS.FAILED_RETRYABLE:
      return {
        label: 'Failed — retry available',
        description: 'The clinic system did not receive your intake. Your data is preserved. You can retry.',
        color: 'red',
      }
    case SUBMISSION_STATUS.FAILED_PERMANENT:
      return {
        label: 'Failed — contact clinic',
        description: 'Your intake could not be processed. Your data is saved locally. Please contact the clinic directly.',
        color: 'purple',
      }
    default:
      return { label: status, description: '', color: 'gray' }
  }
}

// ─── Phase 5 Placeholder ──────────────────────────────────────────────────────
// submitIntake() and retrySubmission() are implemented in Phase 5.
// They will import from ydoc.js (writeSubmissionPending, resolveSubmission, etc.)
// and from lib/fhir.js (buildIntakeBundle).
