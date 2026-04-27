/**
 * SubmissionStatus — in-progress and terminal state display.
 *
 * fhir-seam / Phase 5
 *
 * Shown below the submit button after a submission is initiated.
 * Handles all four states: submitting, accepted, failed-retryable, failed-permanent.
 */

import { ErrorDetail } from './ErrorDetail'
import { statusDisplay } from '../store/submission'

export function SubmissionStatus({ submission }) {
  if (!submission) return null

  const { status, outcome, retryCount } = submission
  const display = statusDisplay(status)

  if (status === 'submitting') {
    return (
      <div className="flex items-center gap-2 mt-3 text-sm text-amber-700">
        <Spinner />
        <span>Sending to clinic system…</span>
      </div>
    )
  }

  if (status === 'accepted') {
    const refId = outcome?.id ?? outcome?.issue?.[0]?.details?.text?.match(/FHIR-[A-Z0-9-]+/)?.[0]
    return (
      <div className="mt-3 rounded border border-emerald-200 bg-emerald-50 p-3 space-y-1">
        <p className="text-sm font-medium text-emerald-800">✓ Intake received by clinic</p>
        <p className="text-xs text-emerald-600">
          {outcome?.issue?.[0]?.diagnostics ?? 'Your intake was accepted successfully.'}
        </p>
        {refId && (
          <p className="text-xs font-mono text-emerald-500 mt-1">Ref: {refId}</p>
        )}
      </div>
    )
  }

  if (status === 'failed-retryable' || status === 'failed-permanent') {
    return (
      <div className="mt-3 space-y-2">
        <p className={`text-xs font-medium ${
          status === 'failed-permanent' ? 'text-purple-700' : 'text-red-700'
        }`}>
          {display.description}
          {retryCount > 0 && (
            <span className="ml-2 font-mono text-clinical-400">
              (attempt {retryCount + 1})
            </span>
          )}
        </p>
        <ErrorDetail outcome={outcome} status={status} />
      </div>
    )
  }

  return null
}

function Spinner() {
  return (
    <svg className="animate-spin h-4 w-4 text-amber-600" fill="none" viewBox="0 0 24 24">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-75" fill="currentColor"
        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
    </svg>
  )
}
