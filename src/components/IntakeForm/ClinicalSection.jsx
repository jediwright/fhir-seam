import { useIntakeClinical } from '../../hooks/useYjs'
import { updateClinical } from '../../store/ydoc'
import { useValidation, clinicalRules } from '../../hooks/useValidation'
import { FieldError } from '../FieldError'

export function ClinicalSection() {
  const clinical = useIntakeClinical()
  const { touch, showError } = useValidation(clinicalRules, clinical)

  const set = (field) => (e) => updateClinical({ [field]: e.target.value })
  const blur = (field) => () => touch(field)

  return (
    <div className="intake-section">
      <h2 className="section-title">Clinical Information</h2>

      <div>
        <label className="field-label">
          Reason for Visit <span className="field-required">*</span>
        </label>
        <textarea
          className={`field-input resize-none ${showError('reasonForVisit') ? 'border-red-400 focus:ring-red-400' : ''}`}
          rows={3}
          value={clinical.reasonForVisit ?? ''}
          onChange={set('reasonForVisit')}
          onBlur={blur('reasonForVisit')}
          placeholder="Brief description of your primary concern or reason for this appointment"
        />
        <FieldError message={showError('reasonForVisit')} />
      </div>

      <div>
        <label className="field-label">Relevant Medical History</label>
        <textarea
          className="field-input resize-none"
          rows={4}
          value={clinical.medicalHistory ?? ''}
          onChange={set('medicalHistory')}
          placeholder="Previous diagnoses, surgeries, hospitalizations, or ongoing conditions relevant to this visit"
        />
      </div>

      <div>
        <label className="field-label">Current Medications</label>
        <textarea
          className="field-input resize-none"
          rows={3}
          value={clinical.currentMedications ?? ''}
          onChange={set('currentMedications')}
          placeholder="List medications, dosages, and frequency — including over-the-counter medications and supplements"
        />
      </div>

      <div>
        <label className="field-label">Known Allergies</label>
        <textarea
          className="field-input resize-none"
          rows={2}
          value={clinical.allergies ?? ''}
          onChange={set('allergies')}
          placeholder="Medication allergies, food allergies, environmental allergies — include reaction type if known"
        />
      </div>
    </div>
  )
}
