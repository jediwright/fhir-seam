/**
 * useBundlePreview — reactive FHIR bundle construction from live intake state.
 *
 * fhir-seam / Phase 3
 *
 * Builds the FHIR bundle from current intake state on every change.
 * Used by the submit area to show validation state before POST,
 * and by the BundlePreview debug component.
 *
 * Returns:
 *   bundle       — the current FHIR R4 Bundle object (always present)
 *   validation   — { valid: boolean, errors: string[] }
 *   isReady      — true when bundle is valid AND form sections are complete
 */

import { intake } from '../store/ydoc'
import { buildIntakeBundle, validateBundle } from '../lib/fhir'
import { useIntakeDemographics, useIntakeClinical, useIntakeInsurance } from './useYjs'

export function useBundlePreview() {
  // Reactive reads — re-renders whenever any section changes
  useIntakeDemographics()
  useIntakeClinical()
  useIntakeInsurance()

  // Build fresh from the live Y.Map on every render
  const bundle = buildIntakeBundle(intake)
  const validation = validateBundle(bundle)

  return {
    bundle,
    validation,
    isReady: validation.valid,
  }
}
