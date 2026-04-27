/**
 * api/intake.js — Mock FHIR R4 endpoint (Vercel serverless)
 *
 * fhir-seam / Systems of Thought — Local-First Prototype Series (Prototype 3)
 *
 * x-fhir-mock-mode header:
 *   success             → HTTP 200, informational OperationOutcome (default)
 *   validation-error    → HTTP 422, field-level error OperationOutcome
 *   server-unavailable  → HTTP 503, transient error OperationOutcome
 *   permanent-failure   → HTTP 500, fatal error OperationOutcome
 */

// Disable Vercel's built-in body parser — we read and parse the raw body
// ourselves to handle application/fhir+json content type correctly.
export const config = {
  api: { bodyParser: false },
}

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, x-fhir-mock-mode',
  'Content-Type': 'application/fhir+json',
}

/** Read the raw request body and parse as JSON. */
function readBody(req) {
  return new Promise((resolve, reject) => {
    let data = ''
    req.on('data', chunk => { data += chunk })
    req.on('end', () => {
      try {
        resolve(data ? JSON.parse(data) : null)
      } catch {
        resolve(null)
      }
    })
    req.on('error', reject)
  })
}

export default async function handler(req, res) {
  // CORS preflight
  if (req.method === 'OPTIONS') {
    Object.entries(CORS_HEADERS).forEach(([k, v]) => res.setHeader(k, v))
    return res.status(204).end()
  }

  Object.entries(CORS_HEADERS).forEach(([k, v]) => res.setHeader(k, v))

  if (req.method !== 'POST') {
    return res.status(405).json(
      operationOutcome('error', 'not-supported', 'Only POST is supported on this endpoint.')
    )
  }

  // ─── Mock mode routing ──────────────────────────────────────────────────────
  const mockMode = req.headers['x-fhir-mock-mode'] ?? 'success'

  if (mockMode === 'validation-error') {
    return res.status(422).json(
      operationOutcome('error', 'invalid',
        'Missing required field: Patient.birthDate',
        ['Bundle.entry[0].resource.birthDate']
      )
    )
  }

  if (mockMode === 'server-unavailable') {
    return res.status(503).json(
      operationOutcome('fatal', 'transient',
        'EHR system temporarily unavailable. Retry after 30 seconds.'
      )
    )
  }

  if (mockMode === 'permanent-failure') {
    return res.status(500).json(
      operationOutcome('fatal', 'exception',
        'Intake bundle could not be processed. Contact clinic directly.'
      )
    )
  }

  // ─── Parse body ─────────────────────────────────────────────────────────────
  const body = await readBody(req)

  if (!body || body.resourceType !== 'Bundle') {
    return res.status(422).json(
      operationOutcome('error', 'invalid',
        'Request body must be a FHIR R4 Bundle resource.',
        ['Bundle.resourceType']
      )
    )
  }

  if (body.type !== 'transaction') {
    return res.status(422).json(
      operationOutcome('error', 'invalid',
        'Bundle.type must be "transaction".',
        ['Bundle.type']
      )
    )
  }

  if (!Array.isArray(body.entry) || body.entry.length < 2) {
    return res.status(422).json(
      operationOutcome('error', 'invalid',
        'Bundle must contain at least two entries: Patient and QuestionnaireResponse.',
        ['Bundle.entry']
      )
    )
  }

  const patientEntry = body.entry.find(e => e.resource?.resourceType === 'Patient')
  if (!patientEntry) {
    return res.status(422).json(
      operationOutcome('error', 'invalid',
        'Bundle must contain a Patient resource entry.',
        ['Bundle.entry']
      )
    )
  }

  const patientErrors = validatePatient(patientEntry.resource)
  if (patientErrors.length > 0) {
    return res.status(422).json(
      operationOutcome('error', 'invalid',
        patientErrors[0].message, [patientErrors[0].expression]
      )
    )
  }

  const qrEntry = body.entry.find(e => e.resource?.resourceType === 'QuestionnaireResponse')
  if (!qrEntry) {
    return res.status(422).json(
      operationOutcome('error', 'invalid',
        'Bundle must contain a QuestionnaireResponse resource entry.',
        ['Bundle.entry']
      )
    )
  }

  const qrErrors = validateQuestionnaireResponse(qrEntry.resource)
  if (qrErrors.length > 0) {
    return res.status(422).json(
      operationOutcome('error', 'invalid',
        qrErrors[0].message, [qrErrors[0].expression]
      )
    )
  }

  // ─── Success ────────────────────────────────────────────────────────────────
  const outcomeId = generateId()
  return res.status(200).json({
    resourceType: 'OperationOutcome',
    id: outcomeId,
    issue: [{
      severity: 'information',
      code: 'informational',
      diagnostics: 'Intake bundle accepted. EHR record created.',
      details: {
        text: `Patient and QuestionnaireResponse resources written successfully. Reference ID: ${outcomeId}`
      }
    }]
  })
}

// ─── Validators ───────────────────────────────────────────────────────────────

function validatePatient(patient) {
  const errors = []
  if (!patient.name?.[0]?.family)
    errors.push({ message: 'Missing required field: Patient.name[0].family', expression: 'Bundle.entry[0].resource.name[0].family' })
  if (!patient.name?.[0]?.given?.[0])
    errors.push({ message: 'Missing required field: Patient.name[0].given[0]', expression: 'Bundle.entry[0].resource.name[0].given[0]' })
  if (!patient.birthDate)
    errors.push({ message: 'Missing required field: Patient.birthDate', expression: 'Bundle.entry[0].resource.birthDate' })
  if (!patient.gender)
    errors.push({ message: 'Missing required field: Patient.gender', expression: 'Bundle.entry[0].resource.gender' })
  return errors
}

function validateQuestionnaireResponse(qr) {
  const errors = []
  if (!Array.isArray(qr.item) || qr.item.length === 0) {
    errors.push({ message: 'QuestionnaireResponse must contain at least one item.', expression: 'Bundle.entry[1].resource.item' })
    return errors
  }
  const reasonForVisit = qr.item.find(i => i.linkId === 'reason-for-visit')
  if (!reasonForVisit?.answer?.[0]?.valueString)
    errors.push({ message: 'Missing required item: reason-for-visit', expression: 'Bundle.entry[1].resource.item[reason-for-visit]' })
  return errors
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function operationOutcome(severity, code, diagnostics, expression = null) {
  const issue = { severity, code, diagnostics }
  if (expression) issue.expression = expression
  return { resourceType: 'OperationOutcome', issue: [issue] }
}

function generateId() {
  return `FHIR-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).slice(2, 6).toUpperCase()}`
}
