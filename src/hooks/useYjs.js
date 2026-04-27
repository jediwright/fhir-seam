/**
 * useYjs.js — Reactive Y.js hooks for fhir-seam
 *
 * fhir-seam / Systems of Thought — Local-First Prototype Series (Prototype 3)
 *
 * Every hook follows the same pattern:
 *   1. useState() for the reactive value
 *   2. A read() function that pulls from the Y.Map/Y.Array
 *   3. observe() on the relevant map/array, calling read() on every change
 *   4. Cleanup via unobserve() on unmount
 *
 * The attachArrayObserver() pattern is applied to useSubmissionHistory() and
 * useProfileHistory() from the start — learned from the checkout-seam cart badge bug.
 *
 * Problem it solves: when y-indexeddb hydrates the document from IndexedDB on
 * startup, it may replace Y.Array references that were created before hydration.
 * Any observer attached to the pre-hydration array reference becomes stale.
 *
 * Fix: a cartHandler (here: a map-level observer) fires on any change to the
 * parent Y.Map, detects whether the Y.Array reference changed, and re-attaches
 * the array observer to the new reference.
 *
 * See: checkout-seam session summary (April 27, 2026) — 13-minute diagnostic,
 * 21 lines added / 8 removed. Applied here from the start.
 */

import { useState, useEffect } from 'react'
import { intake, profile, submissions } from '../store/ydoc'

// ─── Intake Hooks ─────────────────────────────────────────────────────────────

/**
 * useIntakeDemographics — reactive read of intake.get('demographics')
 * Returns an object with all demographics fields (or an empty object before any write).
 */
export function useIntakeDemographics() {
  const [value, setValue] = useState(() => intake.get('demographics') ?? {})

  useEffect(() => {
    const read = () => setValue(intake.get('demographics') ?? {})
    intake.observe(read)
    read() // sync on mount in case IndexedDB already has data
    return () => intake.unobserve(read)
  }, [])

  return value
}

/**
 * useIntakeClinical — reactive read of intake.get('clinical')
 */
export function useIntakeClinical() {
  const [value, setValue] = useState(() => intake.get('clinical') ?? {})

  useEffect(() => {
    const read = () => setValue(intake.get('clinical') ?? {})
    intake.observe(read)
    read()
    return () => intake.unobserve(read)
  }, [])

  return value
}

/**
 * useIntakeInsurance — reactive read of intake.get('insurance')
 */
export function useIntakeInsurance() {
  const [value, setValue] = useState(() => intake.get('insurance') ?? {})

  useEffect(() => {
    const read = () => setValue(intake.get('insurance') ?? {})
    intake.observe(read)
    read()
    return () => intake.unobserve(read)
  }, [])

  return value
}

/**
 * useIntakeMeta — reactive read of intake.get('meta')
 * Returns { startedAt, lastModifiedAt, formVersion } or null before initMeta() runs.
 */
export function useIntakeMeta() {
  const [value, setValue] = useState(() => intake.get('meta') ?? null)

  useEffect(() => {
    const read = () => setValue(intake.get('meta') ?? null)
    intake.observe(read)
    read()
    return () => intake.unobserve(read)
  }, [])

  return value
}

/**
 * useIntakeComplete — derived reactive hook.
 * Returns { isComplete, sections } where sections maps each section to its completion status.
 * Used to gate the submission button in Phase 2.
 *
 * Required fields for submission:
 *   demographics: firstName, lastName, dateOfBirth, gender
 *   clinical: reasonForVisit (minimum — others are recommended but not required)
 *   insurance: provider, memberId (groupNumber optional)
 */
export function useIntakeComplete() {
  const demographics = useIntakeDemographics()
  const clinical = useIntakeClinical()
  const insurance = useIntakeInsurance()

  const demoComplete = !!(
    demographics.firstName?.trim() &&
    demographics.lastName?.trim() &&
    demographics.dateOfBirth?.trim() &&
    demographics.gender?.trim()
  )

  const clinicalComplete = !!(clinical.reasonForVisit?.trim())

  const insuranceComplete = !!(
    insurance.provider?.trim() &&
    insurance.memberId?.trim()
  )

  return {
    isComplete: demoComplete && clinicalComplete && insuranceComplete,
    sections: {
      demographics: demoComplete,
      clinical: clinicalComplete,
      insurance: insuranceComplete,
    }
  }
}

// ─── Profile Hooks ────────────────────────────────────────────────────────────

/**
 * useProfileIdentity — reactive read of profile.get('identity')
 * Returns { firstName, lastName } or null before first submission.
 */
