/**
 * SubmissionHistory — local record of all submissions.
 *
 * fhir-seam / Phase 5
 *
 * Reads from the Y.js submissions map via useSubmissions().
 * Fully offline — no network required after the first submission.
 * This view is the "My Orders" equivalent from checkout-seam.
 */

import { useSubmissions } from '../hooks/useYjs'
import { statusDisplay } from '../store/submission'
import { ErrorDetail } from './ErrorDetail'

export function SubmissionHistory() {
  const submissions = useSubmissions()

  if (submissions.length === 0) {
    return (
      <div className="intake-section text-center py-12">
        <p className="text-clinical-500 text-sm">No submissions yet.</p>
        <p className="text-xs text-clinical-400 font-mono mt-2">
          Complete and submit the intake form to see your submission history here.
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between mb-2">
        <h2 className="text-xl font-semibold text-clinical-900">Submission History</h2>
        <span className="text-xs font-mono text-clinical-400">
          {submissions.length} submission{submissions.length !== 1 ? 's' : ''} · saved locally
        </span>
      </div>

      {submissions.map(sub => (
        <SubmissionCard key={sub.submissionId} submission={sub} />
      ))}
    </div>
  )
}

function SubmissionCard({ submission }) {
  const { submissionId, status, submittedAt, resolvedAt, outcome, retryCount, bundle } = submission
  const display = statusDisplay(status)

  const patient = bundle?.entry?.find(e => e.resource?.resourceType === 'Patient')?.resource
  const patientName = patient
    ? `${patient.name?.[0]?.given?.[0] ?? ''} ${patient.name?.[0]?.family ?? ''}`.trim()
    : 'Unknown patient'

  const submittedDate = submittedAt
    ? new Date(submittedAt).toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })
    : '—'

  const colorMap = {
    amber:   { badge: 'bg-amber-100 text-amber-700',   border: 'border-amber-200' },
    emerald: { badge: 'bg-emerald-100 text-emerald-700', border: 'border-emerald-200' },
    red:     { badge: 'bg-red-100 text-red-700',         border: 'border-red-200' },
    purple:  { badge: 'bg-purple-100 text-purple-700',   border: 'border-purple-200' },
    gray:    { badge: 'bg-gray-100 text-gray-600',       border: 'border-gray-200' },
  }
  const colors = colorMap[display.color] ?? colorMap.gray

  return (
    <div className={`intake-section border ${colors.border}`}>
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className={`badge ${colors.badge}`}>{display.label}</span>
            {retryCount > 0 && (
              <span className="text-xs font-mono text-clinical-400">
                {retryCount} retr{retryCount === 1 ? 'y' : 'ies'}
              </span>
            )}
          </div>
          <p className="text-sm font-medium text-clinical-800">{patientName}</p>
          <p className="text-xs text-clinical-400 font-mono mt-0.5">{submittedDate}</p>
        </div>
        <div className="text-right flex-shrink-0">
          <p className="text-xs font-mono text-clinical-300 truncate max-w-32" title={submissionId}>
            {submissionId.slice(0, 8)}…
          </p>
        </div>
      </div>

      {/* Accepted: show reference ID */}
      {status === 'accepted' && outcome?.id && (
        <p className="text-xs font-mono text-emerald-600 mt-2">
          Ref: {outcome.id}
        </p>
      )}

      {/* Failed: show error detail */}
      {(status === 'failed-retryable' || status === 'failed-permanent') && (
        <ErrorDetail outcome={outcome} status={status} />
      )}
    </div>
  )
}
