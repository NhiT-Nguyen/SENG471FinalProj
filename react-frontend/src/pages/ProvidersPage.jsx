import React, { useState, useEffect } from 'react'
import { appointmentApi, authApi } from '../api/client'
import { useToast } from '../hooks/useToast'
import { useAuth } from '../context/AuthContext'

function Modal({ open, onClose, title, children }) {
  if (!open) return null
  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal">
        <div className="modal-header"><h2>{title}</h2><button className="modal-close" onClick={onClose}>×</button></div>
        {children}
      </div>
    </div>
  )
}

const DAY_NAMES = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat']

export default function ProvidersPage() {
  const { isProvider } = useAuth()
  const t = useToast()

  const [providers, setProviders]   = useState([])
  const [query, setQuery]           = useState('')
  const [specialty, setSpecialty]   = useState('')
  const [loading, setLoading]       = useState(false)
  const [reqModal, setReqModal]     = useState(null)  // provider id
  const [reqForm, setReqForm]       = useState({ requested_date: '', requested_start_time: '', notes: '', availability_id: '' })
  const [providerSlots, setProviderSlots] = useState([])

  const search = async () => {
    setLoading(true)
    try {
      let data
      if (specialty) {
        data = await appointmentApi.filterBySpecialty(specialty)
      } else if (query) {
        data = await appointmentApi.searchProviders(query)
      } else {
        data = await authApi.providers()
        data = Array.isArray(data) ? data : data.results || []
      }
      // data may be availabilities with nested provider, or plain providers
      setProviders(Array.isArray(data) ? data : data.results || [])
    } catch (e) { t.error(e.message) }
    finally { setLoading(false) }
  }

  useEffect(() => { search() }, [])

  const openRequestModal = async (providerId) => {
    setReqModal(providerId)
    try {
      // Try to get provider's available slots
      const slots = await appointmentApi.availabilities()
      const arr = Array.isArray(slots) ? slots : slots.results || []
      setProviderSlots(arr.filter(s => s.provider === providerId && s.status === 'available'))
    } catch { setProviderSlots([]) }
  }

  const submitRequest = async () => {
    try {
      await appointmentApi.requestAppointment({
        healthcare_provider: reqModal,
        requested_date: reqForm.requested_date,
        requested_start_time: reqForm.requested_start_time,
        notes: reqForm.notes,
        ...(reqForm.availability_id ? { availability: reqForm.availability_id } : {}),
      })
      t.success('Appointment request sent!')
      setReqModal(null)
      setReqForm({ requested_date: '', requested_start_time: '', notes: '', availability_id: '' })
    } catch (e) { t.error(e.message) }
  }

  // Normalize: provider entry might come from availabilities (has .provider_detail) or from providers list directly
  // Returns a flat object with consistent fields
  const normalize = (item) => {
    if (item.provider_detail) {
      // Availability with nested provider_detail
      return { ...item.provider_detail, _user_id: item.provider }
    }
    if (item.specialty !== undefined || item.hospital_clinic !== undefined) {
      // Plain HealthcareProvider — user.id is what we need for requests
      return { ...item, _user_id: item.user?.id || item.user_id }
    }
    return { ...item, _user_id: item.id }
  }

  const unique = (arr) => {
    const seen = new Set()
    return arr.filter(item => {
      const p = normalize(item)
      const key = p._user_id || p.id
      if (!key || seen.has(key)) return false
      seen.add(key)
      return true
    })
  }

  const display = unique(providers)

  return (
    <div>
      <div className="page-header">
        <h1>Find Providers</h1>
        <p>Search for healthcare providers and request appointments</p>
      </div>

      {/* Search bar */}
      <div className="card" style={{ padding: 16, marginBottom: 20 }}>
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          <input
            className="form-control" style={{ flex: 1, minWidth: 180 }}
            placeholder="Search by name…" value={query}
            onChange={e => setQuery(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && search()}
          />
          <input
            className="form-control" style={{ flex: 1, minWidth: 160 }}
            placeholder="Filter by specialty…" value={specialty}
            onChange={e => setSpecialty(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && search()}
          />
          <button className="btn btn-primary" onClick={search} disabled={loading}>
            {loading ? <span className="spinner" style={{ width: 16, height: 16 }} /> : 'Search'}
          </button>
          <button className="btn btn-secondary" onClick={() => { setQuery(''); setSpecialty(''); search() }}>Reset</button>
        </div>
      </div>

      {/* Provider cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 16 }}>
        {display.length === 0 && !loading && <div className="empty-state" style={{ gridColumn: '1/-1' }}><p>No providers found</p></div>}
        {display.map((item, i) => {
          const p = normalize(item)
          const id = p._user_id || p.id || i
          return (
            <div key={id} className="card" style={{ padding: 20 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
                <div style={{
                  width: 44, height: 44, borderRadius: '50%', background: 'var(--primary)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 700, fontSize: 18,
                }}>
                  {(p.user_first_name || p.user?.first_name || p.user_username || p.user?.username || 'P')[0]?.toUpperCase()}
                </div>
                <div>
                  <div style={{ fontWeight: 600, fontSize: 15 }}>
                    Dr. {p.user_first_name || p.user?.first_name || ''} {p.user_last_name || p.user?.last_name || p.user_username || p.user?.username || ''}
                  </div>
                  {(p.specialty_display || p.specialty) && <div style={{ fontSize: 13, color: 'var(--primary)' }}>{p.specialty_display || p.specialty}</div>}
                </div>
              </div>
              {(p.hospital_clinic || p.hospital_clinic_name) && <div style={{ fontSize: 12, color: 'var(--gray-500)', marginBottom: 6 }}>🏥 {p.hospital_clinic || p.hospital_clinic_name}</div>}
              {p.years_of_experience && <div style={{ fontSize: 12, color: 'var(--gray-500)', marginBottom: 6 }}>⭐ {p.years_of_experience} years experience</div>}
              {p.bio && <div style={{ fontSize: 12, color: 'var(--gray-600)', marginBottom: 10, lineHeight: 1.5 }}>{p.bio}</div>}

              {!isProvider && (
                <button className="btn btn-primary btn-sm w-full" onClick={() => openRequestModal(id)} style={{ marginTop: 8 }}>
                  Request Appointment
                </button>
              )}
            </div>
          )
        })}
      </div>

      {/* Request modal */}
      <Modal open={!!reqModal} onClose={() => setReqModal(null)} title="Request Appointment">
        <div className="modal-body">
          {providerSlots.length > 0 && (
            <div className="form-group">
              <label className="form-label">Available Slots</label>
              <select className="form-control" value={reqForm.availability_id} onChange={e => setReqForm(f => ({ ...f, availability_id: e.target.value }))}>
                <option value="">Select a slot (optional)</option>
                {providerSlots.map(s => (
                  <option key={s.id} value={s.id}>
                    {DAY_NAMES[s.day_of_week]} {s.start_time}–{s.end_time}
                  </option>
                ))}
              </select>
            </div>
          )}
          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Preferred Date *</label>
              <input className="form-control" type="date" value={reqForm.requested_date}
                onChange={e => setReqForm(f => ({ ...f, requested_date: e.target.value }))} required />
            </div>
            <div className="form-group">
              <label className="form-label">Preferred Time *</label>
              <input className="form-control" type="time" value={reqForm.requested_start_time}
                onChange={e => setReqForm(f => ({ ...f, requested_start_time: e.target.value }))} required />
            </div>
          </div>
          <div className="form-group">
            <label className="form-label">Reason / Notes</label>
            <textarea className="form-control" rows={3} value={reqForm.notes}
              onChange={e => setReqForm(f => ({ ...f, notes: e.target.value }))} placeholder="Describe your reason for visit…" />
          </div>
        </div>
        <div className="modal-footer">
          <button className="btn btn-secondary" onClick={() => setReqModal(null)}>Cancel</button>
          <button className="btn btn-primary" onClick={submitRequest}
            disabled={!reqForm.requested_date || !reqForm.requested_start_time}>
            Send Request
          </button>
        </div>
      </Modal>
    </div>
  )
}
