/**
 * useValidation.js — Touched-field validation for the intake form
 *
 * fhir-seam / Phase 2
 *
 * Design principle: errors only surface after a field has been touched (blurred).
 * The form does not open in an error state — patients fill fields, move on,
 * and errors appear only when they've left a required field empty.
 *
 * Usage:
 *   const { touched, touch, errors, showError } = useValidation(rules)
 *
 *   rules: { fieldName: (value) => 'error message' | null }
 *   values: current field values object
 *
 *   touch(fieldName)     — call onBlur to mark a field as touched
 *   showError(fieldName) — returns error string if touched + invalid, else null
 *   hasErrors            — true if any rule currently fails (regardless of touched)
 *   touchAll()           — mark all fields touched (call before submit attempt)
 */

import { useState, useCallback } from 'react'

/**
 * @param {Object} rules   - { fieldName: (value) => string|null }
 * @param {Object} values  - current values for all fields in rules
 */
export function useValidation(rules, values) {
  const [touched, setTouched] = useState({})

  const touch = useCallback((field) => {
    setTouched(prev => ({ ...prev, [field]: true }))
  }, [])

  const touchAll = useCallback(() => {
    const all = {}
    Object.keys(rules).forEach(k => { all[k] = true })
    setTouched(all)
  }, [rules])

  // Compute all current errors regardless of touched state
  const errors = {}
  Object.entries(rules).forEach(([field, validate]) => {
    const error = validate(values[field])
    if (error) errors[field] = error
  })

  // showError: only show if the field has been touched
  const showError = (field) => (touched[field] ? errors[field] ?? null : null)

  const hasErrors = Object.keys(errors).length > 0

  return { touched, touch, touchAll, errors, showError, hasErrors }
}

// ─── Validation Rules ─────────────────────────────────────────────────────────

export const demographicsRules = {
  firstName:   (v) => !v?.trim() ? 'First name is required' : null,
  lastName:    (v) => !v?.trim() ? 'Last name is required' : null,
  dateOfBirth: (v) => !v?.trim() ? 'Date of birth is required' : null,
  gender:      (v) => !v?.trim() ? 'Gender is required' : null,
}

export const clinicalRules = {
  reasonForVisit: (v) => !v?.trim() ? 'Reason for visit is required' : null,
}

export const insuranceRules = {
  provider: (v) => !v?.trim() ? 'Insurance provider is required' : null,
  memberId: (v) => !v?.trim() ? 'Member ID is required' : null,
}
