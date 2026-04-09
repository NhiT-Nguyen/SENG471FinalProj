import React, { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { authApi } from '../api/client'
import { useToast } from '../hooks/useToast'

const ROLES = [
  { value: 'patient', label: 'Patient' },
  { value: 'healthcare_provider', label: 'Healthcare Provider' },
  { value: 'caregiver', label: 'Caregiver' },
  { value: 'family_member', label: 'Family Member' },
]

export default function RegisterPage() {
  const navigate = useNavigate()
  const t = useToast()
  const [form, setForm] = useState({
    username: '', password: '', email: '', first_name: '', last_name: '',
    role: 'patient', phone_number: '',
    // provider fields
    specialty: '', license_number: '', hospital_clinic_name: '',
    // patient fields
    date_of_birth: '', blood_type: '', emergency_contact: '',
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const set = (k) => (e) => setForm(f => ({ ...f, [k]: e.target.value }))

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      // Send password_confirm same as password so backend check passes
      await authApi.register({ ...form, password_confirm: form.password })
      t?.success('Account created! Please sign in.')
      navigate('/login')
    } catch (err) {
      setError(err.message || 'Registration failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{
      minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: 'linear-gradient(135deg, #dbeafe 0%, #f0fdf4 100%)', padding: 20,
    }}>
      <div style={{ width: '100%', maxWidth: 540 }}>
        <div style={{ textAlign: 'center', marginBottom: 24 }}>
          <h1 style={{ fontSize: 22, fontWeight: 700 }}>Create Account</h1>
          <p style={{ color: 'var(--gray-500)', fontSize: 14, marginTop: 4 }}>Join the Healthcare Platform</p>
        </div>

        <div className="card">
          <div className="card-body">
            {error && <div className="alert alert-error">{error}</div>}
            <form onSubmit={handleSubmit}>
              <div style={{ marginBottom: 12, fontSize: 13, fontWeight: 600, color: 'var(--gray-700)' }}>Account Details</div>
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">First Name</label>
                  <input className="form-control" value={form.first_name} onChange={set('first_name')} placeholder="First name" />
                </div>
                <div className="form-group">
                  <label className="form-label">Last Name</label>
                  <input className="form-control" value={form.last_name} onChange={set('last_name')} placeholder="Last name" />
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">Username *</label>
                <input className="form-control" value={form.username} onChange={set('username')} placeholder="Choose a username" required />
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Email</label>
                  <input className="form-control" type="email" value={form.email} onChange={set('email')} placeholder="email@example.com" />
                </div>
                <div className="form-group">
                  <label className="form-label">Phone</label>
                  <input className="form-control" value={form.phone_number} onChange={set('phone_number')} placeholder="+1 555 0100" />
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">Password *</label>
                <input className="form-control" type="password" value={form.password} onChange={set('password')} placeholder="Choose a password" required />
              </div>
              <div className="form-group">
                <label className="form-label">Role *</label>
                <select className="form-control" value={form.role} onChange={set('role')} required>
                  {ROLES.map(r => <option key={r.value} value={r.value}>{r.label}</option>)}
                </select>
              </div>

              {/* Provider fields */}
              {form.role === 'healthcare_provider' && (
                <>
                  <div style={{ marginBottom: 12, marginTop: 4, fontSize: 13, fontWeight: 600, color: 'var(--gray-700)' }}>Provider Details</div>
                  <div className="form-row">
                    <div className="form-group">
                      <label className="form-label">Specialty</label>
                      <input className="form-control" value={form.specialty} onChange={set('specialty')} placeholder="e.g. Cardiology" />
                    </div>
                    <div className="form-group">
                      <label className="form-label">License #</label>
                      <input className="form-control" value={form.license_number} onChange={set('license_number')} placeholder="License number" />
                    </div>
                  </div>
                  <div className="form-group">
                    <label className="form-label">Hospital / Clinic</label>
                    <input className="form-control" value={form.hospital_clinic_name} onChange={set('hospital_clinic_name')} placeholder="Facility name" />
                  </div>
                </>
              )}

              {/* Patient fields */}
              {form.role === 'patient' && (
                <>
                  <div style={{ marginBottom: 12, marginTop: 4, fontSize: 13, fontWeight: 600, color: 'var(--gray-700)' }}>Patient Details</div>
                  <div className="form-row">
                    <div className="form-group">
                      <label className="form-label">Date of Birth</label>
                      <input className="form-control" type="date" value={form.date_of_birth} onChange={set('date_of_birth')} />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Blood Type</label>
                      <select className="form-control" value={form.blood_type} onChange={set('blood_type')}>
                        <option value="">Select…</option>
                        {['A+','A-','B+','B-','AB+','AB-','O+','O-'].map(b => <option key={b}>{b}</option>)}
                      </select>
                    </div>
                  </div>
                  <div className="form-group">
                    <label className="form-label">Emergency Contact</label>
                    <input className="form-control" value={form.emergency_contact} onChange={set('emergency_contact')} placeholder="Name & phone" />
                  </div>
                </>
              )}

              <button type="submit" className="btn btn-primary w-full btn-lg" disabled={loading} style={{ marginTop: 8 }}>
                {loading ? <><span className="spinner" style={{ width: 16, height: 16 }} /> Creating…</> : 'Create Account'}
              </button>
            </form>
          </div>
        </div>

        <p style={{ textAlign: 'center', marginTop: 16, fontSize: 14, color: 'var(--gray-600)' }}>
          Already have an account?{' '}
          <Link to="/login" style={{ color: 'var(--primary)', fontWeight: 500 }}>Sign In</Link>
        </p>
      </div>
    </div>
  )
}
