import React, { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { notificationApi } from '../../api/client'

export default function TopBar({ onMenuClick }) {
  const { logout, user } = useAuth()
  const navigate = useNavigate()
  const [unread, setUnread] = useState(0)

  useEffect(() => {
    let alive = true
    const fetch = async () => {
      try {
        const alerts = await notificationApi.alerts()
        if (alive) setUnread((Array.isArray(alerts) ? alerts : alerts.results || []).filter(a => !a.is_read).length)
      } catch {}
    }
    fetch()
    const t = setInterval(fetch, 30000)
    return () => { alive = false; clearInterval(t) }
  }, [])

  const handleLogout = () => { logout(); navigate('/login') }

  return (
    <header style={{
      height: 'var(--topbar-h)', background: '#fff', borderBottom: '1px solid var(--gray-200)',
      display: 'flex', alignItems: 'center', padding: '0 20px', gap: 12, flexShrink: 0,
    }}>
      {/* Hamburger (mobile) */}
      <button
        onClick={onMenuClick}
        style={{ background: 'none', border: 'none', padding: 6, color: 'var(--gray-600)', display: 'none' }}
        className="menu-btn"
      >
        <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
          <path d="M3 12h18M3 6h18M3 18h18" />
        </svg>
      </button>

      <div style={{ flex: 1 }} />

      {/* Notifications */}
      <Link to="/notifications" style={{ position: 'relative', display: 'flex', padding: 6, color: 'var(--gray-600)' }}>
        <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
          <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9M13.73 21a2 2 0 0 1-3.46 0" />
        </svg>
        {unread > 0 && (
          <span style={{
            position: 'absolute', top: 2, right: 2, background: 'var(--danger)', color: '#fff',
            width: 16, height: 16, borderRadius: '50%', fontSize: 10, fontWeight: 700,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>{unread > 9 ? '9+' : unread}</span>
        )}
      </Link>

      {/* User menu */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <div style={{
          width: 32, height: 32, borderRadius: '50%', background: 'var(--primary)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          color: '#fff', fontWeight: 600, fontSize: 13,
        }}>
          {user?.username?.[0]?.toUpperCase() || 'U'}
        </div>
        <div style={{ fontSize: 13 }}>
          <div style={{ fontWeight: 500 }}>{user?.username}</div>
        </div>
        <button onClick={handleLogout} className="btn btn-secondary btn-sm" style={{ marginLeft: 4 }}>
          Logout
        </button>
      </div>

      <style>{`
        @media (max-width: 767px) { .menu-btn { display: flex !important; } }
      `}</style>
    </header>
  )
}
