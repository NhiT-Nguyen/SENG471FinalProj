import React, { useState, useEffect } from 'react'
import { authApi, appointmentApi, medicationApi, messageApi, notificationApi, medicalApi } from '../api/client'
import { useAuth } from '../context/AuthContext'
import { useToast } from '../hooks/useToast'

/**
 * Data Simulator — lets you create test data without manually filling every form.
 * Accessible from the sidebar by any logged-in user.
 * Also accessible without login at /simulator for seeding an empty database.
 */

function Section({ title, description, children }) {
  const [open, setOpen] = useState(true)
  return (
    <div className="card" style={{ marginBottom: 20 }}>
      <div className="card-header" style={{ cursor: 'pointer' }} onClick={() => setOpen(o => !o)}>
        <h3>{title}</h3>
        <span style={{ fontSize: 12, color: 'var(--gray-400)' }}>{open ? '▲ collapse' : '▼ expand'}</span>
      </div>
      {open && (
        <div className="card-body">
          {description && <p style={{ fontSize: 13, color: 'var(--gray-500)', marginBottom: 16 }}>{description}</p>}
          {children}
        </div>
      )}
    </div>
  )
}

function Result({ result }) {
  if (!result) return null
  return (
    <div className={`alert ${result.ok ? 'alert-success' : 'alert-error'}`} style={{ marginTop: 12, fontFamily: 'monospace', fontSize: 12, whiteSpace: 'pre-wrap', wordBreak: 'break-all' }}>
      {result.ok ? '✓ ' : '✗ '}{typeof result.data === 'object' ? JSON.stringify(result.data, null, 2) : result.data}
    </div>
  )
}

// Preset accounts to create
const PRESET_ACCOUNTS = [
  { username: 'dr_smith', password: 'Pass1234!', first_name: 'John', last_name: 'Smith', role: 'healthcare_provider', specialty: 'Cardiology', license_number: 'LIC-001', hospital_clinic_name: 'City Medical Center', email: 'dr.smith@hospital.com' },
  { username: 'dr_jones', password: 'Pass1234!', first_name: 'Sarah', last_name: 'Jones', role: 'healthcare_provider', specialty: 'General Practice', license_number: 'LIC-002', hospital_clinic_name: 'Family Health Clinic', email: 'dr.jones@clinic.com' },
  { username: 'patient_alice', password: 'Pass1234!', first_name: 'Alice', last_name: 'Johnson', role: 'patient', date_of_birth: '1985-03-15', blood_type: 'A+', email: 'alice@example.com' },
  { username: 'patient_bob', password: 'Pass1234!', first_name: 'Bob', last_name: 'Williams', role: 'patient', date_of_birth: '1972-08-22', blood_type: 'O-', email: 'bob@example.com' },
  { username: 'caregiver_mary', password: 'Pass1234!', first_name: 'Mary', last_name: 'Brown', role: 'caregiver', email: 'mary@example.com' },
  { username: 'family_tom', password: 'Pass1234!', first_name: 'Tom', last_name: 'Johnson', role: 'family_member', email: 'tom@example.com' },
]

