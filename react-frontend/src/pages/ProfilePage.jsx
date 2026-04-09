import React, { useState, useEffect } from 'react'
import { authApi } from '../api/client'
import { useAuth } from '../context/AuthContext'
import { useToast } from '../hooks/useToast'

export default function ProfilePage() {
  const { profile, refreshProfile, isProvider } = useAuth()
  const t = useToast()
  const [form, setForm] = useState({})
  const [loading, setLoading]  = useState(false)
  const [saved, setSaved]      = useState(false)

  useEffect(() => {
    if (profile) {
      setForm({
        email: profile.user_email || profile.user?.email || '',
        phone_number: profile.phone_number || '',
        bio: profile.bio || '',
        // Provider fields (fetched separately via profile endpoint which may embed provider info)
        specialty: profile.specialty || '',
        license_number: profile.license_number || '',
        hospital_clinic: profile.hospital_clinic || '',
        years_of_experience: profile.years_of_experience || '',
      })
    }
  }, [profile])

  const set = (k) => (e) => setForm(f => ({ ...f, [k]: e.target.value }))

  const save = async () => {
    setLoading(true)
    setSaved(false)
    try {
      await authApi.updateProfile(form)
      await refreshProfile()
      setSaved(true)
      t.success('Profile updated')
      setTimeout(() => setSaved(false), 3000)
    } catch (e) { t.error(e.message) }
    finally { setLoading(false) }
  }

  if (!profile) return <div className="loading-center"><div className="spinner" /></div>

  return (
    <div style={{ maxWidth: 600 }}>
      <div className="page-header">
        <h1>My Profile</h1>
        <p>Update your account information</p>
      </div>

      {/* Avatar */}
      <div className="card" style={{ padding: 24, marginBottom: 20, display: 'flex', alignItems: 'center', gap: 20 }}>
        <div style={{
          width: 72, height: 72, borderRadius: '50%', background: 'var(--primary)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          color: '#fff', fontWeight: 700, fontSize: 28,
        }}>
          {(profile.user_first_name || profile.user?.first_name || profile.user_username || profile.user?.username || 'U')[0]?.toUpperCase()}
        </div>
        <div>
          <div style={{ fontWeight: 700, fontSize: 18 }}>
            {profile.user_first_name || profile.user?.first_name} {profile.user_last_name || profile.user?.last_name}
          </div>
          <div style={{ color: 'var(--gray-500)', fontSize: 14 }}>@{profile.user_username || profile.user?.username}</div>
          <span className="badge badge-blue" style={{ marginTop: 4, textTransform: 'capitalize' }}>
            {profile.role?.replace('_', ' ')}
          </span>
        </div>
      </div>

      <div className="card">
        <div className="card-header"><h3>Edit Profile</h3></div>
        <div className="card-body">
          {saved && <div className="alert alert-success">Profile saved successfully!</div>}

          <div className="section-divider" style={{ marginTop: 0 }} />
          <div style={{ fontWeight: 600, fontSize: 13, color: 'var(--gray-700)', marginBottom: 12 }}>Contact Info</div>

          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Email</label>
              <input className="form-control" type="email" value={form.email} onChange={set('email')} />
            </div>
            <div className="form-group">
              <label className="form-label">Phone</label>
              <input className="form-control" value={form.phone_number} onChange={set('phone_number')} placeholder="+1 555 0100" />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Bio</label>
            <textarea className="form-control" rows={3} value={form.bio} onChange={set('bio')} placeholder="A brief description about yourself…" />
          </div>

          {isProvider && (
            <>
              <div className="section-divider" />
              <div style={{ fontWeight: 600, fontSize: 13, color: 'var(--gray-700)', marginBottom: 12 }}>Provider Details</div>
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Specialty</label>
                  <input className="form-control" value={form.specialty} onChange={set('specialty')} />
                </div>
                <div className="form-group">
                  <label className="form-label">License Number</label>
                  <input className="form-control" value={form.license_number} onChange={set('license_number')} />
                </div>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Hospital / Clinic</label>
                  <input className="form-control" value={form.hospital_clinic} onChange={set('hospital_clinic')} />
                </div>
                <div className="form-group">
                  <label className="form-label">Years of Experience</label>
                  <input className="form-control" type="number" min="0" value={form.years_of_experience} onChange={set('years_of_experience')} />
                </div>
              </div>
            </>
          )}

          <div style={{ marginTop: 8 }}>
            <button className="btn btn-primary" onClick={save} disabled={loading}>
              {loading ? <><span className="spinner" style={{ width: 16, height: 16 }} /> Saving…</> : 'Save Changes'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
