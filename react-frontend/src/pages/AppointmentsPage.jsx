import React, { useState, useEffect, useCallback } from 'react'
import { useAuth } from '../context/AuthContext'
import { appointmentApi } from '../api/client'
import { useToast } from '../hooks/useToast'

/* ─── helpers ─── */
function Icon({ path, size = 15 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
      <path d={path} />
    </svg>
  )
}

function Modal({ open, onClose, title, children }) {
  if (!open) return null
  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal">
        <div className="modal-header">
          <h2>{title}</h2>
          <button className="modal-close" onClick={onClose}>×</button>
        </div>
        {children}
      </div>
    </div>
  )
}

const STATUS_META = {
  pending:   { label: 'Pending',   color: '#d97706', bg: '#fffbeb' },
  approved:  { label: 'Approved',  color: '#16a34a', bg: '#f0fdf4' },
  rejected:  { label: 'Rejected',  color: '#dc2626', bg: '#fef2f2' },
  cancelled: { label: 'Cancelled', color: '#6b7280', bg: '#f3f4f6' },
  completed: { label: 'Completed', color: '#2563eb', bg: '#eff6ff' },
}

function StatusPill({ status }) {
  const m = STATUS_META[status] || { label: status, color: 'var(--gray-500)', bg: 'var(--gray-100)' }
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 4,
      fontSize: 11, fontWeight: 600, color: m.color, background: m.bg,
      padding: '2px 8px', borderRadius: 20, letterSpacing: '0.02em',
    }}>
      <span style={{ width: 5, height: 5, borderRadius: '50%', background: m.color }} />
      {m.label}
    </span>
  )
}

/* ══════════════════════════════════════════
   CALENDAR COMPONENT
══════════════════════════════════════════ */
const DAY_NAMES = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat']
const MONTH_NAMES = ['January','February','March','April','May','June','July','August','September','October','November','December']

