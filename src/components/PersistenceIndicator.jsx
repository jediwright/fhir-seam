import { useIntakeMeta } from '../hooks/useYjs'

/**
 * PersistenceIndicator — Phase 1 acceptance criteria component.
 *
 * Shows the lastModifiedAt timestamp from intake.meta to confirm that
 * Y.js + IndexedDB persistence is working. If this timestamp survives
 * a tab close and browser restart, Phase 1 acceptance criteria are met.
 *
 * This component is visible during Phase 1–2 and removed before deployment.
 */
export function PersistenceIndicator() {
  const meta = useIntakeMeta()

  if (!meta) {
    return (
      <div className="text-xs font-mono text-clinical-400 flex items-center gap-1.5">
        <span className="w-1.5 h-1.5 rounded-full bg-gray-300 inline-block" />
        No data saved yet — start filling the form
      </div>
    )
  }

  const lastModified = new Date(meta.lastModifiedAt)
  const formattedTime = lastModified.toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  })
  const formattedDate = lastModified.toLocaleDateString([], {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })

  return (
    <div className="text-xs font-mono text-clinical-500 flex items-center gap-1.5">
      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block animate-pulse" />
      Saved locally · {formattedDate} at {formattedTime}
      <span className="text-clinical-300 ml-1">· v{meta.formVersion}</span>
    </div>
  )
}
