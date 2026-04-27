import { useState } from 'react'
import { IntakeForm } from './components/IntakeForm/IntakeForm'
import { OfflineBanner } from './components/OfflineBanner'
import { PersistenceIndicator } from './components/PersistenceIndicator'
import { useOnlineStatus, useSubmissionCount } from './hooks/useYjs'

/**
 * App — shell for fhir-seam
 *
 * Phase 1 views: Intake (form), About (architectural context)
 * Phase 5 views: Submissions (history), will add nav badge
 *
 * The seam diagram below mirrors the spec — client owns the record,
 * server is consulted once at submission, never again.
 */
function App() {
  const [view, setView] = useState('intake')
  const isOnline = useOnlineStatus()
  const submissionCount = useSubmissionCount()

  return (
    <div className="min-h-screen bg-clinical-50">
      {/* Online status banner — above everything */}
      <OfflineBanner />

      {/* Header */}
      <header className="bg-white border-b border-clinical-200 px-6 py-4">
        <div className="max-w-2xl mx-auto flex items-center justify-between">
          <div>
            <h1 className="text-base font-semibold text-clinical-900 tracking-tight">
              Patient Intake
            </h1>
            <p className="text-xs text-clinical-400 font-mono mt-0.5">
              fhir-seam · local-first prototype
            </p>
          </div>

          <div className="flex items-center gap-1">
            {/* Online status dot */}
            <span className={`w-1.5 h-1.5 rounded-full mr-2 ${
              isOnline ? 'bg-emerald-400' : 'bg-amber-400'
            }`} />

            <NavButton
              active={view === 'intake'}
              onClick={() => setView('intake')}
            >
              Intake Form
            </NavButton>

            {/* Submission history — shows badge after first submission */}
            <NavButton
              active={view === 'submissions'}
              onClick={() => setView('submissions')}
            >
              Submissions
              {submissionCount > 0 && (
                <span className="ml-1.5 bg-clinical-700 text-white text-xs font-mono
                                 px-1.5 py-0.5 rounded-full leading-none">
                  {submissionCount}
                </span>
              )}
            </NavButton>

            <NavButton
              active={view === 'about'}
              onClick={() => setView('about')}
            >
              About
            </NavButton>
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="max-w-2xl mx-auto px-6 py-8">
        {view === 'intake' && (
          <>
            {/* Phase 1 persistence confirmation header */}
            <div className="mb-6 flex items-center justify-between">
              <div>
                <h2 className="text-xl font-semibold text-clinical-900">
                  Health History & Intake
                </h2>
                <p className="text-sm text-clinical-500 mt-1">
                  Your information is saved automatically on this device.
                </p>
              </div>
              <PersistenceIndicator />
            </div>
            <IntakeForm />
          </>
        )}

        {view === 'submissions' && (
          <SubmissionsPlaceholder />
        )}

        {view === 'about' && (
          <AboutView />
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-clinical-200 mt-16 px-6 py-6">
        <div className="max-w-2xl mx-auto text-xs text-clinical-400 font-mono">
          <p>fhir-seam · Prototype 3 · Systems of Thought · Local-First Series</p>
          <p className="mt-1">
            Your intake data lives on this device only. Nothing is sent to any server until you submit.
          </p>
        </div>
      </footer>
    </div>
  )
}

// ─── Nav helper ───────────────────────────────────────────────────────────────

function NavButton({ active, onClick, children }) {
  return (
    <button
      onClick={onClick}
      className={`px-3 py-1.5 rounded text-xs font-medium transition-colors flex items-center
        ${active
          ? 'bg-clinical-900 text-white'
          : 'text-clinical-600 hover:bg-clinical-100'
        }`}
    >
      {children}
    </button>
  )
}

// ─── View Placeholders (replaced in later phases) ────────────────────────────

function SubmissionsPlaceholder() {
  const count = useSubmissionCount()
  return (
    <div className="intake-section text-center py-12">
      <p className="text-clinical-500 text-sm">
        {count === 0
          ? 'No submissions yet. Complete and submit the intake form to see your submission history here.'
          : `${count} submission${count !== 1 ? 's' : ''} — full view coming in Phase 5.`}
      </p>
      <p className="text-xs text-clinical-400 font-mono mt-2">
        Submissions view · Phase 5
      </p>
    </div>
  )
}

function AboutView() {
  return (
    <div className="space-y-6">
      <div className="intake-section">
        <h2 className="section-title">The Architectural Argument</h2>
        <div className="space-y-4 text-sm text-clinical-700 leading-relaxed">
          <p>
            <strong>fhir-seam</strong> is the third prototype in the Systems of Thought local-first series,
            following the AI Governance Window Tracker and checkout-seam.
          </p>
          <p>
            The argument: local-first architecture is appropriate for healthcare intake. Patient data can live
            on the patient's device, work offline in low-connectivity environments, and cross the seam into
            institutional systems exactly once — at submission — with full local preservation if the seam fails.
          </p>

          <div className="bg-clinical-50 rounded p-4 font-mono text-xs text-clinical-600 border border-clinical-200">
            client (Y.js/IndexedDB) ──FHIR Bundle POST──▶ mock EHR ──▶ client (Y.js/IndexedDB)
          </div>

          <p>
            The server is stateless. The client owns the record. If the POST fails, the intake bundle is
            preserved locally and the failure is surfaced legibly. The server is never consulted again
            after a successful submission.
          </p>

          <h3 className="font-semibold text-clinical-800 pt-2">What's novel relative to checkout-seam</h3>
          <ul className="space-y-2 text-clinical-600">
            <li><strong>Harder error state:</strong> In commerce, failure means try again. In healthcare, failure means a clinical record was not received by the provider. The stakes are higher.</li>
            <li><strong>Write-before-POST:</strong> The FHIR bundle is written to IndexedDB before the network request fires. The patient cannot lose their data.</li>
            <li><strong>Format translation:</strong> Local state must be translated into FHIR R4 format — a Patient resource plus a QuestionnaireResponse — before crossing the seam.</li>
            <li><strong>Richer failure taxonomy:</strong> Success / validation error (retryable) / transient error (retryable) / permanent failure — each with appropriate UI and clinical language.</li>
          </ul>
        </div>
      </div>

      <div className="intake-section">
        <h2 className="section-title">Build Phases</h2>
        <div className="space-y-2 font-mono text-xs text-clinical-600">
          {[
            ['1', 'Scaffold + Data Model', 'current', '✓ complete'],
            ['2', 'Intake Form UI', 'next', ''],
            ['3', 'FHIR Bundle Construction', 'planned', ''],
            ['4', 'Mock FHIR Endpoint', 'planned', ''],
            ['5', 'Submission State Machine', 'planned', ''],
            ['6', 'Deployment', 'planned', ''],
          ].map(([phase, label, status, badge]) => (
            <div key={phase} className="flex items-center gap-3">
              <span className="text-clinical-400">Phase {phase}</span>
              <span className={status === 'current' ? 'text-clinical-900 font-medium' : ''}>{label}</span>
              {badge && <span className="text-emerald-600">{badge}</span>}
              {status === 'current' && !badge && <span className="text-amber-600">in progress</span>}
            </div>
          ))}
        </div>
      </div>

      <div className="intake-section">
        <h2 className="section-title">Local-First Series</h2>
        <div className="space-y-2 font-mono text-xs text-clinical-600">
          <div>Prototype 1 — AI Governance Window Tracker · infinitydrive.net</div>
          <div>Prototype 2 — checkout-seam · checkout-seam.vercel.app</div>
          <div className="text-clinical-900 font-medium">Prototype 3 — fhir-seam · this prototype</div>
        </div>
      </div>
    </div>
  )
}

export default App