export function useProfileIdentity() {
  const [value, setValue] = useState(() => profile.get('identity') ?? null)

  useEffect(() => {
    const read = () => setValue(profile.get('identity') ?? null)
    profile.observe(read)
    read()
    return () => profile.unobserve(read)
  }, [])

  return value
}

/**
 * useSubmissionHistory — reactive read of profile.get('submission_history') Y.Array
 *
 * Applies the attachArrayObserver() pattern from checkout-seam to handle the
 * stale-reference problem. The Y.Array nested inside profile may be replaced
 * by y-indexeddb during hydration — this hook detects and re-attaches.
 *
 * Returns an array of submission summary records, sorted by submittedAt descending.
 */
export function useSubmissionHistory() {
  const [value, setValue] = useState([])

  useEffect(() => {
    // Track which Y.Array we're currently observing
    let observedArr = null

    const readFromArr = () => {
      const arr = profile.get('submission_history')
      if (!arr) {
        setValue([])
        return
      }
      // toArray() returns the underlying JS objects
      const items = arr.toArray()
      setValue([...items].sort(
        (a, b) => new Date(b.submittedAt) - new Date(a.submittedAt)
      ))
    }

    // attachArrayObserver: detects if the Y.Array reference changed (post-hydration),
    // detaches from the old reference, attaches to the new one.
    const attachArrayObserver = () => {
      const arr = profile.get('submission_history')
      if (arr === observedArr) return
      // Detach from stale reference
      if (observedArr) observedArr.unobserve(readFromArr)
      observedArr = arr
      // Attach to new reference
      if (observedArr) observedArr.observe(readFromArr)
    }

    // Map-level handler: fires when profile map changes (including when y-indexeddb
    // writes the hydrated Y.Array reference back in)
    const mapHandler = () => {
      attachArrayObserver()
      readFromArr()
    }

    profile.observe(mapHandler)
    attachArrayObserver()
    readFromArr()

    return () => {
      profile.unobserve(mapHandler)
      if (observedArr) observedArr.unobserve(readFromArr)
    }
  }, [])

  return value
}

// ─── Submissions Map Hooks ────────────────────────────────────────────────────

/**
 * useSubmissions — reactive read of the full submissions map.
 * Returns an array of all submission records, sorted by submittedAt descending.
 *
 * Used by SubmissionHistory view (Phase 5).
 */
export function useSubmissions() {
  const [value, setValue] = useState([])

  useEffect(() => {
    const read = () => {
      const result = []
      submissions.forEach((v, k) => result.push({ submissionId: k, ...v }))
      setValue(
        result.sort((a, b) => new Date(b.submittedAt) - new Date(a.submittedAt))
      )
    }
    submissions.observe(read)
    read()
    return () => submissions.unobserve(read)
  }, [])

  return value
}

/**
 * useSubmission — reactive read of a single submission by ID.
 * Returns the submission record or null if not found.
 *
 * @param {string} submissionId
 */
export function useSubmission(submissionId) {
  const [value, setValue] = useState(() =>
    submissionId ? submissions.get(submissionId) ?? null : null
  )

  useEffect(() => {
    if (!submissionId) return
    const read = () => setValue(submissions.get(submissionId) ?? null)
    submissions.observe(read)
    read()
    return () => submissions.unobserve(read)
  }, [submissionId])

  return value
}

/**
 * useLatestSubmission — reactive read of the most recent submission.
 * Returns null if no submissions exist.
 *
 * Used by SubmitButton and SubmissionStatus to reflect current state.
 */
export function useLatestSubmission() {
  const all = useSubmissions()
  return all.length > 0 ? all[0] : null
}

/**
 * useSubmissionCount — reactive count of all submissions.
 * Used for the nav badge on the Submissions view (Phase 5).
 */
export function useSubmissionCount() {
  const [count, setCount] = useState(0)

  useEffect(() => {
    const read = () => setCount(submissions.size)
    submissions.observe(read)
    read()
    return () => submissions.unobserve(read)
  }, [])

  return count
}

// ─── Online Status Hook ───────────────────────────────────────────────────────

/**
 * useOnlineStatus — reactive online/offline detection.
 * Returns true if the browser reports network connectivity.
 *
 * Note: navigator.onLine can be true even when connectivity is limited.
 * This is used to gate the submit button — the FHIR POST will fail anyway
 * if truly offline, and the write-before-POST pattern ensures no data loss.
 */
export function useOnlineStatus() {
  const [isOnline, setIsOnline] = useState(navigator.onLine)

  useEffect(() => {
    const handleOnline  = () => setIsOnline(true)
    const handleOffline = () => setIsOnline(false)
    window.addEventListener('online',  handleOnline)
    window.addEventListener('offline', handleOffline)
    return () => {
      window.removeEventListener('online',  handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [])

  return isOnline
}
