/**
 * fhir.js — FHIR R4 Bundle construction
 *
 * fhir-seam / Systems of Thought — Local-First Prototype Series (Prototype 3)
 *
 * Pure function — takes the intake Y.Map state, returns a valid FHIR R4 Bundle.
 * No network calls, no side effects. Unit-testable independently of the UI.
 *
 * Phase 1: Stubs with field mapping documented.
 * Phase 3: Full implementation with all field mappings and client-side validation.
 *
 * FHIR R4 references:
 *   Patient resource:              https://hl7.org/fhir/R4/patient.html
 *   QuestionnaireResponse:         https://hl7.org/fhir/R4/questionnaireresponse.html
 *   Bundle (transaction):          https://hl7.org/fhir/R4/bundle.html
 */

// ─── Bundle Builder (Phase 3 target) ─────────────────────────────────────────

/**
 * buildIntakeBundle — constructs a FHIR R4 Bundle from intake state.
 *
 * @param {Y.Map} intake - The intake Y.Map from ydoc.js
 * @returns {Object} A valid FHIR R4 Bundle (transaction type)
 *
 * Field mapping:
 *   intake.demographics.firstName       → Patient.name[0].given[0]
 *   intake.demographics.lastName        → Patient.name[0].family
 *   intake.demographics.dateOfBirth     → Patient.birthDate (YYYY-MM-DD)
 *   intake.demographics.gender          → Patient.gender (male|female|other|unknown)
 *   intake.demographics.phone           → Patient.telecom[0].value (system: phone)
 *   intake.demographics.addressLine1    → Patient.address[0].line[0]
 *   intake.demographics.addressLine2    → Patient.address[0].line[1] (if present)
 *   intake.demographics.city            → Patient.address[0].city
 *   intake.demographics.state           → Patient.address[0].state
 *   intake.demographics.zip             → Patient.address[0].postalCode
 *
 *   intake.clinical.reasonForVisit      → QuestionnaireResponse item linkId: reason-for-visit
 *   intake.clinical.medicalHistory      → QuestionnaireResponse item linkId: medical-history
 *   intake.clinical.currentMedications  → QuestionnaireResponse item linkId: current-medications
 *   intake.clinical.allergies           → QuestionnaireResponse item linkId: allergies
 *   intake.insurance.provider           → QuestionnaireResponse item linkId: insurance-provider
 *   intake.insurance.memberId           → QuestionnaireResponse item linkId: insurance-member-id
 */
export function buildIntakeBundle(intake) {
  const demographics = intake.get('demographics') ?? {}
  const clinical     = intake.get('clinical')     ?? {}
  const insurance    = intake.get('insurance')    ?? {}

  return {
    resourceType: 'Bundle',
    type: 'transaction',
    timestamp: new Date().toISOString(),
    entry: [
      buildPatientEntry(demographics),
      buildQuestionnaireResponseEntry(clinical, insurance),
    ]
  }
}

// ─── Entry Builders ───────────────────────────────────────────────────────────

function buildPatientEntry(d) {
  const addressLines = [d.addressLine1, d.addressLine2].filter(Boolean)

  return {
    resource: {
      resourceType: 'Patient',
      name: [{
        family: d.lastName ?? '',
        given: [d.firstName ?? ''],
      }],
      birthDate: d.dateOfBirth ?? '',
      gender: normalizeGender(d.gender),
      telecom: d.phone
        ? [{ system: 'phone', value: d.phone }]
        : [],
      address: addressLines.length > 0
        ? [{
            line: addressLines,
            city: d.city ?? '',
            state: d.state ?? '',
            postalCode: d.zip ?? '',
          }]
        : [],
    },
    request: { method: 'POST', url: 'Patient' }
  }
}

function buildQuestionnaireResponseEntry(c, ins) {
  return {
    resource: {
      resourceType: 'QuestionnaireResponse',
      status: 'completed',
      item: [
        fhirItem('reason-for-visit',      c.reasonForVisit      ?? ''),
        fhirItem('medical-history',        c.medicalHistory      ?? ''),
        fhirItem('current-medications',    c.currentMedications  ?? ''),
        fhirItem('allergies',              c.allergies           ?? ''),
        fhirItem('insurance-provider',     ins.provider          ?? ''),
        fhirItem('insurance-member-id',    ins.memberId          ?? ''),
        fhirItem('insurance-group-number', ins.groupNumber       ?? ''),
      ].filter(item => item.answer[0].valueString !== ''),
    },
    request: { method: 'POST', url: 'QuestionnaireResponse' }
  }
}

function fhirItem(linkId, valueString) {
  return {
    linkId,
    answer: [{ valueString }]
  }
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

/**
 * Normalize gender to FHIR-valid values.
 * FHIR R4 Patient.gender: male | female | other | unknown
 */
function normalizeGender(gender) {
  const valid = ['male', 'female', 'other', 'unknown']
  if (!gender) return 'unknown'
  const normalized = gender.toLowerCase()
  return valid.includes(normalized) ? normalized : 'unknown'
}

// ─── Client-Side Validation (Phase 3 target) ─────────────────────────────────

/**
 * validateBundle — lightweight client-side check before POST.
 * The FHIR endpoint validates again server-side; this catches obvious gaps early.
 *
 * @param {Object} bundle - Output of buildIntakeBundle()
 * @returns {{ valid: boolean, errors: string[] }}
 */
export function validateBundle(bundle) {
  const errors = []
  const patient = bundle.entry?.[0]?.resource

  if (!patient) {
    errors.push('Missing Patient resource')
    return { valid: false, errors }
  }

  if (!patient.name?.[0]?.family) errors.push('Patient.name[0].family is required')
  if (!patient.name?.[0]?.given?.[0]) errors.push('Patient.name[0].given[0] is required')
  if (!patient.birthDate) errors.push('Patient.birthDate is required')
  if (!patient.gender) errors.push('Patient.gender is required')

  const qr = bundle.entry?.[1]?.resource
  if (!qr) {
    errors.push('Missing QuestionnaireResponse resource')
    return { valid: false, errors }
  }

  const reasonForVisit = qr.item?.find(i => i.linkId === 'reason-for-visit')
  if (!reasonForVisit?.answer?.[0]?.valueString) {
    errors.push('reason-for-visit is required')
  }

  return { valid: errors.length === 0, errors }
}
