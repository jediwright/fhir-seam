import { useIntakeInsurance } from '../../hooks/useYjs'
import { updateInsurance } from '../../store/ydoc'

export function InsuranceSection() {
  const insurance = useIntakeInsurance()

  const set = (field) => (e) => updateInsurance({ [field]: e.target.value })

  return (
    <div className="intake-section">
      <h2 className="section-title">Insurance Information</h2>

      <div>
        <label className="field-label">
          Insurance Provider <span className="field-required">*</span>
        </label>
        <input
          type="text"
          className="field-input"
          value={insurance.provider ?? ''}
          onChange={set('provider')}
          placeholder="e.g. Blue Cross Blue Shield, Aetna, United Healthcare"
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="field-label">
            Member ID <span className="field-required">*</span>
          </label>
          <input
            type="text"
            className="field-input"
            value={insurance.memberId ?? ''}
            onChange={set('memberId')}
            placeholder="Member ID from your insurance card"
          />
        </div>
        <div>
          <label className="field-label">Group Number</label>
          <input
            type="text"
            className="field-input"
            value={insurance.groupNumber ?? ''}
            onChange={set('groupNumber')}
            placeholder="Group number (if applicable)"
          />
        </div>
      </div>

      <p className="text-xs text-clinical-400 mt-1">
        Insurance verification happens at the clinic. This information is sent to the provider system at submission.
      </p>
    </div>
  )
}
