/**
 * ErrorDetail — structured FHIR OperationOutcome error display.
 *
 * fhir-seam / Phase 5
 *
 * Renders the issues array from a FHIR OperationOutcome in clinical language.
 * Severity, code, diagnostics, and field expression all surfaced if present.
 */
export function ErrorDetail({ outcome, status }) {
  if (!outcome) return null

  const issues = outcome.issue ?? []
  if (issues.length === 0) return null

  const isPermanent = status === 'failed-permanent'

  return (
    <div className={`rounded border p-3 mt-3 space-y-2
      ${isPermanent
        ? 'bg-purple-50 border-purple-200'
        : 'bg-red-50 border-red-200'
      }`}
    >
      {issues.map((issue, i) => (
        <div key={i} className="space-y-1">
          <div className="flex items-center gap-2">
            <SeverityBadge severity={issue.severity} />
            {issue.code && (
              <span className="text-xs font-mono text-clinical-400">{issue.code}</span>
            )}
          </div>
          {issue.diagnostics && (
            <p className={`text-xs leading-relaxed
              ${isPermanent ? 'text-purple-700' : 'text-red-700'}`}
            >
              {issue.diagnostics}
            </p>
          )}
          {issue.expression && issue.expression.length > 0 && (
            <p className="text-xs font-mono text-clinical-400">
              Field: {issue.expression.join(', ')}
            </p>
          )}
          {issue.details?.text && (
            <p className="text-xs text-clinical-500 italic">{issue.details.text}</p>
          )}
        </div>
      ))}
    </div>
  )
}

function SeverityBadge({ severity }) {
  const styles = {
    information: 'bg-emerald-100 text-emerald-700',
    warning:     'bg-amber-100 text-amber-700',
    error:       'bg-red-100 text-red-700',
    fatal:       'bg-purple-100 text-purple-700',
  }
  return (
    <span className={`text-xs font-mono font-medium px-1.5 py-0.5 rounded ${styles[severity] ?? 'bg-gray-100 text-gray-600'}`}>
      {severity}
    </span>
  )
}
