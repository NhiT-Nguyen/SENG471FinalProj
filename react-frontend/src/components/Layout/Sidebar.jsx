import React from 'react'
import { NavLink } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import logoWithName from '../../static/logowithname.png'
import drSmithPhoto from '../../static/dr_smith.png'

/* ── user photo map ── */
const USER_PHOTOS = {
  dr_smith: drSmithPhoto,
}

/* ── thin SVG icon ── */
function Icon({ path, size = 16 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"
      style={{ flexShrink: 0 }}>
      <path d={path} />
    </svg>
  )
}

/* ── nav sections ── */
const MAIN_NAV = [
  { to: '/',              label: 'Dashboard',     icon: 'M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z' },
  { to: '/appointments',  label: 'Appointments',  icon: 'M8 2v4M16 2v4M3 10h18M5 4h14a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2z' },
  { to: '/messages',      label: 'Messages',      icon: 'M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z' },
  { to: '/notifications', label: 'Notifications', icon: 'M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9M13.73 21a2 2 0 0 1-3.46 0' },
]

const CLINICAL_NAV = [
  { to: '/medications',    label: 'Medications',    icon: 'M10.5 1.5H8.25A2.25 2.25 0 006 3.75v16.5a2.25 2.25 0 002.25 2.25h7.5A2.25 2.25 0 0018 20.25V3.75a2.25 2.25 0 00-2.25-2.25H13.5m-3 0V3h3V1.5m-3 0h3m-3 8.25h3', roles: ['all'] },
  { to: '/medical-history',label: 'Medical History',icon: 'M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8zM14 2v6h6M16 13H8M16 17H8M10 9H8', roles: ['all'] },
  { to: '/providers',      label: 'Find Providers', icon: 'M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2M9 7a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75', roles: ['patient','caregiver','family_member'] },
  { to: '/availability',   label: 'My Availability',icon: 'M12 8v4l3 3M12 2a10 10 0 1 0 0 20A10 10 0 0 0 12 2z', roles: ['healthcare_provider'] },
  { to: '/family',         label: 'Family Access',  icon: 'M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2M23 21v-2a4 4 0 0 0-3-3.87M9 7a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM16 3.13a4 4 0 0 1 0 7.75', roles: ['patient','family_member'] },
]

const ACCOUNT_NAV = [
  { to: '/profile',   label: 'Profile',   icon: 'M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2M12 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8z' },
  { to: '/simulator', label: 'Simulator', icon: 'M9 3H5a2 2 0 0 0-2 2v4m6-6h10a2 2 0 0 1 2 2v4M9 3v18m0 0h10a2 2 0 0 0 2-2v-4M9 21H5a2 2 0 0 1-2-2v-4m0 0h18' },
]

const ROLE_META = {
  patient:             { label: 'Patient',             color: '#0d9488', bg: '#f0fdfa' },
  healthcare_provider: { label: 'Healthcare Provider', color: '#2563eb', bg: '#eff6ff' },
  caregiver:           { label: 'Caregiver',           color: '#7c3aed', bg: '#f5f3ff' },
  family_member:       { label: 'Family Member',       color: '#d97706', bg: '#fffbeb' },
}

function NavSection({ label, items, role }) {
  const visible = items.filter(n => !n.roles || n.roles.includes('all') || n.roles.includes(role))
  if (visible.length === 0) return null
  return (
    <div style={{ marginBottom: 4 }}>
      {label && (
        <div style={{
          padding: '10px 16px 4px',
          fontSize: 10,
          fontWeight: 700,
          letterSpacing: '0.1em',
          textTransform: 'uppercase',
          color: 'var(--gray-350, #c1c7d0)',
        }}>
          {label}
        </div>
      )}
      {visible.map(n => (
        <NavLink
          key={n.to} to={n.to} end={n.to === '/'}
          style={({ isActive }) => ({
            display: 'flex',
            alignItems: 'center',
            gap: 9,
            padding: '7px 12px',
            margin: '1px 8px',
            borderRadius: 8,
            fontSize: 13,
            fontWeight: isActive ? 600 : 450,
            color: isActive ? 'var(--primary)' : 'var(--gray-600)',
            background: isActive ? 'var(--primary-light)' : 'transparent',
            textDecoration: 'none',
            transition: 'background .12s, color .12s',
            letterSpacing: '-0.01em',
          })}
          onMouseEnter={e => { if (!e.currentTarget.style.background.includes('eff6ff')) e.currentTarget.style.background = 'var(--gray-100)' }}
          onMouseLeave={e => { if (!e.currentTarget.style.background.includes('eff6ff')) e.currentTarget.style.background = 'transparent' }}
        >
          <Icon path={n.icon} />
          <span>{n.label}</span>
        </NavLink>
      ))}
    </div>
  )
}

