import { useEffect, useState } from 'react'
import { initMeta } from '../../store/ydoc'
import { useIntakeComplete, useOnlineStatus, useLatestSubmission } from '../../hooks/useYjs'
import { useBundlePreview } from '../../hooks/useBundlePreview'
import { submitIntake, retrySubmission, isTerminal } from '../../store/submission'
import { DemographicsSection } from './DemographicsSection'
import { ClinicalSection } from './ClinicalSection'
import { InsuranceSection } from './InsuranceSection'
import { SubmitButton } from '../SubmitButton'
import { SubmissionStatus } from '../SubmissionStatus'

export function IntakeForm() {
  useEffect(() => { initMeta() }, [])

  const { isComplete, sections } = useIntakeComplete()
  const isOnline = useOnlineStatus()
  const { validation, isReady } = useBundlePreview()
  const latestSubmission = useLatestSubmission()
  const [submitting, setSubmitting] = useState(false)

  const completedCount = Object.values(sections).filter(Boolean).length
  const totalSections = 3
  const progressPct = Math.round((completedCount / totalSections) * 100)

  const canSubmit = isOnline && isComplete && isReady && !submitting &&
    (!latestSubmission || !isTerminal(latestSubmission.status) && latestSubmission.status !== 'submitting')

  const handleSubmit = async (mockMode) => {
    setSubmitting(true)
    try {
      await submitIntake(mockMode === 'success' ? null : mockMode)
    } finally {
      setSubmitting(false)
    }
  }

  const handleRetry = async (submissionId, mockMode) => {
    setSubmitting(true)
    try {
      await retrySubmission(submissionId, mockMode === 'success' ? null : mockMode)
    } finally {
      setSubmitting(false)
    }
  }

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

      {/* Submit area */}
      <div className="intake-section">
        <div className="space-y-2">
          <p className="text-sm font-medium text-clinical-800">Submit Intake</p>
          <p className="text-xs text-clinical-400">
            {!isOnline
              ? 'You are offline. Reconnect to submit — your data is saved.'
              : !isComplete
              ? 'Complete all required fields to submit.'
              : latestSubmission?.status === 'accepted'
              ? 'Your intake has been received by the clinic.'
              : 'Ready to submit. Your intake will be sent to the clinic system.'}
          </p>

          {isComplete && !isReady && validation.errors.length > 0 && (
            <div className="space-y-1">
              {validation.errors.map((err, i) => (
                <p key={i} className="text-xs font-mono text-red-500">· {err}</p>
              ))}
            </div>
          )}
        </div>

        <div className="mt-4">
          <SubmitButton
            canSubmit={canSubmit}
            isOnline={isOnline}
            isComplete={isComplete}
            currentSubmission={latestSubmission}
            onSubmit={handleSubmit}
            onRetry={handleRetry}
          />
          <SubmissionStatus submission={latestSubmission} />
        </div>

        <p className="text-xs text-clinical-300 mt-4 pt-3 border-t border-clinical-100">
          <span className="text-red-400">*</span> Required fields · Your data is saved locally and sent to the clinic only on submission
        </p>
      </div>
    </div>
  )
}

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
