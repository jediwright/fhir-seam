/**
 * api/intake.js — Mock FHIR R4 endpoint (Vercel serverless)
 *
 * fhir-seam / Systems of Thought — Local-First Prototype Series (Prototype 3)
 *
 * Phase 1: Stub with correct structure and CORS headers.
 * Phase 4: Full implementation with:
 *   - FHIR Bundle validation (resourceType, entry structure, required fields)
 *   - x-fhir-mock-mode header support for all four response modes
 *   - OperationOutcome responses in all cases (success and failure)
 *   - Realistic failure taxonomy (200, 422, 503, 500)
 *
 * The endpoint is deliberately stateless:
 *   - Accepts FHIR Bundle POST
 *   - Validates structure
 *   - Returns OperationOutcome
 *   - Writes nothing to any database
 *
 * The client receives the response and writes the outcome to local Y.js profile.
 *
 * x-fhir-mock-mode header values (Phase 4):
 *   success           → HTTP 200, informational OperationOutcome
 *   validation-error  → HTTP 422, error OperationOutcome with field expression
 *   server-unavailable → HTTP 503, fatal OperationOutcome (transient code)
 *   permanent-failure  → HTTP 500, fatal OperationOutcome (exception code)
 */

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, x-fhir-mock-mode',
  'Content-Type': 'application/fhir+json',
}

export default function handler(req, res) {
  // Handle preflight
  if (req.method === 'OPTIONS') {
    Object.entries(CORS_HEADERS).forEach(([k, v]) => res.setHeader(k, v))
    return res.status(204).end()
  }

  if (req.method !== 'POST') {
    return res.status(405).json(operationOutcome('error', 'not-supported', 'Method not allowed'))
  }

  Object.entries(CORS_HEADERS).forEach(([k, v]) => res.setHeader(k, v))

  // Phase 1 stub: always return success
  // Phase 4: parse x-fhir-mock-mode and validate bundle structure
  const mockMode = req.headers['x-fhir-mock-mode'] ?? 'success'

  // Placeholder — Phase 4 will route by mockMode
  return res.status(200).json({
    resourceType: 'OperationOutcome',
    id: crypto.randomUUID(),
    issue: [{
      severity: 'information',
      code: 'informational',
      diagnostics: 'Intake bundle accepted. EHR record created. [Phase 1 stub]',
      details: { text: 'Patient and QuestionnaireResponse resources written successfully.' }
    }]
  })
}

// ─── OperationOutcome helpers (Phase 4) ──────────────────────────────────────

function operationOutcome(severity, code, diagnostics, expression = null) {
  const issue = { severity, code, diagnostics }
  if (expression) issue.expression = expression
  return { resourceType: 'OperationOutcome', issue: [issue] }
}
