import React, { useState, useEffect } from 'react'
import { medicalApi, authApi } from '../api/client'
import { useAuth } from '../context/AuthContext'
import { useToast } from '../hooks/useToast'

const RECORD_TYPES = ['appointment','medication','lab_test','diagnosis','procedure','vaccination','allergy','note']

const TYPE_META = {
  appointment:  { label: 'Appointment',  color: '#2563eb', bg: '#eff6ff' },
  medication:   { label: 'Medication',   color: '#0d9488', bg: '#f0fdfa' },
  lab_test:     { label: 'Lab Test',     color: '#d97706', bg: '#fffbeb' },
  diagnosis:    { label: 'Diagnosis',    color: '#dc2626', bg: '#fef2f2' },
  procedure:    { label: 'Procedure',    color: '#6b7280', bg: '#f3f4f6' },
  vaccination:  { label: 'Vaccination',  color: '#16a34a', bg: '#f0fdf4' },
  allergy:      { label: 'Allergy',      color: '#dc2626', bg: '#fef2f2' },
  note:         { label: 'Note',         color: '#6b7280', bg: '#f3f4f6' },
}

function Icon({ path, size = 15 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
      <path d={path} />
    </svg>
  )
}

function Modal({ open, onClose, title, children, maxWidth = 560 }) {
  if (!open) return null
  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal" style={{ maxWidth }}>
        <div className="modal-header">
          <h2>{title}</h2>
          <button className="modal-close" onClick={onClose}>×</button>
        </div>
        {children}
      </div>
    </div>
  )
}

