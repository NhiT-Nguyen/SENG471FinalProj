import React, { useState, useEffect } from 'react'
import { appointmentApi } from '../api/client'
import { useToast } from '../hooks/useToast'

const DAYS = ['Monday','Tuesday','Wednesday','Thursday','Friday','Saturday','Sunday']

function Icon({ path, size = 15 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"
      style={{ flexShrink: 0 }}>
      <path d={path} />
    </svg>
  )
}

const BLANK_FORM = { day_of_week: 1, start_time: '09:00', end_time: '17:00', is_recurring: true, status: 'available' }

function SlotModal({ open, onClose, initial, onSave, title }) {
  const [form, setForm] = useState(initial || BLANK_FORM)
  useEffect(() => { setForm(initial || BLANK_FORM) }, [open, initial])
  if (!open) return null
  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal">
        <div className="modal-header">
          <h2>{title}</h2>
          <button className="modal-close" onClick={onClose}>×</button>
        </div>
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
          <button className="btn btn-secondary" onClick={onClose}>Cancel</button>
          <button className="btn btn-primary" onClick={() => onSave(form)}>Save</button>
        </div>
      </div>
    </div>
  )
}

const STATUS_META = {
  available: { label: 'Available', color: '#16a34a', bg: '#f0fdf4' },
  busy:      { label: 'Busy',      color: '#dc2626', bg: '#fef2f2' },
  appointment_request_pending: { label: 'Pending', color: '#d97706', bg: '#fffbeb' },
}

