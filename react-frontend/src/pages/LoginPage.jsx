import React, { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useToast } from '../hooks/useToast'
import loginPhoto    from '../static/login.png'
import logoWithName  from '../static/logowithname.png'

export default function LoginPage() {
  const { login } = useAuth()
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
      setError(err.message || 'Invalid username or password')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      background: '#f8f9fc',
    }}>
      {/* Left panel — photo + brand */}
      <div
        className="auth-left-panel"
        style={{
          flex: 1,
          position: 'relative',
          overflow: 'hidden',
          minWidth: 0,
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'flex-end',
        }}
      >
        {/* Background photo */}
        <img
          src={loginPhoto}
          alt=""
          style={{
            position: 'absolute',
            inset: 0,
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            objectPosition: 'center 20%',
          }}
        />

        {/* Gradient overlay — bottom-heavy for text legibility */}
        <div style={{
          position: 'absolute',
          inset: 0,
          background: 'linear-gradient(to bottom, rgba(8,18,38,0.25) 0%, rgba(8,18,38,0.72) 60%, rgba(8,18,38,0.92) 100%)',
        }} />

        {/* Bottom content */}
        <div style={{ position: 'relative', padding: '40px 44px 48px', color: 'white' }}>
          <h1 style={{
            fontFamily: 'var(--font-serif)',
            fontSize: 38,
            fontWeight: 400,
            lineHeight: 1.2,
            marginBottom: 14,
            letterSpacing: '-0.01em',
          }}>
            Coordinated care,<br />
            <em>simplified.</em>
          </h1>
          <p style={{
            fontSize: 14,
            lineHeight: 1.7,
            opacity: 0.82,
            maxWidth: 380,
            fontWeight: 400,
          }}>
            Connect patients, caregivers, family members and healthcare providers
            in one secure, trusted platform.
          </p>

        </div>
      </div>

      {/* Right panel — form */}
      <div style={{
        width: 480,
        flexShrink: 0,
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        padding: '52px 52px',
        background: 'var(--white)',
        boxShadow: '-12px 0 40px rgba(0,0,0,.07)',
      }}>
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 24, paddingRight: 115}}>
          <img src={logoWithName} alt="AegisCare" style={{ height: 48, objectFit: 'contain' }} />
        </div>

        {/* Mobile-only logo */}
        <div className="auth-mobile-logo" style={{ display: 'none', marginBottom: 32 }}>
          <img src={logoWithName} alt="AegisCare" style={{ height: 28, objectFit: 'contain' }} />
        </div>

        <div style={{ marginBottom: 36 }}>
          <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--primary)', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 8 }}>
            Secure Sign-In
          </div>
          <h2 style={{
            fontFamily: 'var(--font-serif)',
            fontSize: 28,
            fontWeight: 400,
            color: 'var(--gray-900)',
            letterSpacing: '-0.01em',
            lineHeight: 1.2,
          }}>
            Welcome back
          </h2>
          <p style={{ fontSize: 13, color: 'var(--gray-500)', marginTop: 6, lineHeight: 1.6 }}>
            Enter your credentials to access your account
          </p>
        </div>

        {error && (
          <div className="alert alert-error" style={{ marginBottom: 20 }}>
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><path d="M12 8v4M12 16h.01"/></svg>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">Username</label>
            <input
              className="form-control"
              type="text"
              value={form.username}
              placeholder="Enter your username"
              onChange={e => setForm(f => ({ ...f, username: e.target.value }))}
              autoComplete="username"
              required
            />
          </div>
          <div className="form-group" style={{ marginBottom: 28 }}>
            <label className="form-label">Password</label>
            <input
              className="form-control"
              type="password"
              value={form.password}
              placeholder="Enter your password"
              onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
              autoComplete="current-password"
              required
            />
          </div>
          <button type="submit" className="btn btn-primary w-full btn-lg" disabled={loading} style={{ borderRadius: 10, fontSize: 14, fontWeight: 600, letterSpacing: '-0.01em' }}>
            {loading
              ? <><span className="spinner" style={{ borderTopColor: 'rgba(255,255,255,.9)', borderColor: 'rgba(255,255,255,.3)' }} /> Signing in…</>
              : 'Sign In'}
          </button>
        </form>

        <div style={{ marginTop: 22, fontSize: 13, color: 'var(--gray-500)', textAlign: 'center' }}>
          Don't have an account?{' '}
          <Link to="/register" style={{ color: 'var(--primary)', fontWeight: 600 }}>Create account</Link>
        </div>

      </div>

      <style>{`
        @media (max-width: 860px) { .auth-left-panel { display: none !important; } }
        @media (max-width: 860px) { .auth-mobile-logo { display: flex !important; } }
      `}</style>
    </div>
  )
}
