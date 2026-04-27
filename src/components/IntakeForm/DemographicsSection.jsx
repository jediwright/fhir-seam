import { useIntakeDemographics } from '../../hooks/useYjs'
import { updateDemographics } from '../../store/ydoc'

/**
 * DemographicsSection — patient identity fields.
 * Save-on-change: every field change calls updateDemographics() immediately.
 * No save button. Persistence is automatic via Y.js + IndexedDB.
 */
export function DemographicsSection() {
  const demo = useIntakeDemographics()

  const set = (field) => (e) => updateDemographics({ [field]: e.target.value })

  return (
    <div className="intake-section">
      <h2 className="section-title">Patient Demographics</h2>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="field-label">
            First Name <span className="field-required">*</span>
          </label>
          <input
            type="text"
            className="field-input"
            value={demo.firstName ?? ''}
            onChange={set('firstName')}
            placeholder="Given name"
            autoComplete="given-name"
          />
        </div>
        <div>
          <label className="field-label">
            Last Name <span className="field-required">*</span>
          </label>
          <input
            type="text"
            className="field-input"
            value={demo.lastName ?? ''}
            onChange={set('lastName')}
            placeholder="Family name"
            autoComplete="family-name"
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="field-label">
            Date of Birth <span className="field-required">*</span>
          </label>
          <input
            type="date"
            className="field-input"
            value={demo.dateOfBirth ?? ''}
            onChange={set('dateOfBirth')}
            autoComplete="bday"
          />
        </div>
        <div>
          <label className="field-label">
            Gender <span className="field-required">*</span>
          </label>
          <select
            className="field-input"
            value={demo.gender ?? ''}
            onChange={set('gender')}
          >
            <option value="">Select…</option>
            <option value="male">Male</option>
            <option value="female">Female</option>
            <option value="other">Other</option>
            <option value="unknown">Prefer not to say</option>
          </select>
        </div>
      </div>

      <div>
        <label className="field-label">Phone Number</label>
        <input
          type="tel"
          className="field-input"
          value={demo.phone ?? ''}
          onChange={set('phone')}
          placeholder="(555) 000-0000"
          autoComplete="tel"
        />
      </div>

      <div>
        <label className="field-label">Address Line 1</label>
        <input
          type="text"
          className="field-input"
          value={demo.addressLine1 ?? ''}
          onChange={set('addressLine1')}
          placeholder="Street address"
          autoComplete="address-line1"
        />
      </div>

      <div>
        <label className="field-label">Address Line 2</label>
        <input
          type="text"
          className="field-input"
          value={demo.addressLine2 ?? ''}
          onChange={set('addressLine2')}
          placeholder="Apt, suite, unit (optional)"
          autoComplete="address-line2"
        />
      </div>

      <div className="grid grid-cols-5 gap-4">
        <div className="col-span-2">
          <label className="field-label">City</label>
          <input
            type="text"
            className="field-input"
            value={demo.city ?? ''}
            onChange={set('city')}
            placeholder="City"
            autoComplete="address-level2"
          />
        </div>
        <div>
          <label className="field-label">State</label>
          <input
            type="text"
            className="field-input"
            value={demo.state ?? ''}
            onChange={set('state')}
            placeholder="PA"
            maxLength={2}
            autoComplete="address-level1"
          />
        </div>
        <div className="col-span-2">
          <label className="field-label">ZIP Code</label>
          <input
            type="text"
            className="field-input"
            value={demo.zip ?? ''}
            onChange={set('zip')}
            placeholder="19103"
            autoComplete="postal-code"
          />
        </div>
      </div>
    </div>
  )
}