export default function AvailabilityPage() {
  const t = useToast()
  const [slots, setSlots]     = useState([])
  const [pending, setPending] = useState([])
  const [loading, setLoading] = useState(true)
  const [addModal, setAddModal]   = useState(false)
  const [editSlot, setEditSlot]   = useState(null)   // slot object to edit
  const [deleteSlot, setDeleteSlot] = useState(null) // slot to confirm delete
  const [deleting, setDeleting]   = useState(false)

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

  const handleCreate = async (form) => {
    try {
      await appointmentApi.createAvailability(form)
      t.success('Slot created')
      setAddModal(false)
      reload()
    } catch (e) { t.error(e.message) }
  }

  const handleEdit = async (form) => {
    try {
      await appointmentApi.updateAvailability(editSlot.id, form)
      t.success('Slot updated')
      setEditSlot(null)
      reload()
    } catch (e) { t.error(e.message) }
  }

  const handleDelete = async () => {
    setDeleting(true)
    try {
      await appointmentApi.deleteAvailability(deleteSlot.id)
      t.success('Slot removed')
      setDeleteSlot(null)
      reload()
    } catch (e) { t.error(e.message) }
    finally { setDeleting(false) }
  }

  const confirm = async (id) => {
    try { await appointmentApi.confirmAvailability(id); t.success('Confirmed'); reload() }
    catch (e) { t.error(e.message) }
  }

  const grouped = DAYS.map((d, i) => ({
    day: d,
    slots: slots.filter(s => s.day_of_week === i),
  })).filter(g => g.slots.length > 0)

  return (
    <div style={{ maxWidth: 900 }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 28 }}>
        <div>
          <h1 style={{ fontFamily: 'var(--font-serif)', fontSize: 24, fontWeight: 400, color: 'var(--gray-900)', letterSpacing: '-0.01em' }}>My Availability</h1>
          <p style={{ fontSize: 13, color: 'var(--gray-400)', marginTop: 4 }}>Manage your weekly schedule</p>
        </div>
        <button className="btn btn-primary btn-sm" onClick={() => setAddModal(true)}>
          <Icon path="M12 5v14M5 12h14" size={14} />
          Add Slot
        </button>
      </div>

      {/* Pending confirmations */}
      {pending.length > 0 && (
        <div style={{
          marginBottom: 24,
          padding: '14px 18px',
          borderRadius: 10,
          background: '#fffbeb',
          border: '1px solid #fde68a',
        }}>
          <div style={{ fontSize: 12, fontWeight: 600, color: '#92400e', marginBottom: 10, letterSpacing: '0.04em', textTransform: 'uppercase' }}>
            Pending Confirmations
          </div>
          {pending.map(p => (
            <div key={p.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '7px 0', borderTop: '1px solid #fde68a' }}>
              <span style={{ fontSize: 13, color: 'var(--gray-700)' }}>Week of {p.week_start_date || 'this week'}</span>
              <button className="btn btn-sm" style={{ background: '#16a34a', color: 'white', fontSize: 12 }} onClick={() => confirm(p.id)}>Confirm</button>
            </div>
          ))}
        </div>
      )}

      {/* Slots */}
      {loading ? (
        <div className="loading-center"><div className="spinner" /></div>
      ) : grouped.length === 0 ? (
        <div style={{
          padding: '60px 20px',
          textAlign: 'center',
          color: 'var(--gray-400)',
          border: '1px dashed var(--gray-200)',
          borderRadius: 12,
          background: 'var(--gray-25)',
        }}>
          <Icon path="M12 8v4l3 3M12 2a10 10 0 1 0 0 20A10 10 0 0 0 12 2z" size={32} />
          <p style={{ fontSize: 14, marginTop: 12 }}>No slots yet</p>
          <p style={{ fontSize: 13, marginTop: 4 }}>Add your first availability slot to let patients book appointments.</p>
          <button className="btn btn-primary btn-sm" style={{ marginTop: 16 }} onClick={() => setAddModal(true)}>Add Slot</button>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          {/* Column headers */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: '120px 100px 100px 90px 100px 1fr',
            padding: '8px 16px',
            fontSize: 11,
            fontWeight: 600,
            color: 'var(--gray-400)',
            letterSpacing: '0.06em',
            textTransform: 'uppercase',
          }}>
            <span>Day</span>
            <span>Start</span>
            <span>End</span>
            <span>Recurring</span>
            <span>Status</span>
            <span style={{ textAlign: 'right' }}>Actions</span>
          </div>

          {/* Rows */}
          <div style={{ background: 'var(--white)', borderRadius: 12, border: '1px solid var(--gray-150)', overflow: 'hidden' }}>
            {slots.map((s, idx) => {
              const meta = STATUS_META[s.status] || { label: s.status, color: 'var(--gray-500)', bg: 'var(--gray-100)' }
              return (
                <div key={s.id} style={{
                  display: 'grid',
                  gridTemplateColumns: '120px 100px 100px 90px 100px 1fr',
                  padding: '13px 16px',
                  alignItems: 'center',
                  borderBottom: idx < slots.length - 1 ? '1px solid var(--gray-100)' : 'none',
                  transition: 'background .1s',
                }}
                onMouseEnter={e => e.currentTarget.style.background = 'var(--gray-25)'}
                onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                >
                  <span style={{ fontSize: 13, fontWeight: 500, color: 'var(--gray-800)' }}>{DAYS[s.day_of_week]}</span>
                  <span style={{ fontSize: 13, color: 'var(--gray-700)', fontVariantNumeric: 'tabular-nums' }}>{s.start_time?.slice(0,5)}</span>
                  <span style={{ fontSize: 13, color: 'var(--gray-700)', fontVariantNumeric: 'tabular-nums' }}>{s.end_time?.slice(0,5)}</span>
                  <span style={{ fontSize: 12, color: s.is_recurring ? 'var(--gray-500)' : 'var(--gray-400)' }}>
                    {s.is_recurring ? 'Yes' : 'No'}
                  </span>
                  <span style={{
                    display: 'inline-flex', alignItems: 'center', gap: 5,
                    fontSize: 11, fontWeight: 600,
                    color: meta.color, background: meta.bg,
                    padding: '2px 8px', borderRadius: 20,
                    width: 'fit-content',
                  }}>
                    <span style={{ width: 5, height: 5, borderRadius: '50%', background: meta.color }} />
                    {meta.label}
                  </span>
                  <div style={{ display: 'flex', gap: 6, justifyContent: 'flex-end' }}>
                    <button
                      className="btn btn-ghost btn-sm"
                      style={{ color: 'var(--gray-500)', padding: '4px 8px' }}
                      title="Edit slot"
                      onClick={() => setEditSlot(s)}
                    >
                      <Icon path="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" size={14} />
                    </button>
                    <button
                      className="btn btn-ghost btn-sm"
                      style={{ color: 'var(--danger)', padding: '4px 8px' }}
                      title="Delete slot"
                      onClick={() => setDeleteSlot(s)}
                    >
                      <Icon path="M3 6h18M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" size={14} />
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Add modal */}
      <SlotModal
        open={addModal}
        onClose={() => setAddModal(false)}
        initial={BLANK_FORM}
        onSave={handleCreate}
        title="Add Availability Slot"
      />

      {/* Edit modal */}
      <SlotModal
        open={!!editSlot}
        onClose={() => setEditSlot(null)}
        initial={editSlot}
        onSave={handleEdit}
        title="Edit Slot"
      />

      {/* Delete confirm */}
      {deleteSlot && (
        <div className="modal-overlay" onClick={e => e.target === e.currentTarget && setDeleteSlot(null)}>
          <div className="modal" style={{ maxWidth: 400 }}>
            <div className="modal-header">
              <h2>Remove Slot</h2>
              <button className="modal-close" onClick={() => setDeleteSlot(null)}>×</button>
            </div>
            <div className="modal-body">
              <p style={{ fontSize: 14, color: 'var(--gray-600)', lineHeight: 1.6 }}>
                Remove <strong>{DAYS[deleteSlot.day_of_week]}</strong> {deleteSlot.start_time?.slice(0,5)} – {deleteSlot.end_time?.slice(0,5)}?
                This cannot be undone.
              </p>
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setDeleteSlot(null)}>Cancel</button>
              <button className="btn btn-danger" onClick={handleDelete} disabled={deleting}>
                {deleting ? 'Removing…' : 'Remove Slot'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