export default function MedicalHistoryPage() {
  const { isProvider, isPatient } = useAuth()
  const t = useToast()
  const [records, setRecords]     = useState([])
  const [summary, setSummary]     = useState(null)
  const [loading, setLoading]     = useState(true)
  const [filter, setFilter]       = useState('all')
  const [addModal, setAddModal]   = useState(false)
  const [patients, setPatients]   = useState([])
  const [form, setForm] = useState({
    patient: '', record_type: 'note', title: '', description: '',
    recorded_date: new Date().toISOString().split('T')[0],
  })

  // Expunge state
  const [expungeTarget, setExpungeTarget] = useState(null)  // record to expunge
  const [expungeStep, setExpungeStep]     = useState('disclaimer') // 'disclaimer' | 'confirm'
  const [expungeAck, setExpungeAck]       = useState(false)
  const [expunging, setExpunging]         = useState(false)

  const reload = async () => {
    setLoading(true)
    try {
      const [recs, sum] = await Promise.allSettled([
        isPatient ? medicalApi.myHistory() : medicalApi.records(),
        medicalApi.summary(),
      ])
      const rVal = recs.value
      if (rVal) {
        if (Array.isArray(rVal)) setRecords(rVal)
        else if (rVal.medical_records) setRecords(rVal.medical_records)
        else if (rVal.results) setRecords(rVal.results)
        else setRecords([])
      }
      const sVal = sum.value
      if (sVal) setSummary(Array.isArray(sVal) ? sVal[0] : sVal)
    } finally { setLoading(false) }
  }

  useEffect(() => {
    reload()
    if (isProvider) {
      authApi.patients().then(d => setPatients(Array.isArray(d) ? d : d.results || [])).catch(() => {})
    }
  }, [isProvider, isPatient])

  const createRecord = async () => {
    try {
      await medicalApi.createRecord(form)
      t.success('Record created')
      setAddModal(false)
      reload()
    } catch (e) { t.error(e.message) }
  }

  const openExpunge = (record) => {
    setExpungeTarget(record)
    setExpungeStep('disclaimer')
    setExpungeAck(false)
  }

  const closeExpunge = () => {
    setExpungeTarget(null)
    setExpungeStep('disclaimer')
    setExpungeAck(false)
  }

  const confirmExpunge = async () => {
    if (!expungeAck) return
    setExpunging(true)
    try {
      await medicalApi.deleteRecord(expungeTarget.id)
      t.success('Record permanently expunged')
      closeExpunge()
      reload()
    } catch (e) { t.error(e.message || 'Failed to expunge record') }
    finally { setExpunging(false) }
  }

  const filtered = filter === 'all' ? records : records.filter(r => r.record_type === filter)

  return (
    <div style={{ maxWidth: 900 }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 28 }}>
        <div>
          <h1 style={{ fontFamily: 'var(--font-serif)', fontSize: 24, fontWeight: 400, color: 'var(--gray-900)', letterSpacing: '-0.01em' }}>
            Medical History
          </h1>
          <p style={{ fontSize: 13, color: 'var(--gray-400)', marginTop: 4 }}>Complete health records and history</p>
        </div>
        {isProvider && (
          <button className="btn btn-primary btn-sm" onClick={() => setAddModal(true)}>
            <Icon path="M12 5v14M5 12h14" size={14} /> Add Record
          </button>
        )}
      </div>

      {/* Summary strip */}
      {summary && (
        <div style={{
          display: 'flex',
          background: 'var(--white)',
          border: '1px solid var(--gray-150)',
          borderRadius: 14,
          overflow: 'hidden',
          marginBottom: 28,
        }}>
          {[
            { label: 'Appointments', val: summary.total_appointments },
            { label: 'Active Medications', val: summary.active_medications_count },
            { label: 'Known Allergies', val: summary.known_allergies },
            { label: 'Last Visit', val: summary.last_visit_date },
          ].filter(s => s.val !== undefined).map((s, i, arr) => (
            <div key={s.label} style={{
              flex: 1, padding: '18px 24px',
              borderRight: i < arr.length - 1 ? '1px solid var(--gray-100)' : 'none',
            }}>
              <div style={{ fontSize: 24, fontWeight: 700, color: 'var(--gray-900)', letterSpacing: '-0.03em' }}>
                {s.val ?? '—'}
              </div>
              <div style={{ fontSize: 12, color: 'var(--gray-400)', marginTop: 3 }}>{s.label}</div>
            </div>
          ))}
        </div>
      )}

      {/* Filter chips */}
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 20 }}>
        {['all', ...RECORD_TYPES].map(f => {
          const active = filter === f
          const meta = f !== 'all' ? TYPE_META[f] : null
          const activeBg    = meta ? meta.bg    : '#111827'
          const activeColor = meta ? meta.color : '#ffffff'
          return (
            <button key={f} onClick={() => setFilter(f)} style={{
              padding: '4px 12px', borderRadius: 100, fontSize: 12, border: 'none', cursor: 'pointer',
              fontWeight: 500, textTransform: 'capitalize', fontFamily: 'var(--font)',
              background: active ? activeBg : 'var(--gray-100)',
              color: active ? activeColor : 'var(--gray-500)',
              outline: active ? `1.5px solid ${activeColor}40` : 'none',
              transition: 'all .12s',
            }}>
              {f.replace(/_/g, ' ')}
            </button>
          )
        })}
      </div>

      {/* Records */}
      {loading ? (
        <div className="loading-center"><div className="spinner" /></div>
      ) : filtered.length === 0 ? (
        <div style={{
          padding: '60px 20px', textAlign: 'center', color: 'var(--gray-300)',
          border: '1px dashed var(--gray-200)', borderRadius: 12, background: 'var(--gray-25)',
        }}>
          <Icon path="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8zM14 2v6h6" size={28} />
          <p style={{ marginTop: 12, fontSize: 14 }}>No records{filter !== 'all' ? ` of type "${filter.replace(/_/g, ' ')}"` : ''}</p>
        </div>
      ) : (
        <div style={{
          background: 'var(--white)',
          border: '1px solid var(--gray-150)',
          borderRadius: 14,
          overflow: 'hidden',
        }}>
          {filtered.map((r, idx) => {
            const meta = TYPE_META[r.record_type] || TYPE_META.note
            return (
              <div key={r.id} style={{
                display: 'flex', alignItems: 'flex-start', gap: 16,
                padding: '16px 20px',
                borderBottom: idx < filtered.length - 1 ? '1px solid var(--gray-100)' : 'none',
                transition: 'background .1s',
              }}
              onMouseEnter={e => e.currentTarget.style.background = 'var(--gray-25)'}
              onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
              >
                {/* Type indicator */}
                <div style={{
                  width: 36, height: 36, borderRadius: 8, flexShrink: 0,
                  background: meta.bg, display: 'flex', alignItems: 'center', justifyContent: 'center',
                  marginTop: 1,
                }}>
                  <span style={{ fontSize: 10, fontWeight: 700, color: meta.color, letterSpacing: '0.02em', textTransform: 'uppercase' }}>
                    {meta.label.slice(0, 3)}
                  </span>
                </div>

                {/* Content */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 3 }}>
                    <span style={{
                      display: 'inline-flex', alignItems: 'center',
                      fontSize: 10, fontWeight: 600, color: meta.color,
                      background: meta.bg, padding: '1px 7px', borderRadius: 20,
                      letterSpacing: '0.04em', textTransform: 'uppercase',
                    }}>
                      {meta.label}
                    </span>
                    <span style={{ fontSize: 14, fontWeight: 600, color: 'var(--gray-900)', letterSpacing: '-0.01em' }}>{r.title}</span>
                  </div>
                  {r.description && (
                    <p style={{ fontSize: 13, color: 'var(--gray-500)', lineHeight: 1.55, marginTop: 2 }}>{r.description}</p>
                  )}
                  {r.healthcare_provider && (
                    <div style={{ fontSize: 12, color: 'var(--gray-400)', marginTop: 4 }}>Provider: {r.healthcare_provider}</div>
                  )}
                </div>

                {/* Right side */}
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 8, flexShrink: 0 }}>
                  <span style={{ fontSize: 12, color: 'var(--gray-400)', whiteSpace: 'nowrap' }}>
                    {r.recorded_date || r.created_at?.split('T')[0]}
                  </span>
                  {isProvider && (
                    <button
                      onClick={() => openExpunge(r)}
                      style={{
                        display: 'flex', alignItems: 'center', gap: 4,
                        background: 'none', border: 'none', cursor: 'pointer',
                        fontSize: 11, color: 'var(--gray-350, #adb5bd)',
                        fontFamily: 'var(--font)', padding: '2px 0',
                        transition: 'color .12s',
                      }}
                      onMouseEnter={e => e.currentTarget.style.color = '#dc2626'}
                      onMouseLeave={e => e.currentTarget.style.color = 'var(--gray-350, #adb5bd)'}
                    >
                      <Icon path="M3 6h18M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" size={12} />
                      Expunge
                    </button>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Add Record modal */}
      <Modal open={addModal} onClose={() => setAddModal(false)} title="Add Medical Record">
        <div className="modal-body">
          <div className="form-group">
            <label className="form-label">Patient *</label>
            <select className="form-control" value={form.patient} onChange={e => setForm(f => ({ ...f, patient: e.target.value }))} required>
              <option value="">Select patient…</option>
              {patients.map(p => <option key={p.id} value={p.id}>{p.user_username || p.id}</option>)}
            </select>
          </div>
          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Record Type *</label>
              <select className="form-control" value={form.record_type} onChange={e => setForm(f => ({ ...f, record_type: e.target.value }))}>
                {RECORD_TYPES.map(rt => <option key={rt} value={rt}>{rt.replace(/_/g, ' ')}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Date</label>
              <input className="form-control" type="date" value={form.recorded_date} onChange={e => setForm(f => ({ ...f, recorded_date: e.target.value }))} />
            </div>
          </div>
          <div className="form-group">
            <label className="form-label">Title *</label>
            <input className="form-control" value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} placeholder="Brief title" required />
          </div>
          <div className="form-group">
            <label className="form-label">Description</label>
            <textarea className="form-control" rows={4} value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} placeholder="Detailed description…" />
          </div>
        </div>
        <div className="modal-footer">
          <button className="btn btn-secondary" onClick={() => setAddModal(false)}>Cancel</button>
          <button className="btn btn-primary" onClick={createRecord} disabled={!form.patient || !form.title}>Create</button>
        </div>
      </Modal>

      {/* Expunge — Compliance Disclaimer modal */}
      {expungeTarget && expungeStep === 'disclaimer' && (
        <div className="modal-overlay" onClick={e => e.target === e.currentTarget && closeExpunge()}>
          <div className="modal" style={{ maxWidth: 520 }}>
            <div className="modal-header" style={{ borderBottom: '2px solid #fca5a5' }}>
              <h2 style={{ color: '#dc2626', display: 'flex', alignItems: 'center', gap: 8 }}>
                <Icon path="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0zM12 9v4M12 17h.01" size={18} />
                Compliance Notice — Record Expungement
              </h2>
              <button className="modal-close" onClick={closeExpunge}>×</button>
            </div>
            <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div style={{
                padding: '12px 14px', borderRadius: 8,
                background: '#fef2f2', border: '1px solid #fca5a5',
                fontSize: 13, color: '#7f1d1d', lineHeight: 1.65,
              }}>
                You are about to <strong>permanently expunge</strong> a medical record. This action is
                irreversible and cannot be undone.
              </div>

              <div style={{ fontSize: 13, color: 'var(--gray-600)', lineHeight: 1.7 }}>
                <p style={{ fontWeight: 600, color: 'var(--gray-800)', marginBottom: 6 }}>Legal & Regulatory Obligations</p>
                <ul style={{ paddingLeft: 18, display: 'flex', flexDirection: 'column', gap: 5 }}>
                  <li><strong>HIPAA (45 CFR §164.530(j)):</strong> Covered entities must retain health records for a minimum of six years from the date of creation or last effective date. Expunging records prematurely may constitute a HIPAA violation.</li>
                  <li><strong>Provincial / State Law:</strong> Many jurisdictions impose additional retention requirements (e.g., 10 years for adults, longer for minors). You are responsible for verifying applicable law before proceeding.</li>
                  <li><strong>Clinical Continuity:</strong> Deletion of clinical records may impair future treatment decisions and create medico-legal liability for the treating provider.</li>
                  <li><strong>Audit Trail:</strong> This expungement action will be logged with your credentials, timestamp, and the record identifier for compliance auditing.</li>
                </ul>
              </div>

              <div style={{
                padding: '12px 14px', borderRadius: 8,
                background: 'var(--gray-50)', border: '1px solid var(--gray-200)',
                fontSize: 13, color: 'var(--gray-700)',
              }}>
                <strong>Record to expunge:</strong> {expungeTarget.title}
                {expungeTarget.recorded_date && <span style={{ color: 'var(--gray-400)', marginLeft: 8 }}>({expungeTarget.recorded_date})</span>}
              </div>

              <label style={{ display: 'flex', alignItems: 'flex-start', gap: 10, cursor: 'pointer', fontSize: 13, color: 'var(--gray-700)' }}>
                <input
                  type="checkbox"
                  checked={expungeAck}
                  onChange={e => setExpungeAck(e.target.checked)}
                  style={{ width: 15, height: 15, marginTop: 1, cursor: 'pointer', flexShrink: 0 }}
                />
                I have read and understood the legal implications of record expungement. I confirm that deletion complies with applicable health data retention laws and institutional policy, and I accept full responsibility for this action.
              </label>
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={closeExpunge}>Cancel</button>
              <button
                className="btn"
                style={{
                  background: expungeAck ? '#dc2626' : 'var(--gray-200)',
                  color: expungeAck ? 'white' : 'var(--gray-400)',
                  cursor: expungeAck ? 'pointer' : 'not-allowed',
                }}
                onClick={() => expungeAck && setExpungeStep('confirm')}
                disabled={!expungeAck}
              >
                Proceed to Confirm
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Expunge — Final confirmation */}
      {expungeTarget && expungeStep === 'confirm' && (
        <div className="modal-overlay" onClick={e => e.target === e.currentTarget && closeExpunge()}>
          <div className="modal" style={{ maxWidth: 420 }}>
            <div className="modal-header">
              <h2>Final Confirmation</h2>
              <button className="modal-close" onClick={closeExpunge}>×</button>
            </div>
            <div className="modal-body">
              <p style={{ fontSize: 14, color: 'var(--gray-700)', lineHeight: 1.6 }}>
                Permanently delete <strong>"{expungeTarget.title}"</strong>?
                This record will be erased from the system immediately and cannot be recovered.
              </p>
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setExpungeStep('disclaimer')}>Back</button>
              <button className="btn btn-danger" onClick={confirmExpunge} disabled={expunging}>
                {expunging ? 'Expunging…' : 'Expunge Record'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
