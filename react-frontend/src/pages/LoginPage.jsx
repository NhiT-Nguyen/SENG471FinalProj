import React, { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useToast } from '../hooks/useToast'

export default function LoginPage() {
  const { login } = useAuth()
  const { toast } = useToast ? { toast: null } : {}
  const t = useToast()
  const navigate = useNavigate()
  const [form, setForm] = useState({ username: '', password: '' })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      await login(form.username, form.password)
      t?.success('Welcome back!')
      navigate('/')
    } catch (err) {
      setError(err.message || 'Login failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{
      minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: 'linear-gradient(135deg, #dbeafe 0%, #f0fdf4 100%)', padding: 20,
    }}>
      <div style={{ width: '100%', maxWidth: 400 }}>
        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <div style={{
            width: 56, height: 56, borderRadius: 14, background: 'var(--primary)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 12px',
          }}>
            <svg width="28" height="28" viewBox="0 0 24 24" fill="white"><path d="M12 2l9 4.5v9L12 22l-9-6.5v-9L12 2z"/></svg>
          </div>
          <h1 style={{ fontSize: 24, fontWeight: 700, color: 'var(--gray-900)' }}>Healthcare Platform</h1>
          <p style={{ color: 'var(--gray-500)', fontSize: 14, marginTop: 4 }}>Sign in to your account</p>
        </div>

        <div className="card">
          <div className="card-body">
            {error && <div className="alert alert-error">{error}</div>}
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label className="form-label">Username</label>
                <input
                  className="form-control" type="text" value={form.username} placeholder="Enter username"
                  onChange={e => setForm(f => ({ ...f, username: e.target.value }))} required
                />
              </div>
              <div className="form-group" style={{ marginBottom: 20 }}>
                <label className="form-label">Password</label>
                <input
                  className="form-control" type="password" value={form.password} placeholder="Enter password"
                  onChange={e => setForm(f => ({ ...f, password: e.target.value }))} required
                />
              </div>
              <button type="submit" className="btn btn-primary w-full btn-lg" disabled={loading}>
                {loading ? <><span className="spinner" style={{ width: 16, height: 16 }} /> Signing in…</> : 'Sign In'}
              </button>
            </form>
          </div>
        </div>

        <p style={{ textAlign: 'center', marginTop: 16, fontSize: 14, color: 'var(--gray-600)' }}>
          Don't have an account?{' '}
          <Link to="/register" style={{ color: 'var(--primary)', fontWeight: 500 }}>Register</Link>
        </p>
        <p style={{ textAlign: 'center', marginTop: 8, fontSize: 13, color: 'var(--gray-400)' }}>
          Need test data? <Link to="/simulator" style={{ color: 'var(--gray-500)' }}>Use the Simulator</Link>
        </p>
      </div>
    </div>
  )
}
