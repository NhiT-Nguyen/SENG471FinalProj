import React, { useState, useEffect } from 'react'
import { medicalApi, authApi } from '../api/client'
import { useAuth } from '../context/AuthContext'
import { useToast } from '../hooks/useToast'

const RECORD_TYPES = ['appointment','medication','lab_test','diagnosis','procedure','vaccination','allergy','note']
const TYPE_COLOR = {
  appointment: 'badge-blue', medication: 'badge-teal', lab_test: 'badge-yellow',
  diagnosis: 'badge-red', procedure: 'badge-gray', vaccination: 'badge-green',
  allergy: 'badge-red', note: 'badge-gray',
}

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

export default function MedicalHistoryPage() {
  const { isProvider, isPatient } = useAuth()
  const t = useToast()
  const [records, setRecords]   = useState([])
  const [summary, setSummary]   = useState(null)
  const [loading, setLoading]   = useState(true)
  const [filter, setFilter]     = useState('all')
  const [modal, setModal]       = useState(false)
  const [patients, setPatients] = useState([])
  const [form, setForm] = useState({
    patient: '', record_type: 'note', title: '', description: '', recorded_date: new Date().toISOString().split('T')[0],
  })

  const reload = async () => {
    setLoading(true)
    try {
      const [recs, sum] = await Promise.allSettled([
        isPatient ? medicalApi.myHistory() : medicalApi.records(),
        medicalApi.summary(),
      ])
      const rVal = recs.value
      // myHistory returns { appointments, medications, medical_records, ... } or flat array
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
      setModal(false)
      reload()
    } catch (e) { t.error(e.message) }
  }

  const filtered = filter === 'all' ? records : records.filter(r => r.record_type === filter)

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 }}>
        <div className="page-header" style={{ marginBottom: 0 }}>
          <h1>Medical History</h1>
          <p>Complete health records and history</p>
        </div>
        {isProvider && <button className="btn btn-primary" onClick={() => setModal(true)}>+ Add Record</button>}
      </div>

      {/* Summary */}
      {summary && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: 12, marginBottom: 24 }}>
          {[
            { label: 'Total Appointments', val: summary.total_appointments },
            { label: 'Active Medications', val: summary.active_medications_count },
            { label: 'Known Allergies', val: summary.known_allergies },
            { label: 'Chronic Conditions', val: summary.chronic_conditions },
            { label: 'Last Visit', val: summary.last_visit_date },
          ].map(({ label, val }) => val !== undefined && (
            <div key={label} className="card" style={{ padding: 14, textAlign: 'center' }}>
              <div style={{ fontSize: 20, fontWeight: 700, color: 'var(--primary)' }}>{val ?? '—'}</div>
              <div style={{ fontSize: 11, color: 'var(--gray-500)', marginTop: 2 }}>{label}</div>
            </div>
          ))}
        </div>
      )}

      {/* Filter */}
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 16 }}>
        {['all', ...RECORD_TYPES].map(f => (
          <button key={f} onClick={() => setFilter(f)}
            style={{
              padding: '5px 12px', borderRadius: 100, fontSize: 12, border: '1px solid var(--gray-200)',
              background: filter === f ? 'var(--primary)' : '#fff',
              color: filter === f ? '#fff' : 'var(--gray-600)', cursor: 'pointer', fontWeight: 500,
              textTransform: 'capitalize',
            }}>
            {f.replace('_', ' ')}
          </button>
        ))}
      </div>

      {loading ? <div className="loading-center"><div className="spinner" /></div> : (
        <>
          {filtered.length === 0 ? (
            <div className="empty-state"><p>No medical records{filter !== 'all' ? ` of type "${filter}"` : ''}</p></div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {filtered.map(r => (
                <div key={r.id} className="card" style={{ padding: 16 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12 }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                        <span className={`badge ${TYPE_COLOR[r.record_type] || 'badge-gray'}`}>{r.record_type?.replace('_', ' ')}</span>
                        <span style={{ fontWeight: 600, fontSize: 14 }}>{r.title}</span>
                      </div>
                      {r.description && <div style={{ fontSize: 13, color: 'var(--gray-600)', lineHeight: 1.5 }}>{r.description}</div>}
                      {r.healthcare_provider && <div style={{ fontSize: 12, color: 'var(--gray-400)', marginTop: 4 }}>Provider: {r.healthcare_provider}</div>}
                    </div>
                    <div style={{ fontSize: 12, color: 'var(--gray-400)', whiteSpace: 'nowrap' }}>
                      {r.recorded_date || r.created_at?.split('T')[0]}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}

      <Modal open={modal} onClose={() => setModal(false)} title="Add Medical Record">
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
                {RECORD_TYPES.map(rt => <option key={rt} value={rt}>{rt.replace('_', ' ')}</option>)}
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
          <button className="btn btn-secondary" onClick={() => setModal(false)}>Cancel</button>
          <button className="btn btn-primary" onClick={createRecord} disabled={!form.patient || !form.title}>Create</button>
        </div>
      </Modal>
    </div>
  )
}
