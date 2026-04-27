/**
 * SubmitButton — submission state machine UI.
 *
 * fhir-seam / Phase 5
 *
 * States:
 *   idle        → enabled when canSubmit, disabled otherwise
 *   submitting  → disabled, spinner
 *   accepted    → disabled, success style (terminal)
 *   retryable   → retry button enabled
 *   permanent   → disabled, permanent failure style (terminal)
 *
 * Also exposes a mock mode selector for demo/testing purposes —
 * lets the presenter switch between all four endpoint responses
 * without curl.
 */

import { useState } from 'react'
import { isSubmitting, isRetryable, isTerminal } from '../store/submission'

export function SubmitButton({
  canSubmit,
  isOnline,
  isComplete,
  currentSubmission,
  onSubmit,
  onRetry,
}) {
  const [mockMode, setMockMode] = useState('success')
  const [showMockControls, setShowMockControls] = useState(false)

  const status = currentSubmission?.status ?? null
  const submitting = isSubmitting(status)
  const retryable = isRetryable(status)
  const terminal = isTerminal(status)
  const accepted = status === 'accepted'

  // Button label and style by state
  let label, btnClass, disabled

  if (submitting) {
    label = 'Submitting…'
    btnClass = 'bg-amber-600 text-white cursor-not-allowed opacity-75'
    disabled = true
  } else if (accepted) {
    label = '✓ Submitted'
    btnClass = 'bg-emerald-700 text-white cursor-not-allowed'
    disabled = true
  } else if (status === 'failed-permanent') {
    label = 'Submission failed'
    btnClass = 'bg-purple-200 text-purple-700 cursor-not-allowed'
    disabled = true
  } else if (retryable) {
    label = `Retry${currentSubmission?.retryCount > 0 ? ` (${currentSubmission.retryCount + 1})` : ''}`
    btnClass = 'bg-red-600 text-white hover:bg-red-700 active:bg-red-800'
    disabled = false
  } else if (!isOnline) {
    label = '○ Offline'
    btnClass = 'bg-clinical-100 text-clinical-400 cursor-not-allowed'
    disabled = true
  } else if (!isComplete) {
    label = 'Incomplete'
    btnClass = 'bg-clinical-100 text-clinical-400 cursor-not-allowed'
    disabled = true
  } else {
    label = 'Submit Intake'
    btnClass = 'bg-clinical-800 text-white hover:bg-clinical-900 active:bg-clinical-950'
    disabled = false
  }

  const handleClick = () => {
    if (retryable) {
      onRetry(currentSubmission.submissionId, mockMode)
    } else {
      onSubmit(mockMode)
    }
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-3">
        <button
          onClick={handleClick}
          disabled={disabled}
          className={`flex-shrink-0 px-6 py-2.5 rounded text-sm font-medium transition-colors ${btnClass}`}
        >
          {label}
        </button>

        {/* Mock mode toggle — dev/demo tool */}
        {!terminal && (
          <button
            onClick={() => setShowMockControls(v => !v)}
            className="text-xs font-mono text-clinical-300 hover:text-clinical-500 transition-colors"
            title="Toggle mock endpoint mode (dev/demo)"
          >
            {showMockControls ? '▲ mock' : '▼ mock'}
          </button>
        )}
      </div>

      {/* Mock mode selector */}
      {showMockControls && !terminal && (
        <div className="flex items-center gap-2 pl-1">
          <span className="text-xs font-mono text-clinical-400">endpoint:</span>
          {['success', 'validation-error', 'server-unavailable', 'permanent-failure'].map(mode => (
            <button
              key={mode}
              onClick={() => setMockMode(mode)}
              className={`text-xs font-mono px-2 py-0.5 rounded transition-colors
                ${mockMode === mode
                  ? 'bg-clinical-800 text-white'
                  : 'bg-clinical-100 text-clinical-500 hover:bg-clinical-200'
                }`}
            >
              {mode}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
