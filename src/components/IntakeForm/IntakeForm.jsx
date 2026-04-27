import { useEffect } from 'react'
import { initMeta } from '../../store/ydoc'
import { useIntakeComplete } from '../../hooks/useYjs'
import { DemographicsSection } from './DemographicsSection'
import { ClinicalSection } from './ClinicalSection'
import { InsuranceSection } from './InsuranceSection'

/**
 * IntakeForm — assembles the three intake sections.
 * Calls initMeta() on mount to record startedAt (idempotent).
 *
 * Phase 1: Sections + persistence confirmation.
 * Phase 2: Add OfflineBanner integration, progress indicator, submit button.
 * Phase 5: Wire submission state machine.
 */
export function IntakeForm() {
  useEffect(() => {
    initMeta()
  }, [])

  const { isComplete, sections } = useIntakeComplete()

  return (
    <div className="space-y-4">
      {/* Section completion indicators */}
      <div className="flex gap-3 pb-1">
        <SectionBadge label="Demographics" complete={sections.demographics} />
        <SectionBadge label="Clinical"     complete={sections.clinical} />
        <SectionBadge label="Insurance"    complete={sections.insurance} />
      </div>

      <DemographicsSection />
      <ClinicalSection />
      <InsuranceSection />

      {/* Phase 1 submission placeholder — replaced by SubmitButton in Phase 5 */}
      <div className="intake-section">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-clinical-700">Submit Intake</p>
            <p className="text-xs text-clinical-400 mt-0.5">
              {isComplete
                ? 'All required fields complete — submission available in Phase 5.'
                : 'Complete required fields to enable submission.'}
            </p>
          </div>
          <button
            disabled
            className="px-5 py-2 rounded bg-clinical-200 text-clinical-400 text-sm font-medium cursor-not-allowed"
          >
            {isComplete ? 'Ready (Phase 5)' : 'Incomplete'}
          </button>
        </div>
      </div>
    </div>
  )
}

function SectionBadge({ label, complete }) {
  return (
    <div className={`flex items-center gap-1.5 text-xs font-mono px-2.5 py-1 rounded-full
      ${complete
        ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
        : 'bg-clinical-100 text-clinical-400 border border-clinical-200'
      }`}
    >
      <span>{complete ? '✓' : '○'}</span>
      {label}
    </div>
  )
}
