import React, { useState, useEffect } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { notificationApi } from '../../api/client'
import drSmithPhoto from '../../static/dr_smith.png'

const USER_PHOTOS = {
  dr_smith: drSmithPhoto,
}

const ROUTE_LABELS = {
  '/':               'Dashboard',
  '/appointments':   'Appointments',
  '/providers':      'Find Providers',
  '/availability':   'My Availability',
  '/medications':    'Medications',
  '/messages':       'Messages',
  '/notifications':  'Notifications',
  '/medical-history':'Medical History',
  '/family':         'Family Access',
  '/profile':        'Profile',
  '/simulator':      'Data Simulator',
}

function Icon({ path, size = 18 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
      <path d={path} />
    </svg>
  )
}

export default function TopBar({ onMenuClick }) {
  const { logout, user } = useAuth()
  const navigate = useNavigate()
  const { pathname } = useLocation()
  const [unread, setUnread] = useState(0)

  useEffect(() => {
    let alive = true
    const load = async () => {
      try {
        const alerts = await notificationApi.alerts()
        if (alive) {
          const arr = Array.isArray(alerts) ? alerts : alerts.results || []
          setUnread(arr.filter(a => !a.is_read).length)
        }
      } catch {}
    }
    load()
    const t = setInterval(load, 30000)
    return () => { alive = false; clearInterval(t) }
  }, [])

  const handleLogout = () => { logout(); navigate('/login') }

  const pageTitle = ROUTE_LABELS[pathname] || ''
  const username = user?.username || ''
  const initial = username[0]?.toUpperCase() || 'U'
  const userPhoto = USER_PHOTOS[username]

  return (
    <header style={{
      height: 'var(--topbar-h)',
      background: 'var(--white)',
      borderBottom: '1px solid var(--gray-150)',
      display: 'flex',
      alignItems: 'center',
      padding: '0 24px',
      gap: 16,
      flexShrink: 0,
      position: 'sticky',
      top: 0,
      zIndex: 50,
    }}>
      {/* Mobile hamburger */}
      <button
        onClick={onMenuClick}
        className="btn btn-ghost btn-sm menu-btn"
        style={{ display: 'none', padding: 6 }}
      >
        <Icon path="M3 12h18M3 6h18M3 18h18" />
      </button>

      {/* Page title */}
      <div style={{ flex: 1 }}>
        <span style={{
          fontSize: 15,
          fontWeight: 600,
          color: 'var(--gray-900)',
          letterSpacing: '-0.02em',
        }}>
          {pageTitle}
        </span>
      </div>

      {/* Right cluster */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>

        {/* Notifications bell */}
        <Link
          to="/notifications"
          style={{
            position: 'relative',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: 36, height: 36,
            borderRadius: 8,
            color: 'var(--gray-500)',
            transition: 'background .15s, color .15s',
          }}
          onMouseEnter={e => { e.currentTarget.style.background = 'var(--gray-100)'; e.currentTarget.style.color = 'var(--gray-800)' }}
          onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'var(--gray-500)' }}
        >
          <Icon path="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9M13.73 21a2 2 0 0 1-3.46 0" />
          {unread > 0 && (
            <span style={{
              position: 'absolute',
              top: 5, right: 5,
              background: 'var(--danger)',
              color: 'var(--white)',
              width: 15, height: 15,
              borderRadius: '50%',
              fontSize: 9,
              fontWeight: 700,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              border: '2px solid var(--white)',
            }}>
              {unread > 9 ? '9+' : unread}
            </span>
          )}
        </Link>

        {/* Divider */}
        <div style={{ width: 1, height: 22, background: 'var(--gray-150)', margin: '0 2px' }} />

        {/* Avatar */}
        <div style={{
          width: 32, height: 32, borderRadius: 8,
          overflow: 'hidden',
          background: userPhoto ? 'transparent' : 'var(--gray-100)',
          border: '1.5px solid var(--gray-200)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          color: 'var(--gray-600)', fontWeight: 700, fontSize: 13,
          flexShrink: 0,
          cursor: 'default',
        }}>
          {userPhoto
            ? <img src={userPhoto} alt={username} style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'top' }} />
            : initial
          }
        </div>

        {/* Logout */}
        <button
          onClick={handleLogout}
          className="btn btn-ghost btn-sm"
          style={{ color: 'var(--gray-400)', padding: '6px 8px' }}
          title="Sign out"
        >
          <Icon path="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9" size={16} />
        </button>
      </div>

      <style>{`
        @media (max-width: 767px) { .menu-btn { display: flex !important; } }
      `}</style>
    </header>
  )
}
