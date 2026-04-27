/**
 * BundlePreview — debug component showing the live FHIR bundle.
 *
 * fhir-seam / Phase 3
 *
 * Renders the current FHIR R4 Bundle as formatted JSON alongside
 * client-side validation results. Visible in the About view during
 * development — confirms the pure function mapping is correct before
 * Phase 4 wires up the actual POST.
 *
 * This is the "unit test in the browser" called for in the spec:
 *   console.log(buildIntakeBundle(intake)) → now rendered in the UI.
 */

import { useState } from 'react'
import { useBundlePreview } from '../hooks/useBundlePreview'

export function BundlePreview() {
  const { bundle, validation } = useBundlePreview()
  const [expanded, setExpanded] = useState(false)

  return (
    <div className="intake-section space-y-3">
      <div className="flex items-center justify-between">
        <h2 className="section-title mb-0">FHIR Bundle Preview</h2>
        <button
          onClick={() => setExpanded(v => !v)}
          className="text-xs font-mono text-clinical-500 hover:text-clinical-800 transition-colors"
        >
          {expanded ? '▲ collapse' : '▼ expand'}
        </button>
      </div>

      {/* Validation status */}
      <div className={`rounded px-3 py-2 text-xs font-mono border ${
        validation.valid
          ? 'bg-emerald-50 border-emerald-200 text-emerald-700'
          : 'bg-red-50 border-red-200 text-red-700'
      }`}>
        {validation.valid ? (
          <span>✓ Bundle valid — ready to POST to FHIR endpoint</span>
        ) : (
          <div className="space-y-1">
            <div className="font-medium">Bundle not yet valid:</div>
            {validation.errors.map((err, i) => (
              <div key={i} className="text-red-600">· {err}</div>
            ))}
          </div>
        )}
      </div>

      {/* Bundle structure summary — always visible */}
      <div className="text-xs font-mono text-clinical-500 space-y-1">
        <div>resourceType: Bundle · type: transaction</div>
        <div>entries: {bundle.entry?.length ?? 0}</div>
        {bundle.entry?.map((entry, i) => (
          <div key={i} className="pl-3 text-clinical-400">
            [{i}] {entry.resource?.resourceType} · {entry.request?.method} {entry.request?.url}
          </div>
        ))}
      </div>

      {/* Full JSON — expandable */}
      {expanded && (
        <div className="relative">
          <pre className="text-xs font-mono bg-clinical-900 text-clinical-100 rounded p-4 overflow-auto max-h-96 leading-relaxed">
            {JSON.stringify(bundle, null, 2)}
          </pre>
          <button
            onClick={() => navigator.clipboard.writeText(JSON.stringify(bundle, null, 2))}
            className="absolute top-2 right-2 text-xs font-mono text-clinical-400 hover:text-white
                       bg-clinical-800 px-2 py-1 rounded transition-colors"
          >
            copy
          </button>
        </div>
      )}

      <p className="text-xs text-clinical-300">
        Phase 3 debug view · Updates live as you fill the form · Not visible in production
      </p>
    </div>
  )
}
