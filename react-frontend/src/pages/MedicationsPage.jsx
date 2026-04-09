import React, { useState, useEffect, useCallback } from 'react'
import { useAuth } from '../context/AuthContext'
import { medicationApi, authApi } from '../api/client'
import { useToast } from '../hooks/useToast'

const STATUS_BADGE = { active: 'badge-green', discontinued: 'badge-red', completed: 'badge-gray' }

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

export default function MedicationsPage() {
  const { isProvider } = useAuth()
  const t = useToast()
  const [meds, setMeds]       = useState([])
  const [loading, setLoading] = useState(true)
  const [tab, setTab]         = useState('active')
  const [prescribeModal, setPrescribeModal] = useState(false)
  const [discModal, setDiscModal] = useState(null)
  const [patients, setPatients] = useState([])
  const [form, setForm] = useState({
    patient: '', name: '', dosage: '', frequency: '', start_date: '', end_date: '',
    administration_instructions: '',
  })
  const [discReason, setDiscReason] = useState('')

  const reload = useCallback(async () => {
    setLoading(true)
    try {
      const data = await medicationApi.list()
      setMeds(Array.isArray(data) ? data : data.results || [])
    } finally { setLoading(false) }
  }, [])

  useEffect(() => {
    reload()
    if (isProvider) {
      authApi.patients().then(d => setPatients(Array.isArray(d) ? d : d.results || [])).catch(() => {})
    }
  }, [reload, isProvider])

  const prescribe = async () => {
    try {
      await medicationApi.prescribe(form)
      t.success('Medication prescribed')
      setPrescribeModal(false)
      setForm({ patient: '', name: '', dosage: '', frequency: '', start_date: '', end_date: '', administration_instructions: '' })
      reload()
    } catch (e) { t.error(e.message) }
  }

  const discontinue = async () => {
    try {
      await medicationApi.discontinue(discModal, { reason: discReason })
      t.success('Medication discontinued')
      setDiscModal(null); setDiscReason('')
      reload()
    } catch (e) { t.error(e.message) }
  }

  const filtered = meds.filter(m => m.status === tab)

  const TABS = ['active', 'discontinued', 'completed']

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 }}>
        <div className="page-header" style={{ marginBottom: 0 }}>
          <h1>Medications</h1>
          <p>Track prescriptions and treatment plans</p>
        </div>
        {isProvider && (
          <button className="btn btn-primary" onClick={() => setPrescribeModal(true)}>+ Prescribe</button>
        )}
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 4, marginBottom: 20, borderBottom: '1px solid var(--gray-200)', paddingBottom: 0 }}>
        {TABS.map(tb => (
          <button key={tb} onClick={() => setTab(tb)}
            style={{
              background: 'none', border: 'none', padding: '10px 16px', fontSize: 13, fontWeight: 500,
              color: tab === tb ? 'var(--primary)' : 'var(--gray-500)',
              borderBottom: tab === tb ? '2px solid var(--primary)' : '2px solid transparent',
              marginBottom: -1, textTransform: 'capitalize',
            }}>
            {tb} ({meds.filter(m => m.status === tb).length})
          </button>
        ))}
      </div>

      {loading ? <div className="loading-center"><div className="spinner" /></div> : (
        <>
          {filtered.length === 0 ? (
            <div className="empty-state"><p>No {tab} medications</p></div>
          ) : (
            <div className="card table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>Medication</th>
                    <th>Dosage</th>
                    <th>Frequency</th>
                    <th>Start</th>
                    <th>End</th>
                    {!isProvider && <th>Prescribed By</th>}
                    {isProvider && <th>Patient</th>}
                    <th>Status</th>
                    {isProvider && tab === 'active' && <th>Actions</th>}
                  </tr>
                </thead>
                <tbody>
                  {filtered.map(m => (
                    <tr key={m.id}>
                      <td>
                        <div style={{ fontWeight: 500 }}>{m.name}</div>
                        {m.administration_instructions && <div style={{ fontSize: 11, color: 'var(--gray-400)' }}>{m.administration_instructions}</div>}
                      </td>
                      <td>{m.dosage}</td>
                      <td>{m.frequency}</td>
                      <td>{m.start_date}</td>
                      <td>{m.end_date || '—'}</td>
                      {!isProvider && <td>{m.prescribed_by_name || m.prescribed_by}</td>}
                      {isProvider && <td>{m.patient_name || m.patient}</td>}
                      <td><span className={`badge ${STATUS_BADGE[m.status] || 'badge-gray'}`}>{m.status}</span></td>
                      {isProvider && tab === 'active' && (
                        <td>
                          <button className="btn btn-danger btn-sm" onClick={() => setDiscModal(m.id)}>Discontinue</button>
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}

      {/* Prescribe modal */}
      <Modal open={prescribeModal} onClose={() => setPrescribeModal(false)} title="Prescribe Medication">
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
              <label className="form-label">Medication Name *</label>
              <input className="form-control" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="e.g. Metformin" required />
            </div>
            <div className="form-group">
              <label className="form-label">Dosage *</label>
              <input className="form-control" value={form.dosage} onChange={e => setForm(f => ({ ...f, dosage: e.target.value }))} placeholder="e.g. 500mg" required />
            </div>
          </div>
          <div className="form-group">
            <label className="form-label">Frequency *</label>
            <input className="form-control" value={form.frequency} onChange={e => setForm(f => ({ ...f, frequency: e.target.value }))} placeholder="e.g. Twice daily" required />
          </div>
          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Start Date</label>
              <input className="form-control" type="date" value={form.start_date} onChange={e => setForm(f => ({ ...f, start_date: e.target.value }))} />
            </div>
            <div className="form-group">
              <label className="form-label">End Date</label>
              <input className="form-control" type="date" value={form.end_date} onChange={e => setForm(f => ({ ...f, end_date: e.target.value }))} />
            </div>
          </div>
          <div className="form-group">
            <label className="form-label">Administration Instructions</label>
            <textarea className="form-control" rows={2} value={form.administration_instructions}
              onChange={e => setForm(f => ({ ...f, administration_instructions: e.target.value }))}
              placeholder="e.g. Take with food" />
          </div>
        </div>
        <div className="modal-footer">
          <button className="btn btn-secondary" onClick={() => setPrescribeModal(false)}>Cancel</button>
          <button className="btn btn-primary" onClick={prescribe} disabled={!form.patient || !form.name || !form.dosage || !form.frequency}>
            Prescribe
          </button>
        </div>
      </Modal>

      {/* Discontinue modal */}
      <Modal open={!!discModal} onClose={() => setDiscModal(null)} title="Discontinue Medication">
        <div className="modal-body">
          <div className="form-group">
            <label className="form-label">Reason for discontinuation</label>
            <textarea className="form-control" rows={3} value={discReason} onChange={e => setDiscReason(e.target.value)} placeholder="Optional reason…" />
          </div>
        </div>
        <div className="modal-footer">
          <button className="btn btn-secondary" onClick={() => setDiscModal(null)}>Cancel</button>
          <button className="btn btn-danger" onClick={discontinue}>Discontinue</button>
        </div>
      </Modal>
    </div>
  )
}
