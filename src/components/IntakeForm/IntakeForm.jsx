import { useEffect } from 'react'
import { initMeta } from '../../store/ydoc'
import { useIntakeComplete, useOnlineStatus } from '../../hooks/useYjs'
import { DemographicsSection } from './DemographicsSection'
import { ClinicalSection } from './ClinicalSection'
import { InsuranceSection } from './InsuranceSection'

/**
 * IntakeForm — assembles the three intake sections.
 *
 * Phase 2 additions:
 *   - Progress bar (completed sections / 3)
 *   - Section completion badges with counts
 *   - Submit area reflects online status and completion state
 *   - Submit button disabled with clear explanation when offline or incomplete
 *
 * Phase 5: Wire submission state machine into the submit button.
 */
export function IntakeForm() {
  useEffect(() => {
    initMeta()
  }, [])

  const { isComplete, sections } = useIntakeComplete()
  const isOnline = useOnlineStatus()

  const completedCount = Object.values(sections).filter(Boolean).length
  const totalSections = 3
  const progressPct = Math.round((completedCount / totalSections) * 100)

  return (
    <div className="space-y-4">

      {/* Progress bar */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <div className="flex gap-2">
            <SectionBadge label="Demographics" complete={sections.demographics} />
            <SectionBadge label="Clinical"     complete={sections.clinical} />
            <SectionBadge label="Insurance"    complete={sections.insurance} />
          </div>
          <span className="text-xs font-mono text-clinical-400">
            {completedCount}/{totalSections} sections
          </span>
        </div>
        <div className="h-1 bg-clinical-100 rounded-full overflow-hidden">
          <div
            className="h-full bg-clinical-600 rounded-full transition-all duration-500"
            style={{ width: `${progressPct}%` }}
          />
        </div>
      </div>

      <DemographicsSection />
      <ClinicalSection />
      <InsuranceSection />

      {/* Submit area — Phase 5 replaces this with the full state machine */}
      <div className="intake-section">
        <div className="flex items-center justify-between gap-4">
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-clinical-800">Submit Intake</p>
            <p className="text-xs text-clinical-400 mt-0.5">
              {!isOnline
                ? 'You are offline. Reconnect to submit — your data is saved.'
                : !isComplete
                ? 'Complete all required fields to submit.'
                : 'Ready to submit. All required fields are complete.'}
            </p>
          </div>

          <SubmitPlaceholder isComplete={isComplete} isOnline={isOnline} />
        </div>

        {/* Required fields legend */}
        <p className="text-xs text-clinical-300 mt-4 pt-3 border-t border-clinical-100">
          <span className="text-red-400">*</span> Required fields · Your data is saved locally and sent to the clinic only on submission
        </p>
      </div>
    </div>
  )
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function SectionBadge({ label, complete }) {
  return (
    <div className={`flex items-center gap-1 text-xs font-mono px-2.5 py-1 rounded-full transition-colors duration-300
      ${complete
        ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
        : 'bg-clinical-100 text-clinical-400 border border-clinical-200'
      }`}
    >
      <span className="text-xs">{complete ? '✓' : '○'}</span>
      {label}
    </div>
  )
}

function SubmitPlaceholder({ isComplete, isOnline }) {
  const ready = isComplete && isOnline

  return (
    <button
      disabled
      title={
        !isOnline ? 'Offline — reconnect to submit' :
        !isComplete ? 'Complete required fields to submit' :
        'Submission available in Phase 5'
      }
      className={`flex-shrink-0 px-6 py-2.5 rounded text-sm font-medium transition-colors
        ${ready
          ? 'bg-clinical-800 text-white opacity-60 cursor-not-allowed'
          : 'bg-clinical-100 text-clinical-400 cursor-not-allowed'
        }`}
    >
      {!isOnline ? '○ Offline' : !isComplete ? 'Incomplete' : '✓ Ready'}
    </button>
  )
}