export default function Sidebar({ onClose }) {
  const { role, profile, user } = useAuth()
  const meta = ROLE_META[role] || {}
  const username = profile?.user_username || profile?.user?.username || user?.username || ''
  const fullName = [profile?.user_first_name || profile?.user?.first_name, profile?.user_last_name || profile?.user?.last_name].filter(Boolean).join(' ')
  const initial = (profile?.user_first_name || profile?.user?.first_name || username || 'U')[0]?.toUpperCase()
  const userPhoto = USER_PHOTOS[username]

  return (
    <aside style={{
      width: 'var(--sidebar-w)',
      background: 'var(--white)',
      borderRight: '1px solid var(--gray-150)',
      display: 'flex',
      flexDirection: 'column',
      height: '100vh',
      position: 'sticky',
      top: 0,
      flexShrink: 0,
      overflow: 'hidden',
    }}>
      {/* Brand */}
      <div style={{ padding: '16px 18px 14px', borderBottom: '1px solid var(--gray-100)' }}>
        <img
          src={logoWithName}
          alt="AegisCare"
          style={{ height: 30, objectFit: 'contain', objectPosition: 'left center', maxWidth: '100%' }}
        />
      </div>

      {/* User identity */}
      {profile && (
        <div style={{ padding: '10px 12px', borderBottom: '1px solid var(--gray-100)', marginBottom: 2 }}>
          <div style={{
            display: 'flex', alignItems: 'center', gap: 10,
            padding: '8px 10px', borderRadius: 10,
            background: 'var(--gray-25)',
            border: '1px solid var(--gray-100)',
          }}>
            {/* Avatar — photo or initial */}
            <div style={{
              width: 34, height: 34, borderRadius: 9, flexShrink: 0,
              overflow: 'hidden',
              background: userPhoto ? 'transparent' : `${meta.color}18`,
              border: `1.5px solid ${userPhoto ? 'var(--gray-200)' : meta.color + '30'}`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontWeight: 700, fontSize: 14, color: meta.color,
            }}>
              {userPhoto
                ? <img src={userPhoto} alt={username} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                : initial
              }
            </div>
            <div style={{ minWidth: 0 }}>
              <div style={{
                fontSize: 13, fontWeight: 600, color: 'var(--gray-900)',
                whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                letterSpacing: '-0.02em',
              }}>
                {fullName || username}
              </div>
              <div style={{
                display: 'inline-flex', alignItems: 'center', gap: 3,
                fontSize: 10, fontWeight: 600, color: meta.color,
                background: meta.bg, padding: '1px 7px', borderRadius: 5, marginTop: 2,
                letterSpacing: '0.02em',
              }}>
                <span style={{ width: 4, height: 4, borderRadius: '50%', background: meta.color, flexShrink: 0 }} />
                {meta.label}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Navigation */}
      <nav style={{ flex: 1, overflowY: 'auto', padding: '6px 0 12px' }}>
        <NavSection label={null}        items={MAIN_NAV}     role={role} />
        <NavSection label="Clinical"    items={CLINICAL_NAV} role={role} />
        <NavSection label="Account"     items={ACCOUNT_NAV}  role={role} />
      </nav>

      {/* Footer */}
      <div style={{
        padding: '12px 18px',
        borderTop: '1px solid var(--gray-100)',
        fontSize: 10,
        color: 'var(--gray-300)',
        letterSpacing: '0.05em',
        fontWeight: 500,
      }}>
        SENG 471 · AegisCare Platform
      </div>
    </aside>
  )
}