function CalendarView({ appointments, requests, isProvider }) {
  const today = new Date()
  const [cursor, setCursor]       = useState({ year: today.getFullYear(), month: today.getMonth() })
  const [selectedDay, setSelectedDay] = useState(null) // 'YYYY-MM-DD' string

  const { year, month } = cursor

  /* Build the grid */
  const firstDay  = new Date(year, month, 1)
  const lastDay   = new Date(year, month + 1, 0)
  const startPad  = firstDay.getDay()              // 0=Sun offset
  const totalCells = Math.ceil((startPad + lastDay.getDate()) / 7) * 7

  const cells = []
  for (let i = 0; i < totalCells; i++) {
    const dayNum = i - startPad + 1
    if (dayNum < 1 || dayNum > lastDay.getDate()) {
      cells.push(null)
    } else {
      const mm = String(month + 1).padStart(2, '0')
      const dd = String(dayNum).padStart(2, '0')
      cells.push(`${year}-${mm}-${dd}`)
    }
  }

  /* Map dates to appointment counts */
  const appointmentsByDate = {}
  ;[...appointments, ...requests].forEach(a => {
    const d = a.date || a.requested_date
    if (!d) return
    const key = d.slice(0, 10)
    if (!appointmentsByDate[key]) appointmentsByDate[key] = []
    appointmentsByDate[key].push(a)
  })

  const prev = () => setCursor(c => c.month === 0 ? { year: c.year - 1, month: 11 } : { year: c.year, month: c.month - 1 })
  const next = () => setCursor(c => c.month === 11 ? { year: c.year + 1, month: 0  } : { year: c.year, month: c.month + 1 })
  const goToday = () => { setCursor({ year: today.getFullYear(), month: today.getMonth() }); setSelectedDay(null) }

  const todayStr = `${today.getFullYear()}-${String(today.getMonth()+1).padStart(2,'0')}-${String(today.getDate()).padStart(2,'0')}`
  const selectedEvents = selectedDay ? (appointmentsByDate[selectedDay] || []) : []

  return (
    <div>
      {/* Calendar header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <button className="btn btn-ghost btn-sm" style={{ padding: '5px 8px' }} onClick={prev}>
            <Icon path="M15 18l-6-6 6-6" size={14} />
          </button>
          <div style={{ fontSize: 15, fontWeight: 600, color: 'var(--gray-900)', letterSpacing: '-0.02em', minWidth: 160 }}>
            {MONTH_NAMES[month]} {year}
          </div>
          <button className="btn btn-ghost btn-sm" style={{ padding: '5px 8px' }} onClick={next}>
            <Icon path="M9 18l6-6-6-6" size={14} />
          </button>
        </div>
        <button className="btn btn-secondary btn-sm" onClick={goToday}>Today</button>
      </div>

      {/* Month grid */}
      <div style={{
        background: 'var(--white)', border: '1px solid var(--gray-150)',
        borderRadius: 14, overflow: 'hidden',
      }}>
        {/* Day headers */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7,1fr)', borderBottom: '1px solid var(--gray-100)' }}>
          {DAY_NAMES.map(d => (
            <div key={d} style={{
              padding: '8px 4px', textAlign: 'center',
              fontSize: 11, fontWeight: 600, color: 'var(--gray-400)',
              letterSpacing: '0.06em', textTransform: 'uppercase',
            }}>{d}</div>
          ))}
        </div>

        {/* Weeks */}
        {Array.from({ length: totalCells / 7 }, (_, row) => (
          <div key={row} style={{ display: 'grid', gridTemplateColumns: 'repeat(7,1fr)', borderBottom: row < totalCells/7 - 1 ? '1px solid var(--gray-100)' : 'none' }}>
            {cells.slice(row * 7, row * 7 + 7).map((dateStr, col) => {
              if (!dateStr) return (
                <div key={col} style={{ padding: '10px 8px', minHeight: 64, background: 'var(--gray-25)' }} />
              )
              const isToday    = dateStr === todayStr
              const isSelected = dateStr === selectedDay
              const events     = appointmentsByDate[dateStr] || []
              const hasEvents  = events.length > 0

              return (
                <div
                  key={dateStr}
                  onClick={() => setSelectedDay(isSelected ? null : dateStr)}
                  style={{
                    padding: '8px 10px', minHeight: 64,
                    cursor: 'pointer',
                    background: isSelected ? 'var(--primary-light)' : 'transparent',
                    borderLeft: col > 0 ? '1px solid var(--gray-100)' : 'none',
                    transition: 'background .1s',
                    position: 'relative',
                  }}
                  onMouseEnter={e => { if (!isSelected) e.currentTarget.style.background = 'var(--gray-25)' }}
                  onMouseLeave={e => { if (!isSelected) e.currentTarget.style.background = 'transparent' }}
                >
                  {/* Day number */}
                  <div style={{
                    display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                    width: 26, height: 26, borderRadius: '50%',
                    background: isToday ? '#2563eb' : 'transparent',
                    color: isToday ? '#fff' : isSelected ? '#2563eb' : 'var(--gray-700)',
                    fontSize: 13, fontWeight: isToday || isSelected ? 700 : 400,
                  }}>
                    {parseInt(dateStr.slice(8), 10)}
                  </div>

                  {/* Event dots / count */}
                  {hasEvents && (
                    <div style={{ marginTop: 4, display: 'flex', flexDirection: 'column', gap: 2 }}>
                      {events.slice(0, 2).map((ev, i) => {
                        const status = ev.status || 'pending'
                        const color = STATUS_META[status]?.color || '#6b7280'
                        const label = isProvider
                          ? (ev.patient_username || ev.patient_name || 'Patient')
                          : (ev.provider_username || ev.provider_name || 'Provider')
                        return (
                          <div key={i} style={{
                            fontSize: 10, fontWeight: 500,
                            color: color,
                            background: STATUS_META[status]?.bg || '#f3f4f6',
                            borderRadius: 4, padding: '1px 5px',
                            overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                            maxWidth: '100%',
                          }}>
                            {ev.date ? `${(ev.time || '').slice(0,5)} ` : ''}{label}
                          </div>
                        )
                      })}
                      {events.length > 2 && (
                        <div style={{ fontSize: 10, color: 'var(--gray-400)', paddingLeft: 4 }}>
                          +{events.length - 2} more
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        ))}
      </div>

      {/* Selected day panel */}
      {selectedDay && (
        <div style={{ marginTop: 16, background: 'var(--white)', border: '1px solid var(--gray-150)', borderRadius: 12, overflow: 'hidden' }}>
          <div style={{
            padding: '12px 18px', borderBottom: '1px solid var(--gray-100)',
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--gray-800)' }}>
              {new Date(selectedDay + 'T12:00:00').toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
            </div>
            <button className="btn btn-ghost btn-sm" style={{ color: 'var(--gray-400)', padding: '2px 6px' }} onClick={() => setSelectedDay(null)}>×</button>
          </div>
          {selectedEvents.length === 0 ? (
            <div style={{ padding: '24px 18px', textAlign: 'center', color: 'var(--gray-350, #adb5bd)', fontSize: 13 }}>
              No appointments on this day
            </div>
          ) : (
            <div>
              {selectedEvents.map((ev, i) => (
                <div key={ev.id || i} style={{
                  display: 'flex', alignItems: 'center', gap: 12, padding: '12px 18px',
                  borderBottom: i < selectedEvents.length - 1 ? '1px solid var(--gray-100)' : 'none',
                }}>
                  <div style={{ fontSize: 12, color: 'var(--gray-400)', width: 44, flexShrink: 0, fontVariantNumeric: 'tabular-nums' }}>
                    {(ev.time || ev.requested_start_time || '').slice(0, 5) || '—'}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--gray-800)' }}>
                      {isProvider
                        ? `${ev.patient_username || ev.patient_name || 'Patient'}`
                        : `${ev.provider_username || ev.provider_name || 'Provider'}`}
                    </div>
                    {ev.notes && <div style={{ fontSize: 12, color: 'var(--gray-400)', marginTop: 1 }}>{ev.notes}</div>}
                  </div>
                  <StatusPill status={ev.status || 'pending'} />
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

/* ══════════════════════════════════════════
   MAIN PAGE
══════════════════════════════════════════ */
export default function AppointmentsPage() {
  const { isProvider } = useAuth()
  const t = useToast()

  const [tab, setTab]           = useState(isProvider ? 'pending' : 'my')
  const [appointments, setAppointments] = useState([])
  const [pendingReqs, setPendingReqs]   = useState([])
  const [myReqs, setMyReqs]             = useState([])
  const [history, setHistory]           = useState([])
  const [loading, setLoading]           = useState(true)
  const [notesModal, setNotesModal]     = useState(null)
  const [rejectModal, setRejectModal]   = useState(null)
  const [notesForm, setNotesForm]       = useState({})
  const [rejectReason, setRejectReason] = useState('')

  const reload = useCallback(async () => {
    setLoading(true)
    try {
      const [appts, hist, pending, mine] = await Promise.allSettled([
        appointmentApi.list(),
        appointmentApi.history(),
        isProvider ? appointmentApi.pendingRequests() : Promise.resolve([]),
        !isProvider ? appointmentApi.myRequests() : Promise.resolve([]),
      ])
      const arr = r => r.status === 'fulfilled' ? (Array.isArray(r.value) ? r.value : r.value?.results || []) : []
      setAppointments(arr(appts))
      setHistory(arr(hist))
      setPendingReqs(arr(pending))
      setMyReqs(arr(mine))
    } finally { setLoading(false) }
  }, [isProvider])

  useEffect(() => { reload() }, [reload])

  const approve = async (id) => {
    try { await appointmentApi.approveRequest(id); t.success('Approved'); reload() }
    catch (e) { t.error(e.message) }
  }

  const reject = async () => {
    try { await appointmentApi.rejectRequest(rejectModal, { rejection_reason: rejectReason }); t.success('Rejected'); setRejectModal(null); setRejectReason(''); reload() }
    catch (e) { t.error(e.message) }
  }

  const cancel = async (id) => {
    if (!confirm('Cancel this appointment request?')) return
    try { await appointmentApi.cancelRequest(id); t.success('Cancelled'); reload() }
    catch (e) { t.error(e.message) }
  }

  const saveNotes = async () => {
    try { await appointmentApi.updateNotes(notesModal.id, notesForm); t.success('Notes saved'); setNotesModal(null); reload() }
    catch (e) { t.error(e.message) }
  }

  const openNotes = (appt) => {
    setNotesModal(appt)
    setNotesForm({
      reasons_for_visit: appt.reasons_for_visit || '',
      examinations_performed: appt.examinations_performed || '',
      tests_requested: appt.tests_requested || '',
      new_medications: appt.new_medications || '',
      referrals: appt.referrals || '',
      follow_up_recommended: appt.follow_up_recommended || '',
      notes: appt.notes || '',
    })
  }

  const TABS = [
    ...(isProvider
      ? [{ id: 'pending',   label: `Requests (${pendingReqs.length})` }]
      : [{ id: 'my',        label: `My Requests (${myReqs.length})` }]),
    { id: 'scheduled', label: 'Scheduled' },
    { id: 'calendar',  label: 'Calendar' },
    { id: 'history',   label: 'History' },
  ]

  /* Clean card for appointment/request display */
  const ApptCard = ({ item, actions }) => (
    <div style={{
      display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between',
      gap: 16, padding: '16px 20px',
      transition: 'background .1s',
    }}
    onMouseEnter={e => e.currentTarget.style.background = 'var(--gray-25)'}
    onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
    >
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 3 }}>
          <span style={{ fontSize: 14, fontWeight: 600, color: 'var(--gray-900)', letterSpacing: '-0.01em' }}>
            {isProvider
              ? (item.patient_username || item.patient_name || item.patient || '—')
              : (item.provider_username
                  ? `Dr. ${item.provider_username}`
                  : item.provider_name
                      ? `Dr. ${item.provider_name}`
                      : '—')}
          </span>
          {item.status && <StatusPill status={item.status} />}
        </div>
        <div style={{ fontSize: 12, color: 'var(--gray-400)', display: 'flex', gap: 12 }}>
          <span>{item.date || item.requested_date}</span>
          {(item.time || item.requested_start_time) && (
            <span>{(item.time || item.requested_start_time).slice(0,5)}</span>
          )}
          {item.duration_minutes && <span>{item.duration_minutes} min</span>}
        </div>
        {item.notes && <div style={{ fontSize: 12, color: 'var(--gray-500)', marginTop: 4, lineHeight: 1.5 }}>{item.notes}</div>}
      </div>
      {actions && <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>{actions}</div>}
    </div>
  )

  const ListCard = ({ children, empty }) => (
    empty ? (
      <div style={{ padding: '52px 20px', textAlign: 'center', color: 'var(--gray-300)', fontSize: 13, border: '1px dashed var(--gray-200)', borderRadius: 12 }}>
        {empty}
      </div>
    ) : (
      <div style={{ background: 'var(--white)', border: '1px solid var(--gray-150)', borderRadius: 14, overflow: 'hidden' }}>
        {children}
      </div>
    )
  )

  return (
    <div style={{ maxWidth: 900 }}>
      {/* Header */}
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontFamily: 'var(--font-serif)', fontSize: 24, fontWeight: 400, color: 'var(--gray-900)', letterSpacing: '-0.01em' }}>
          Appointments
        </h1>
        <p style={{ fontSize: 13, color: 'var(--gray-400)', marginTop: 4 }}>Manage requests, schedule and history</p>
      </div>

      {/* Tabs */}
      <div className="tab-bar" style={{ marginBottom: 24 }}>
        {TABS.map(tb => (
          <button key={tb.id} className={`tab-btn ${tab === tb.id ? 'active' : ''}`} onClick={() => setTab(tb.id)}>
            {tb.label}
          </button>
        ))}
      </div>

      {loading ? <div className="loading-center"><div className="spinner" /></div> : (
        <>
          {/* Pending / My requests */}
          {(tab === 'pending' || tab === 'my') && (() => {
            const items = isProvider ? pendingReqs : myReqs
            return items.length === 0
              ? <div style={{ padding: '52px 20px', textAlign: 'center', color: 'var(--gray-300)', fontSize: 13, border: '1px dashed var(--gray-200)', borderRadius: 12 }}>
                  {isProvider ? 'No pending requests' : 'No appointment requests'}
                </div>
              : <div style={{ background: 'var(--white)', border: '1px solid var(--gray-150)', borderRadius: 14, overflow: 'hidden' }}>
                  {items.map((req, i) => (
                    <div key={req.id} style={{ borderBottom: i < items.length - 1 ? '1px solid var(--gray-100)' : 'none' }}>
                      <ApptCard
                        item={req}
                        actions={
                          isProvider ? [
                            <button key="a" className="btn btn-sm" style={{ background: '#16a34a', color: 'white', fontSize: 12 }} onClick={() => approve(req.id)}>Approve</button>,
                            <button key="r" className="btn btn-sm" style={{ background: '#dc2626', color: 'white', fontSize: 12 }} onClick={() => setRejectModal(req.id)}>Reject</button>,
                          ] : req.status === 'pending' ? [
                            <button key="c" className="btn btn-ghost btn-sm" style={{ color: 'var(--danger)', fontSize: 12 }} onClick={() => cancel(req.id)}>Cancel</button>,
                          ] : null
                        }
                      />
                    </div>
                  ))}
                </div>
          })()}

          {/* Scheduled */}
          {tab === 'scheduled' && (
            appointments.length === 0
              ? <div style={{ padding: '52px 20px', textAlign: 'center', color: 'var(--gray-300)', fontSize: 13, border: '1px dashed var(--gray-200)', borderRadius: 12 }}>No upcoming appointments</div>
              : <div style={{ background: 'var(--white)', border: '1px solid var(--gray-150)', borderRadius: 14, overflow: 'hidden' }}>
                  {appointments.map((appt, i) => (
                    <div key={appt.id} style={{ borderBottom: i < appointments.length - 1 ? '1px solid var(--gray-100)' : 'none' }}>
                      <ApptCard
                        item={appt}
                        actions={isProvider ? [
                          <button key="n" className="btn btn-secondary btn-sm" style={{ fontSize: 12 }} onClick={() => openNotes(appt)}>Notes</button>
                        ] : null}
                      />
                    </div>
                  ))}
                </div>
          )}

          {/* Calendar */}
          {tab === 'calendar' && (
            <CalendarView
              appointments={appointments}
              requests={isProvider ? pendingReqs : myReqs}
              isProvider={isProvider}
            />
          )}

          {/* History */}
          {tab === 'history' && (
            history.length === 0
              ? <div style={{ padding: '52px 20px', textAlign: 'center', color: 'var(--gray-300)', fontSize: 13, border: '1px dashed var(--gray-200)', borderRadius: 12 }}>No appointment history</div>
              : <div style={{ background: 'var(--white)', border: '1px solid var(--gray-150)', borderRadius: 14, overflow: 'hidden' }}>
                  {/* Header row */}
                  <div style={{ display: 'grid', gridTemplateColumns: '120px 70px 1fr 80px', padding: '8px 20px', fontSize: 11, fontWeight: 600, color: 'var(--gray-400)', letterSpacing: '0.06em', textTransform: 'uppercase', borderBottom: '1px solid var(--gray-100)' }}>
                    <span>Date</span><span>Time</span>
                    <span>{isProvider ? 'Patient' : 'Provider'}</span>
                    <span>Status</span>
                  </div>
                  {history.map((appt, i) => (
                    <div key={appt.id} style={{
                      display: 'grid', gridTemplateColumns: '120px 70px 1fr 80px',
                      padding: '13px 20px', alignItems: 'center',
                      borderBottom: i < history.length - 1 ? '1px solid var(--gray-100)' : 'none',
                      fontSize: 13,
                    }}>
                      <span style={{ color: 'var(--gray-700)' }}>{appt.date}</span>
                      <span style={{ color: 'var(--gray-500)', fontVariantNumeric: 'tabular-nums' }}>{(appt.time || '').slice(0,5)}</span>
                      <span style={{ color: 'var(--gray-700)' }}>
                        {isProvider ? (appt.patient_username || appt.patient_name) : (appt.provider_username || appt.provider_name)}
                      </span>
                      <StatusPill status={appt.status || 'completed'} />
                    </div>
                  ))}
                </div>
          )}
        </>
      )}

      {/* Clinical Notes Modal */}
      <Modal open={!!notesModal} onClose={() => setNotesModal(null)} title="Clinical Notes">
        <div className="modal-body">
          {['reasons_for_visit','examinations_performed','tests_requested','new_medications','referrals','follow_up_recommended','notes'].map(field => (
            <div className="form-group" key={field}>
              <label className="form-label">{field.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())}</label>
              <textarea className="form-control" rows={2} value={notesForm[field] || ''} onChange={e => setNotesForm(f => ({ ...f, [field]: e.target.value }))} />
            </div>
          ))}
        </div>
        <div className="modal-footer">
          <button className="btn btn-secondary" onClick={() => setNotesModal(null)}>Cancel</button>
          <button className="btn btn-primary" onClick={saveNotes}>Save Notes</button>
        </div>
      </Modal>

      {/* Reject Modal */}
      <Modal open={!!rejectModal} onClose={() => setRejectModal(null)} title="Reject Request">
        <div className="modal-body">
          <div className="form-group">
            <label className="form-label">Reason for rejection</label>
            <textarea className="form-control" rows={3} value={rejectReason} onChange={e => setRejectReason(e.target.value)} placeholder="Provide a reason…" />
          </div>
        </div>
        <div className="modal-footer">
          <button className="btn btn-secondary" onClick={() => setRejectModal(null)}>Cancel</button>
          <button className="btn btn-danger" onClick={reject}>Reject</button>
        </div>
      </Modal>
    </div>
  )
}
