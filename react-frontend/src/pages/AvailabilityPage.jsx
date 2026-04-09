import React, { useState, useEffect } from 'react'
import { appointmentApi } from '../api/client'
import { useToast } from '../hooks/useToast'

const DAYS = ['Monday','Tuesday','Wednesday','Thursday','Friday','Saturday','Sunday']
const STATUS_COLOR = { available: 'badge-green', busy: 'badge-red', appointment_request_pending: 'badge-yellow' }

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

export default function AvailabilityPage() {
  const t = useToast()
  const [slots, setSlots]             = useState([])
  const [pending, setPending]         = useState([])
  const [loading, setLoading]         = useState(true)
  const [modal, setModal]             = useState(false)
  const [form, setForm] = useState({
    day_of_week: 1, start_time: '09:00', end_time: '17:00', is_recurring: true, status: 'available',
  })

  const reload = async () => {
    setLoading(true)
    try {
      const [my, conf] = await Promise.allSettled([
        appointmentApi.myAvailability(),
        appointmentApi.pendingConfirmations(),
      ])
      setSlots(my.value ? (Array.isArray(my.value) ? my.value : my.value.results || []) : [])
      setPending(conf.value ? (Array.isArray(conf.value) ? conf.value : conf.value.results || []) : [])
    } finally { setLoading(false) }
  }

  useEffect(() => { reload() }, [])

  const createSlot = async () => {
    try {
      await appointmentApi.createAvailability(form)
      t.success('Availability slot created')
      setModal(false)
      reload()
    } catch (e) { t.error(e.message) }
  }

  const confirm = async (id) => {
    try { await appointmentApi.confirmAvailability(id); t.success('Availability confirmed'); reload() }
    catch (e) { t.error(e.message) }
  }

  const grouped = DAYS.map((d, i) => ({
    day: d,
    slots: slots.filter(s => s.day_of_week === i),
  })).filter(g => g.slots.length > 0)

  return (
    <div>
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <h1>My Availability</h1>
          <p>Manage your weekly availability slots</p>
        </div>
        <button className="btn btn-primary" onClick={() => setModal(true)}>+ Add Slot</button>
      </div>

      {/* Pending confirmations */}
      {pending.length > 0 && (
        <div className="card" style={{ marginBottom: 20, padding: 20 }}>
          <div style={{ fontWeight: 600, marginBottom: 12 }}>⚠️ Pending Weekly Confirmations</div>
          {pending.map(p => (
            <div key={p.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 0', borderBottom: '1px solid var(--gray-100)' }}>
              <span style={{ fontSize: 13 }}>Week of {p.week_start_date || 'this week'}</span>
              <button className="btn btn-success btn-sm" onClick={() => confirm(p.id)}>Confirm</button>
            </div>
          ))}
        </div>
      )}

      {loading ? <div className="loading-center"><div className="spinner" /></div> : (
        <>
          {grouped.length === 0 ? (
            <div className="empty-state">
              <p>No availability slots yet. Add your first slot to let patients book appointments.</p>
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 16 }}>
              {grouped.map(g => (
                <div key={g.day} className="card">
                  <div className="card-header"><h3>{g.day}</h3></div>
                  <div className="card-body" style={{ padding: 0 }}>
                    {g.slots.map(s => (
                      <div key={s.id} style={{ padding: '10px 16px', borderBottom: '1px solid var(--gray-100)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div>
                          <div style={{ fontSize: 14, fontWeight: 500 }}>{s.start_time} – {s.end_time}</div>
                          <div style={{ fontSize: 11, color: 'var(--gray-400)', marginTop: 2 }}>
                            {s.is_recurring ? 'Recurring' : 'One-time'}
                          </div>
                        </div>
                        <span className={`badge ${STATUS_COLOR[s.status] || 'badge-gray'}`}>{s.status?.replace('_', ' ')}</span>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {/* Also show flat all-slots table */}
      {slots.length > 0 && (
        <div className="card table-wrap" style={{ marginTop: 24 }}>
          <div className="card-header"><h3>All Slots</h3></div>
          <table>
            <thead>
              <tr><th>Day</th><th>Start</th><th>End</th><th>Recurring</th><th>Status</th></tr>
            </thead>
            <tbody>
              {slots.map(s => (
                <tr key={s.id}>
                  <td>{DAYS[s.day_of_week]}</td>
                  <td>{s.start_time}</td>
                  <td>{s.end_time}</td>
                  <td>{s.is_recurring ? 'Yes' : 'No'}</td>
                  <td><span className={`badge ${STATUS_COLOR[s.status] || 'badge-gray'}`}>{s.status?.replace(/_/g, ' ')}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <Modal open={modal} onClose={() => setModal(false)} title="Add Availability Slot">
        <div className="modal-body">
          <div className="form-group">
            <label className="form-label">Day of Week</label>
            <select className="form-control" value={form.day_of_week} onChange={e => setForm(f => ({ ...f, day_of_week: +e.target.value }))}>
              {DAYS.map((d, i) => <option key={i} value={i}>{d}</option>)}
            </select>
          </div>
          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Start Time</label>
              <input className="form-control" type="time" value={form.start_time} onChange={e => setForm(f => ({ ...f, start_time: e.target.value }))} />
            </div>
            <div className="form-group">
              <label className="form-label">End Time</label>
              <input className="form-control" type="time" value={form.end_time} onChange={e => setForm(f => ({ ...f, end_time: e.target.value }))} />
            </div>
          </div>
          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Status</label>
              <select className="form-control" value={form.status} onChange={e => setForm(f => ({ ...f, status: e.target.value }))}>
                <option value="available">Available</option>
                <option value="busy">Busy</option>
              </select>
            </div>
            <div className="form-group" style={{ display: 'flex', alignItems: 'center', paddingTop: 24 }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', fontSize: 14 }}>
                <input type="checkbox" checked={form.is_recurring} onChange={e => setForm(f => ({ ...f, is_recurring: e.target.checked }))} />
                Recurring weekly
              </label>
            </div>
          </div>
        </div>
        <div className="modal-footer">
          <button className="btn btn-secondary" onClick={() => setModal(false)}>Cancel</button>
          <button className="btn btn-primary" onClick={createSlot}>Create Slot</button>
        </div>
      </Modal>
    </div>
  )
}