export default function SimulatorPage() {
  const { token, isProvider, user } = useAuth()
  const t = useToast()

  const [patients, setPatients]   = useState([])
  const [providers, setProviders] = useState([])
  const [users2, setUsers2]       = useState([])
  const [loadingData, setLoadingData] = useState(false)

  const [results, setResults] = useState({})
  const setResult = (key, ok, data) => setResults(r => ({ ...r, [key]: { ok, data: typeof data === 'string' ? data : JSON.stringify(data) } }))

  // Forms
  const [regForm, setRegForm] = useState(PRESET_ACCOUNTS[0])
  const [availForm, setAvailForm] = useState({ day_of_week: 1, start_time: '09:00', end_time: '17:00', is_recurring: true, status: 'available' })
  const [msgForm, setMsgForm]   = useState({ receiver_username: '', content: 'Hello! This is a test message from the simulator.' })
  const [alertForm, setAlertForm] = useState({ message: 'Test alert: Your appointment has been confirmed.', user: '' })
  const [medForm, setMedForm]   = useState({ patient: '', name: 'Metformin', dosage: '500mg', frequency: 'Twice daily', start_date: new Date().toISOString().split('T')[0], administration_instructions: 'Take with food' })
  const [recForm, setRecForm]   = useState({ patient: '', record_type: 'note', title: 'Initial Assessment', description: 'Patient presents for routine checkup. No acute concerns.', recorded_date: new Date().toISOString().split('T')[0] })
  const [reqForm, setReqForm]   = useState({ healthcare_provider: '', requested_date: new Date(Date.now()+86400000*3).toISOString().split('T')[0], requested_start_time: '10:00', notes: 'Regular checkup appointment request' })

  useEffect(() => {
    if (token) loadData()
  }, [token])

  const loadData = async () => {
    setLoadingData(true)
    try {
      const [pats, provs] = await Promise.allSettled([authApi.patients(), authApi.providers()])
      const p = pats.value ? (Array.isArray(pats.value) ? pats.value : pats.value.results || []) : []
      const pr = provs.value ? (Array.isArray(provs.value) ? provs.value : provs.value.results || []) : []
      setPatients(p)
      setProviders(pr)
    } finally { setLoadingData(false) }
  }

  // Register a user
  const registerUser = async (data) => {
    try {
      const res = await authApi.register({ ...data, password_confirm: data.password })
      t.success(`Created: ${data.username}`)
      setResult('register', true, res)
      loadData()
    } catch (e) { t.error(e.message); setResult('register', false, e.message) }
  }

  const registerAllPresets = async () => {
    for (const acct of PRESET_ACCOUNTS) {
      try { await authApi.register(acct); t.success(`✓ ${acct.username}`) }
      catch (e) { t.error(`${acct.username}: ${e.message}`) }
    }
    loadData()
    setResult('registerAll', true, 'Done! Check individual results above.')
  }

  // Create availability (needs provider login)
  const createAvail = async () => {
    try {
      const res = await appointmentApi.createAvailability(availForm)
      t.success('Availability slot created')
      setResult('avail', true, res)
    } catch (e) { t.error(e.message); setResult('avail', false, e.message) }
  }

  // Send message
  const sendMsg = async () => {
    try {
      const res = await messageApi.send(msgForm)
      t.success('Message sent')
      setResult('msg', true, res)
    } catch (e) { t.error(e.message); setResult('msg', false, e.message) }
  }

  // Create alert
  const createAlert = async () => {
    try {
      const res = await notificationApi.createAlert(alertForm)
      t.success('Alert created')
      setResult('alert', true, res)
    } catch (e) { t.error(e.message); setResult('alert', false, e.message) }
  }

  // Prescribe medication (provider)
  const prescribeMed = async () => {
    try {
      const res = await medicationApi.prescribe(medForm)
      t.success('Medication prescribed')
      setResult('med', true, res)
    } catch (e) { t.error(e.message); setResult('med', false, e.message) }
  }

  // Create medical record (provider)
  const createRecord = async () => {
    try {
      const res = await medicalApi.createRecord(recForm)
      t.success('Medical record created')
      setResult('rec', true, res)
    } catch (e) { t.error(e.message); setResult('rec', false, e.message) }
  }

  // Request appointment (patient)
  const requestAppt = async () => {
    try {
      const res = await appointmentApi.requestAppointment({
        healthcare_provider: reqForm.healthcare_provider,
        requested_date: reqForm.requested_date,
        requested_start_time: reqForm.requested_start_time,
        notes: reqForm.notes,
      })
      t.success('Appointment request sent')
      setResult('appt', true, res)
    } catch (e) { t.error(e.message); setResult('appt', false, e.message) }
  }

  const DAY_NAMES = ['Mon','Tue','Wed','Thu','Fri','Sat','Sun']

  return (
    <div>
      <div className="page-header">
        <h1>Data Simulator</h1>
        <p>Create test data to populate the dashboard and test all features end-to-end</p>
      </div>

      <div className="alert alert-info" style={{ marginBottom: 20 }}>
        <strong>How to use:</strong> Log in as a provider to create availability slots, prescribe medications, and add medical records.
        Log in as a patient to request appointments and manage family access.
        Use "Quick Setup" to create preset test accounts in one click.
      </div>

      {/* Quick Setup */}
      <Section title="Quick Setup — Create Preset Accounts" description="Creates 6 test accounts: 2 providers, 2 patients, 1 caregiver, 1 family member. All use password: Pass1234!">
        <div style={{ overflowX: 'auto' }}>
          <table>
            <thead>
              <tr><th>Username</th><th>Role</th><th>Name</th><th>Details</th><th>Action</th></tr>
            </thead>
            <tbody>
              {PRESET_ACCOUNTS.map(acct => (
                <tr key={acct.username}>
                  <td><code style={{ background: 'var(--gray-100)', padding: '2px 6px', borderRadius: 4 }}>{acct.username}</code></td>
                  <td><span className="badge badge-blue" style={{ textTransform: 'capitalize' }}>{acct.role.replace('_', ' ')}</span></td>
                  <td>{acct.first_name} {acct.last_name}</td>
                  <td style={{ fontSize: 12, color: 'var(--gray-500)' }}>{acct.specialty || acct.date_of_birth || acct.email}</td>
                  <td><button className="btn btn-secondary btn-sm" onClick={() => registerUser(acct)}>Create</button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <button className="btn btn-primary" style={{ marginTop: 16 }} onClick={registerAllPresets}>
          Create All Preset Accounts
        </button>
        <Result result={results.registerAll} />
      </Section>

      {/* Custom Register */}
      <Section title="Register Custom User" description="Create a new user with a custom role and details.">
        <div className="form-row">
          <div className="form-group">
            <label className="form-label">Username</label>
            <input className="form-control" value={regForm.username} onChange={e => setRegForm(f => ({ ...f, username: e.target.value }))} />
          </div>
          <div className="form-group">
            <label className="form-label">Password</label>
            <input className="form-control" value={regForm.password} onChange={e => setRegForm(f => ({ ...f, password: e.target.value }))} />
          </div>
        </div>
        <div className="form-row">
          <div className="form-group">
            <label className="form-label">First Name</label>
            <input className="form-control" value={regForm.first_name} onChange={e => setRegForm(f => ({ ...f, first_name: e.target.value }))} />
          </div>
          <div className="form-group">
            <label className="form-label">Last Name</label>
            <input className="form-control" value={regForm.last_name} onChange={e => setRegForm(f => ({ ...f, last_name: e.target.value }))} />
          </div>
        </div>
        <div className="form-row">
          <div className="form-group">
            <label className="form-label">Role</label>
            <select className="form-control" value={regForm.role} onChange={e => setRegForm(f => ({ ...f, role: e.target.value }))}>
              <option value="patient">Patient</option>
              <option value="healthcare_provider">Healthcare Provider</option>
              <option value="caregiver">Caregiver</option>
              <option value="family_member">Family Member</option>
            </select>
          </div>
          <div className="form-group">
            <label className="form-label">Email</label>
            <input className="form-control" type="email" value={regForm.email || ''} onChange={e => setRegForm(f => ({ ...f, email: e.target.value }))} />
          </div>
        </div>
        {regForm.role === 'healthcare_provider' && (
          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Specialty</label>
              <input className="form-control" value={regForm.specialty || ''} onChange={e => setRegForm(f => ({ ...f, specialty: e.target.value }))} placeholder="e.g. Cardiology" />
            </div>
            <div className="form-group">
              <label className="form-label">Hospital</label>
              <input className="form-control" value={regForm.hospital_clinic_name || ''} onChange={e => setRegForm(f => ({ ...f, hospital_clinic_name: e.target.value }))} />
            </div>
          </div>
        )}
        <button className="btn btn-primary" onClick={() => registerUser(regForm)}>Register User</button>
        <Result result={results.register} />
      </Section>

      {/* Provider: Create Availability */}
      {token && (
        <Section title="Create Availability Slot" description="Logged-in provider: add a weekly availability slot to allow patients to book.">
          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Day of Week</label>
              <select className="form-control" value={availForm.day_of_week} onChange={e => setAvailForm(f => ({ ...f, day_of_week: +e.target.value }))}>
                {DAY_NAMES.map((d,i) => <option key={i} value={i}>{d}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Status</label>
              <select className="form-control" value={availForm.status} onChange={e => setAvailForm(f => ({ ...f, status: e.target.value }))}>
                <option value="available">Available</option>
                <option value="busy">Busy</option>
              </select>
            </div>
          </div>
          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Start Time</label>
              <input className="form-control" type="time" value={availForm.start_time} onChange={e => setAvailForm(f => ({ ...f, start_time: e.target.value }))} />
            </div>
            <div className="form-group">
              <label className="form-label">End Time</label>
              <input className="form-control" type="time" value={availForm.end_time} onChange={e => setAvailForm(f => ({ ...f, end_time: e.target.value }))} />
            </div>
          </div>
          <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 14, marginBottom: 12, cursor: 'pointer' }}>
            <input type="checkbox" checked={availForm.is_recurring} onChange={e => setAvailForm(f => ({ ...f, is_recurring: e.target.checked }))} />
            Recurring weekly
          </label>
          <button className="btn btn-primary" onClick={createAvail}>Create Slot</button>
          <Result result={results.avail} />
        </Section>
      )}

      {/* Send Message */}
      {token && (
        <Section title="Send Test Message" description="Send a direct message to another user (use their username).">
          <div className="form-row">
            <div className="form-group">
              <label className="form-label">To (username)</label>
              <input className="form-control" value={msgForm.receiver_username} onChange={e => setMsgForm(f => ({ ...f, receiver_username: e.target.value }))} placeholder="recipient_username" />
            </div>
            <div className="form-group">
              <label className="form-label">Or pick from list</label>
              <select className="form-control" onChange={e => setMsgForm(f => ({ ...f, receiver_username: e.target.value }))}>
                <option value="">Select user…</option>
                {[...patients, ...providers].map(u => (
                  <option key={u.id} value={u.user_username || u.id}>{u.user_username || u.id} ({u.specialty || u.date_of_birth || 'patient'})</option>
                ))}
              </select>
            </div>
          </div>
          <div className="form-group">
            <label className="form-label">Message</label>
            <textarea className="form-control" rows={3} value={msgForm.content} onChange={e => setMsgForm(f => ({ ...f, content: e.target.value }))} />
          </div>
          <button className="btn btn-primary" onClick={sendMsg} disabled={!msgForm.receiver_username || !msgForm.content.trim()}>Send Message</button>
          <Result result={results.msg} />
        </Section>
      )}

      {/* Create Alert */}
      {token && (
        <Section title="Create Notification Alert" description="Simulate a system alert for any user (uses their user ID).">
          <div className="form-row">
            <div className="form-group">
              <label className="form-label">User ID (leave blank = self)</label>
              <input className="form-control" type="number" value={alertForm.user} onChange={e => setAlertForm(f => ({ ...f, user: e.target.value }))} placeholder="User ID (optional)" />
            </div>
            <div className="form-group">
              <label className="form-label">Or pick from list</label>
              <select className="form-control" onChange={e => setAlertForm(f => ({ ...f, user: e.target.value }))}>
                <option value="">Select user…</option>
                {[...patients, ...providers].map(u => (
                  <option key={u.id} value={u.user || u.id}>{u.user_username || u.id}</option>
                ))}
              </select>
            </div>
          </div>
          <div className="form-group">
            <label className="form-label">Alert Message</label>
            <textarea className="form-control" rows={2} value={alertForm.message} onChange={e => setAlertForm(f => ({ ...f, message: e.target.value }))} />
          </div>
          <button className="btn btn-primary" onClick={createAlert} disabled={!alertForm.message.trim()}>Create Alert</button>
          <Result result={results.alert} />
        </Section>
      )}

      {/* Prescribe Medication */}
      {token && isProvider && (
        <Section title="Prescribe Medication (Provider only)" description="Prescribe a medication for a patient. You must be logged in as a healthcare provider.">
          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Patient</label>
              <select className="form-control" value={medForm.patient} onChange={e => setMedForm(f => ({ ...f, patient: e.target.value }))}>
                <option value="">Select patient…</option>
                {patients.map(p => <option key={p.id} value={p.id}>{p.user_username || p.id}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Medication Name</label>
              <input className="form-control" value={medForm.name} onChange={e => setMedForm(f => ({ ...f, name: e.target.value }))} />
            </div>
          </div>
          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Dosage</label>
              <input className="form-control" value={medForm.dosage} onChange={e => setMedForm(f => ({ ...f, dosage: e.target.value }))} />
            </div>
            <div className="form-group">
              <label className="form-label">Frequency</label>
              <input className="form-control" value={medForm.frequency} onChange={e => setMedForm(f => ({ ...f, frequency: e.target.value }))} />
            </div>
          </div>
          <div className="form-group">
            <label className="form-label">Start Date</label>
            <input className="form-control" type="date" value={medForm.start_date} onChange={e => setMedForm(f => ({ ...f, start_date: e.target.value }))} />
          </div>
          <button className="btn btn-primary" onClick={prescribeMed} disabled={!medForm.patient || !medForm.name}>Prescribe</button>
          <Result result={results.med} />
        </Section>
      )}

      {/* Create Medical Record */}
      {token && isProvider && (
        <Section title="Add Medical Record (Provider only)" description="Create a medical record for a patient.">
          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Patient</label>
              <select className="form-control" value={recForm.patient} onChange={e => setRecForm(f => ({ ...f, patient: e.target.value }))}>
                <option value="">Select patient…</option>
                {patients.map(p => <option key={p.id} value={p.id}>{p.user_username || p.id}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Record Type</label>
              <select className="form-control" value={recForm.record_type} onChange={e => setRecForm(f => ({ ...f, record_type: e.target.value }))}>
                {['appointment','medication','lab_test','diagnosis','procedure','vaccination','allergy','note'].map(rt => (
                  <option key={rt} value={rt}>{rt.replace('_', ' ')}</option>
                ))}
              </select>
            </div>
          </div>
          <div className="form-group">
            <label className="form-label">Title</label>
            <input className="form-control" value={recForm.title} onChange={e => setRecForm(f => ({ ...f, title: e.target.value }))} />
          </div>
          <div className="form-group">
            <label className="form-label">Description</label>
            <textarea className="form-control" rows={3} value={recForm.description} onChange={e => setRecForm(f => ({ ...f, description: e.target.value }))} />
          </div>
          <button className="btn btn-primary" onClick={createRecord} disabled={!recForm.patient || !recForm.title}>Create Record</button>
          <Result result={results.rec} />
        </Section>
      )}

      {/* Request Appointment */}
      {token && !isProvider && (
        <Section title="Request Appointment (Patient/Caregiver)" description="Submit an appointment request to a provider.">
          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Provider (User ID)</label>
              <select className="form-control" value={reqForm.healthcare_provider} onChange={e => setReqForm(f => ({ ...f, healthcare_provider: e.target.value }))}>
                <option value="">Select provider…</option>
                {providers.map(p => <option key={p.id} value={p.user?.id || p.user_id || p.id}>Dr. {p.user_first_name || p.user?.first_name || ''} {p.user_last_name || p.user?.last_name || p.user_username || p.user?.username} ({p.specialty_display || p.specialty || 'General'})</option>)}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Requested Date</label>
              <input className="form-control" type="date" value={reqForm.requested_date} onChange={e => setReqForm(f => ({ ...f, requested_date: e.target.value }))} />
            </div>
          </div>
          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Requested Start Time</label>
              <input className="form-control" type="time" value={reqForm.requested_start_time} onChange={e => setReqForm(f => ({ ...f, requested_start_time: e.target.value }))} />
            </div>
            <div className="form-group">
              <label className="form-label">Notes</label>
              <input className="form-control" value={reqForm.notes} onChange={e => setReqForm(f => ({ ...f, notes: e.target.value }))} />
            </div>
          </div>
          <button className="btn btn-primary" onClick={requestAppt} disabled={!reqForm.healthcare_provider || !reqForm.requested_date}>Request Appointment</button>
          <Result result={results.appt} />
        </Section>
      )}

      {/* Database state */}
      {token && (
        <Section title="Current Database State" description="A quick summary of what's in the database right now.">
          <button className="btn btn-secondary" onClick={loadData} disabled={loadingData} style={{ marginBottom: 16 }}>
            {loadingData ? 'Refreshing…' : 'Refresh'}
          </button>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 12 }}>
            <div className="card" style={{ padding: 16 }}>
              <div style={{ fontSize: 24, fontWeight: 700, color: 'var(--primary)' }}>{patients.length}</div>
              <div style={{ fontSize: 13, color: 'var(--gray-500)' }}>Patients</div>
            </div>
            <div className="card" style={{ padding: 16 }}>
              <div style={{ fontSize: 24, fontWeight: 700, color: 'var(--secondary)' }}>{providers.length}</div>
              <div style={{ fontSize: 13, color: 'var(--gray-500)' }}>Healthcare Providers</div>
            </div>
          </div>
          {providers.length > 0 && (
            <div style={{ marginTop: 16 }}>
              <div style={{ fontWeight: 600, fontSize: 13, marginBottom: 8 }}>Providers:</div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                {providers.map(p => (
                  <span key={p.id} className="badge badge-blue">{p.user_username || p.id} ({p.specialty || 'General'})</span>
                ))}
              </div>
            </div>
          )}
          {patients.length > 0 && (
            <div style={{ marginTop: 12 }}>
              <div style={{ fontWeight: 600, fontSize: 13, marginBottom: 8 }}>Patients:</div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                {patients.map(p => (
                  <span key={p.id} className="badge badge-green">{p.user_username || p.id}</span>
                ))}
              </div>
            </div>
          )}
        </Section>
      )}
    </div>
  )
}
