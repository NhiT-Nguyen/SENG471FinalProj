import React, { useState, useEffect, useCallback } from 'react'
import { useAuth } from '../context/AuthContext'
import { appointmentApi } from '../api/client'
import { useToast } from '../hooks/useToast'

const STATUS_BADGE = {
  pending:    'badge-yellow',
  approved:   'badge-green',
  rejected:   'badge-red',
  cancelled:  'badge-gray',
  completed:  'badge-blue',
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

export default function AppointmentsPage() {
  const { isProvider, isPatient } = useAuth()
  const t = useToast()

  const [tab, setTab] = useState(isProvider ? 'pending' : 'my')
  const [appointments, setAppointments] = useState([])
  const [pendingReqs, setPendingReqs]   = useState([])
  const [myReqs, setMyReqs]             = useState([])
  const [history, setHistory]           = useState([])
  const [loading, setLoading]           = useState(true)
  const [notesModal, setNotesModal]     = useState(null)   // appointment object
  const [rejectModal, setRejectModal]   = useState(null)   // request id
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
      const arr = (r) => r.status === 'fulfilled' ? (Array.isArray(r.value) ? r.value : r.value?.results || []) : []
      setAppointments(arr(appts))
      setHistory(arr(hist))
      setPendingReqs(arr(pending))
      setMyReqs(arr(mine))
    } finally {
      setLoading(false)
    }
  }, [isProvider])

  useEffect(() => { reload() }, [reload])

  const approve = async (id) => {
    try { await appointmentApi.approveRequest(id); t.success('Request approved'); reload() }
    catch (e) { t.error(e.message) }
  }

  const reject = async () => {
    try { await appointmentApi.rejectRequest(rejectModal, { rejection_reason: rejectReason }); t.success('Request rejected'); setRejectModal(null); setRejectReason(''); reload() }
    catch (e) { t.error(e.message) }
  }

  const cancel = async (id) => {
    if (!confirm('Cancel this appointment request?')) return
    try { await appointmentApi.cancelRequest(id); t.success('Request cancelled'); reload() }
    catch (e) { t.error(e.message) }
  }

  const saveNotes = async () => {
    try {
      await appointmentApi.updateNotes(notesModal.id, notesForm)
      t.success('Notes saved')
      setNotesModal(null)
      reload()
    } catch (e) { t.error(e.message) }
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

  const TABS = isProvider
    ? [{ id: 'pending', label: `Pending (${pendingReqs.length})` }, { id: 'scheduled', label: 'Scheduled' }, { id: 'history', label: 'History' }]
    : [{ id: 'my', label: `My Requests (${myReqs.length})` }, { id: 'scheduled', label: 'Scheduled' }, { id: 'history', label: 'History' }]

  return (
    <div>
      <div className="page-header">
        <h1>Appointments</h1>
        <p>Manage appointment requests and history</p>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 4, marginBottom: 20, borderBottom: '1px solid var(--gray-200)', paddingBottom: 0 }}>
        {TABS.map(tb => (
          <button
            key={tb.id} onClick={() => setTab(tb.id)}
            style={{
              background: 'none', border: 'none', padding: '10px 16px', fontSize: 13, fontWeight: 500,
              color: tab === tb.id ? 'var(--primary)' : 'var(--gray-500)',
              borderBottom: tab === tb.id ? '2px solid var(--primary)' : '2px solid transparent',
              marginBottom: -1,
            }}
          >{tb.label}</button>
        ))}
      </div>

      {loading ? <div className="loading-center"><div className="spinner" /></div> : (
        <>
          {/* Provider: pending requests */}
          {isProvider && tab === 'pending' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {pendingReqs.length === 0 && <div className="empty-state"><p>No pending requests</p></div>}
              {pendingReqs.map(req => (
                <div key={req.id} className="card" style={{ padding: 20 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 12 }}>
                    <div>
                      <div style={{ fontWeight: 600, fontSize: 15 }}>
                        Patient: {req.patient_username || req.patient_name || req.patient}
                      </div>
                      <div style={{ color: 'var(--gray-500)', fontSize: 13, marginTop: 4 }}>
                        {req.requested_date} at {req.requested_start_time}
                      </div>
                      {req.notes && <div style={{ fontSize: 13, marginTop: 6, color: 'var(--gray-700)' }}>{req.notes}</div>}
                    </div>
                    <div style={{ display: 'flex', gap: 8 }}>
                      <button className="btn btn-success btn-sm" onClick={() => approve(req.id)}>Approve</button>
                      <button className="btn btn-danger btn-sm" onClick={() => { setRejectModal(req.id) }}>Reject</button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Patient: my requests */}
          {!isProvider && tab === 'my' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {myReqs.length === 0 && <div className="empty-state"><p>No appointment requests. <a href="/providers" style={{ color: 'var(--primary)' }}>Find a provider →</a></p></div>}
              {myReqs.map(req => (
                <div key={req.id} className="card" style={{ padding: 20 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 12 }}>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <span style={{ fontWeight: 600, fontSize: 15 }}>
                          Dr. {req.provider_username || req.provider_name || req.healthcare_provider}
                        </span>
                        <span className={`badge ${STATUS_BADGE[req.status] || 'badge-gray'}`}>{req.status_display || req.status}</span>
                      </div>
                      <div style={{ color: 'var(--gray-500)', fontSize: 13, marginTop: 4 }}>
                        {req.requested_date} at {req.requested_start_time}
                      </div>
                      {req.notes && <div style={{ fontSize: 13, marginTop: 6 }}>{req.notes}</div>}
                    </div>
                    {req.status === 'pending' && (
                      <button className="btn btn-danger btn-sm" onClick={() => cancel(req.id)}>Cancel</button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Scheduled appointments */}
          {tab === 'scheduled' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {appointments.length === 0 && <div className="empty-state"><p>No upcoming appointments</p></div>}
              {appointments.map(appt => (
                <div key={appt.id} className="card" style={{ padding: 20 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 12 }}>
                    <div>
                      <div style={{ fontWeight: 600, fontSize: 15 }}>
                        {isProvider
                          ? `Patient: ${appt.patient_username || appt.patient_name || appt.patient}`
                          : `Dr. ${appt.provider_username || appt.provider_name || appt.healthcare_provider}`}
                      </div>
                      <div style={{ color: 'var(--gray-500)', fontSize: 13, marginTop: 4 }}>
                        {appt.date} at {appt.time} · {appt.duration_minutes || 30} min
                      </div>
                      {appt.notes && <div style={{ fontSize: 13, marginTop: 6 }}>{appt.notes}</div>}
                    </div>
                    {isProvider && (
                      <button className="btn btn-secondary btn-sm" onClick={() => openNotes(appt)}>
                        Clinical Notes
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* History */}
          {tab === 'history' && (
            <div className="card table-wrap">
              {history.length === 0 ? (
                <div className="empty-state"><p>No appointment history</p></div>
              ) : (
                <table>
                  <thead>
                    <tr>
                      <th>Date</th>
                      <th>Time</th>
                      <th>{isProvider ? 'Patient' : 'Provider'}</th>
                      <th>Duration</th>
                      <th>Notes</th>
                    </tr>
                  </thead>
                  <tbody>
                    {history.map(appt => (
                      <tr key={appt.id}>
                        <td>{appt.date}</td>
                        <td>{appt.time}</td>
                        <td>{isProvider ? (appt.patient_username || appt.patient_name) : (appt.provider_username || appt.provider_name)}</td>
                        <td>{appt.duration_minutes || 30} min</td>
                        <td style={{ maxWidth: 200, fontSize: 12, color: 'var(--gray-600)' }}>{appt.notes || '—'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
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
              <textarea
                className="form-control" rows={2}
                value={notesForm[field] || ''}
                onChange={e => setNotesForm(f => ({ ...f, [field]: e.target.value }))}
              />
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
