import React from 'react'
import { NavLink } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'

const Icon = ({ d }) => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d={d} />
  </svg>
)

export default function Sidebar({ onClose }) {
  const { role, isProvider, isPatient, profile } = useAuth()

  const navs = [
    { to: '/', label: 'Dashboard', icon: 'M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z', roles: ['all'] },
    { to: '/appointments', label: 'Appointments', icon: 'M8 2v4M16 2v4M3 10h18M5 4h14a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2z', roles: ['all'] },
    { to: '/providers', label: 'Find Providers', icon: 'M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2M9 7a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75', roles: ['patient', 'caregiver', 'family_member'] },
    { to: '/availability', label: 'My Availability', icon: 'M12 2v10l4 2M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20z', roles: ['healthcare_provider'] },
    { to: '/medications', label: 'Medications', icon: 'M9 3H5a2 2 0 0 0-2 2v4m6-6h10a2 2 0 0 1 2 2v4M9 3v18m0 0h10a2 2 0 0 0 2-2v-4M9 21H5a2 2 0 0 1-2-2v-4m0 0h18', roles: ['all'] },
    { to: '/medical-history', label: 'Medical History', icon: 'M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8zM14 2v6h6M16 13H8M16 17H8M10 9H8', roles: ['all'] },
    { to: '/messages', label: 'Messages', icon: 'M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z', roles: ['all'] },
    { to: '/notifications', label: 'Notifications', icon: 'M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9M13.73 21a2 2 0 0 1-3.46 0', roles: ['all'] },
    { to: '/family', label: 'Family Access', icon: 'M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2M23 21v-2a4 4 0 0 0-3-3.87M9 7a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM16 3.13a4 4 0 0 1 0 7.75', roles: ['patient'] },
    { to: '/profile', label: 'Profile', icon: 'M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2M12 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8z', roles: ['all'] },
    { to: '/simulator', label: 'Data Simulator', icon: 'M9 3H5a2 2 0 0 0-2 2v4m0 0h18M3 9v10a2 2 0 0 0 2 2h4M3 9h18v10a2 2 0 0 0-2 2h-4m-4-8v4m0 0l-2-2m2 2 2-2', roles: ['all'] },
  ]

  const visible = navs.filter(n => n.roles.includes('all') || n.roles.includes(role))

  return (
    <aside style={{
      width: 'var(--sidebar-w)', background: '#fff', borderRight: '1px solid var(--gray-200)',
      display: 'flex', flexDirection: 'column', height: '100vh', position: 'sticky', top: 0,
      flexShrink: 0,
    }}>
      {/* Logo */}
      <div style={{ padding: '20px', borderBottom: '1px solid var(--gray-100)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ width: 32, height: 32, borderRadius: 8, background: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="white"><path d="M12 2l9 4.5v9L12 22l-9-6.5v-9L12 2z"/></svg>
          </div>
          <div>
            <div style={{ fontWeight: 700, fontSize: 14, color: 'var(--gray-900)' }}>HealthCare</div>
            <div style={{ fontSize: 11, color: 'var(--gray-400)', marginTop: 1 }}>Platform</div>
          </div>
        </div>
      </div>

      {/* User info */}
      {profile && (
        <div style={{ padding: '12px 16px', borderBottom: '1px solid var(--gray-100)', background: 'var(--gray-50)' }}>
          <div style={{ fontSize: 13, fontWeight: 600 }}>{profile.user_username || profile.user?.username}</div>
          <div style={{ fontSize: 11, color: 'var(--gray-500)', textTransform: 'capitalize', marginTop: 2 }}>
            {role?.replace('_', ' ')}
          </div>
        </div>
      )}

      {/* Nav */}
      <nav style={{ flex: 1, overflowY: 'auto', padding: '8px 0' }}>
        {visible.map(n => (
          <NavLink
            key={n.to} to={n.to}
            end={n.to === '/'}
            onClick={onClose}
            style={({ isActive }) => ({
              display: 'flex', alignItems: 'center', gap: 10,
              padding: '9px 16px', fontSize: 13, fontWeight: 500,
              color: isActive ? 'var(--primary)' : 'var(--gray-600)',
              background: isActive ? 'var(--primary-light)' : 'transparent',
              borderRight: isActive ? '3px solid var(--primary)' : '3px solid transparent',
              transition: 'all .1s',
              textDecoration: 'none',
            })}
          >
            <Icon d={n.icon} />
            {n.label}
          </NavLink>
        ))}
      </nav>

      {/* Simulator badge */}
      <div style={{ padding: '12px 16px', borderTop: '1px solid var(--gray-100)', fontSize: 11, color: 'var(--gray-400)', textAlign: 'center' }}>
        v0.1 · Healthcare Platform
      </div>
    </aside>
  )
}
