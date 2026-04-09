import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { appointmentApi, medicationApi, messageApi, notificationApi } from '../api/client'

const ALERT_ICONS = {
  appointment: 'M8 2v4M16 2v4M3 10h18M5 4h14a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2z',
  medication:  'M10.5 1.5H8.25A2.25 2.25 0 006 3.75v16.5a2.25 2.25 0 002.25 2.25h7.5A2.25 2.25 0 0018 20.25V3.75a2.25 2.25 0 00-2.25-2.25H13.5m-3 0V3h3V1.5m-3 0h3m-3 8.25h3',
  message:     'M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z',
  default:     'M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9M13.73 21a2 2 0 0 1-3.46 0',
}

function Icon({ path, size = 16, color = 'currentColor' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
      stroke={color} strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
      <path d={path} />
    </svg>
  )
}

/* ─── Metric strip item ─── */
function Metric({ label, value, accent, to }) {
  const inner = (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      gap: 4,
      padding: '20px 28px',
      borderRight: '1px solid var(--gray-100)',
      flex: 1,
      minWidth: 0,
      transition: 'background .12s',
      cursor: to ? 'pointer' : 'default',
    }}
    onMouseEnter={e => { if (to) e.currentTarget.style.background = 'var(--gray-25)' }}
    onMouseLeave={e => { e.currentTarget.style.background = 'transparent' }}
    >
      <div style={{
        fontSize: 30,
        fontWeight: 700,
        color: value === 0 ? 'var(--gray-300)' : (accent || 'var(--gray-900)'),
        letterSpacing: '-0.04em',
        lineHeight: 1,
        fontVariantNumeric: 'tabular-nums',
      }}>
        {value ?? '—'}
      </div>
      <div style={{ fontSize: 12, color: 'var(--gray-400)', fontWeight: 500, letterSpacing: '-0.005em' }}>
        {label}
      </div>
    </div>
  )
  return to ? <Link to={to} style={{ textDecoration: 'none', flex: 1 }}>{inner}</Link> : <div style={{ flex: 1 }}>{inner}</div>
}

/* ─── Action row ─── */
function ActionRow({ to, icon, label, description, accent, last }) {
  return (
    <Link to={to} style={{ textDecoration: 'none' }}>
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: 14,
        padding: '13px 0',
        borderBottom: last ? 'none' : '1px solid var(--gray-100)',
        transition: 'opacity .12s',
        cursor: 'pointer',
      }}
      onMouseEnter={e => e.currentTarget.style.opacity = '0.7'}
      onMouseLeave={e => e.currentTarget.style.opacity = '1'}
      >
        <div style={{
          width: 34, height: 34, borderRadius: 8, flexShrink: 0,
          background: accent + '12',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <Icon path={icon} size={15} color={accent} />
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--gray-800)', letterSpacing: '-0.01em' }}>{label}</div>
          {description && <div style={{ fontSize: 12, color: 'var(--gray-400)', marginTop: 1 }}>{description}</div>}
        </div>
        <Icon path="M9 18l6-6-6-6" size={13} color="var(--gray-300)" />
      </div>
    </Link>
  )
}

/* ─── Alert card ─── */
function AlertCard({ alert, onDismiss, last }) {
  const ago = (() => {
    const diff = Date.now() - new Date(alert.created_at).getTime()
    const m = Math.floor(diff / 60000)
    if (m < 1) return 'just now'
    if (m < 60) return `${m}m ago`
    const h = Math.floor(m / 60)
    if (h < 24) return `${h}h ago`
    return `${Math.floor(h / 24)}d ago`
  })()

  const msgLower = (alert.message || '').toLowerCase()
  const iconPath = msgLower.includes('appoint') ? ALERT_ICONS.appointment
                 : msgLower.includes('medic') || msgLower.includes('prescri') ? ALERT_ICONS.medication
                 : msgLower.includes('message') ? ALERT_ICONS.message
                 : ALERT_ICONS.default

  const accent = alert.is_read ? 'var(--gray-300)' : '#2563eb'

  return (
    <div style={{
      display: 'flex', alignItems: 'flex-start', gap: 10,
      padding: '11px 0',
      borderBottom: last ? 'none' : '1px solid var(--gray-100)',
    }}>
      {/* Icon bubble */}
      <div style={{
        width: 30, height: 30, borderRadius: 8, flexShrink: 0,
        background: alert.is_read ? 'var(--gray-100)' : '#eff6ff',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        marginTop: 1,
      }}>
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none"
          stroke={accent} strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
          <path d={iconPath} />
        </svg>
      </div>

      {/* Text */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{
          fontSize: 12, color: alert.is_read ? 'var(--gray-500)' : 'var(--gray-800)',
          fontWeight: alert.is_read ? 400 : 500,
          lineHeight: 1.5, letterSpacing: '-0.01em',
          display: '-webkit-box', WebkitLineClamp: 2,
          WebkitBoxOrient: 'vertical', overflow: 'hidden',
        }}>
          {alert.message}
        </div>
        <div style={{ fontSize: 10, color: 'var(--gray-350, #c1c7d0)', marginTop: 2 }}>{ago}</div>
      </div>

      {/* Dismiss × */}
      <button
        onClick={() => onDismiss(alert.id)}
        style={{
          background: 'none', border: 'none', cursor: 'pointer',
          color: 'var(--gray-300)', fontSize: 14, lineHeight: 1,
          padding: '2px 4px', borderRadius: 4,
          flexShrink: 0, marginTop: 1,
          transition: 'color .12s',
        }}
        onMouseEnter={e => e.currentTarget.style.color = 'var(--gray-500)'}
        onMouseLeave={e => e.currentTarget.style.color = 'var(--gray-300)'}
        title="Dismiss"
      >
        ×
      </button>
    </div>
  )
}

/* ─── role-specific quick actions ─── */
const QUICK_ACTIONS = {
  healthcare_provider: [
    { to: '/appointments',   icon: 'M8 2v4M16 2v4M3 10h18M5 4h14a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2z', label: 'Appointment Requests', description: 'Review and approve pending requests', accent: '#2563eb' },
    { to: '/availability',   icon: 'M12 8v4l3 3M12 2a10 10 0 1 0 0 20A10 10 0 0 0 12 2z', label: 'Manage Availability', description: 'Set your weekly schedule', accent: '#0d9488' },
    { to: '/medications',    icon: 'M10.5 1.5H8.25A2.25 2.25 0 006 3.75v16.5a2.25 2.25 0 002.25 2.25h7.5A2.25 2.25 0 0018 20.25V3.75a2.25 2.25 0 00-2.25-2.25H13.5m-3 0V3h3V1.5m-3 0h3m-3 8.25h3', label: 'Prescribe Medication', description: 'Add a new prescription', accent: '#7c3aed' },
    { to: '/medical-history',icon: 'M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8zM14 2v6h6', label: 'Medical Records', description: 'View and create patient records', accent: '#d97706' },
    { to: '/messages',       icon: 'M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z', label: 'Messages', description: 'Communicate with patients', accent: '#16a34a' },
  ],
  patient: [
    { to: '/providers',      icon: 'M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2M9 7a4 4 0 1 0 0-8 4 4 0 0 0 0 8z', label: 'Find a Provider', description: 'Search and request appointments', accent: '#2563eb' },
    { to: '/appointments',   icon: 'M8 2v4M16 2v4M3 10h18M5 4h14a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2z', label: 'My Appointments', description: 'View upcoming and past appointments', accent: '#0d9488' },
    { to: '/medications',    icon: 'M10.5 1.5H8.25A2.25 2.25 0 006 3.75v16.5a2.25 2.25 0 002.25 2.25h7.5A2.25 2.25 0 0018 20.25V3.75a2.25 2.25 0 00-2.25-2.25H13.5m-3 0V3h3V1.5m-3 0h3m-3 8.25h3', label: 'My Medications', description: 'Track active prescriptions', accent: '#7c3aed' },
    { to: '/medical-history',icon: 'M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8zM14 2v6h6', label: 'Medical History', description: 'Full health record summary', accent: '#d97706' },
    { to: '/family',         icon: 'M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2M23 21v-2a4 4 0 0 0-3-3.87M9 7a4 4 0 1 0 0-8 4 4 0 0 0 0 8z', label: 'Family Access', description: 'Manage who can see your records', accent: '#16a34a' },
  ],
  caregiver: [
    { to: '/providers',      icon: 'M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2M9 7a4 4 0 1 0 0-8 4 4 0 0 0 0 8z', label: 'Find a Provider', description: 'Book on behalf of a patient', accent: '#2563eb' },
    { to: '/appointments',   icon: 'M8 2v4M16 2v4M3 10h18M5 4h14a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2z', label: 'Appointments', description: 'View patient appointments', accent: '#0d9488' },
    { to: '/medications',    icon: 'M10.5 1.5H8.25A2.25 2.25 0 006 3.75v16.5a2.25 2.25 0 002.25 2.25h7.5A2.25 2.25 0 0018 20.25V3.75a2.25 2.25 0 00-2.25-2.25H13.5m-3 0V3h3V1.5m-3 0h3m-3 8.25h3', label: 'Medications', description: 'Monitor active prescriptions', accent: '#7c3aed' },
    { to: '/messages',       icon: 'M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z', label: 'Messages', description: 'Contact providers', accent: '#16a34a' },
  ],
  family_member: [
    { to: '/appointments',   icon: 'M8 2v4M16 2v4M3 10h18M5 4h14a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2z', label: 'Appointments', description: 'View family appointments', accent: '#2563eb' },
    { to: '/medications',    icon: 'M10.5 1.5H8.25A2.25 2.25 0 006 3.75v16.5a2.25 2.25 0 002.25 2.25h7.5A2.25 2.25 0 0018 20.25V3.75a2.25 2.25 0 00-2.25-2.25H13.5m-3 0V3h3V1.5m-3 0h3m-3 8.25h3', label: 'Medications', description: 'Monitor prescriptions', accent: '#7c3aed' },
    { to: '/medical-history',icon: 'M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8zM14 2v6h6', label: 'Medical History', description: 'View health records', accent: '#d97706' },
    { to: '/messages',       icon: 'M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z', label: 'Messages', description: 'Contact care team', accent: '#16a34a' },
  ],
}

export default function Dashboard() {
  const { profile, isProvider, role } = useAuth()
  const [stats, setStats]         = useState({})
  const [recentAlerts, setAlerts] = useState([])
  const [loading, setLoading]     = useState(true)

  const dismissAlert = async (id) => {
    setAlerts(prev => prev.filter(a => a.id !== id))
    try {
      await notificationApi.markRead(id)
    } catch {}
  }

  const firstName = profile?.user_first_name || profile?.user?.first_name
  const username  = profile?.user_username   || profile?.user?.username

  const greeting = (() => {
    const h = new Date().getHours()
    if (h < 12) return 'Good morning'
    if (h < 17) return 'Good afternoon'
    return 'Good evening'
  })()

  useEffect(() => {
    let alive = true
    const load = async () => {
      try {
        const [alerts, meds, msgs] = await Promise.allSettled([
          notificationApi.alerts(),
          medicationApi.current(),
          messageApi.unread(),
        ])
        let apptCount = 0, pendingCount = 0
        try {
          if (isProvider) {
            const p = await appointmentApi.pendingRequests()
            pendingCount = Array.isArray(p) ? p.length : p?.results?.length ?? 0
          } else {
            const a = await appointmentApi.list()
            apptCount = Array.isArray(a) ? a.length : a?.results?.length ?? 0
          }
        } catch {}

        if (!alive) return
        const toArr = r => r.status === 'fulfilled' ? (Array.isArray(r.value) ? r.value : r.value?.results || []) : []
        const alertArr = toArr(alerts)

        setStats({
          appointments:    apptCount,
          pendingRequests: pendingCount,
          medications:     toArr(meds).length,
          unreadMessages:  toArr(msgs).length,
          unreadAlerts:    alertArr.filter(a => !a.is_read).length,
        })
        setAlerts(alertArr.slice(0, 5))
      } catch {}
      finally { if (alive) setLoading(false) }
    }
    load()
    return () => { alive = false }
  }, [isProvider])

  const actions = QUICK_ACTIONS[role] || QUICK_ACTIONS.patient

  const metricRow = isProvider
    ? [
        { label: 'Pending requests',   value: stats.pendingRequests, accent: stats.pendingRequests > 0 ? '#2563eb' : undefined, to: '/appointments' },
        { label: 'Active medications',  value: stats.medications,    to: '/medications' },
        { label: 'Unread messages',     value: stats.unreadMessages, accent: stats.unreadMessages > 0 ? '#0d9488' : undefined, to: '/messages' },
        { label: 'Unread alerts',       value: stats.unreadAlerts,   accent: stats.unreadAlerts > 0 ? '#dc2626' : undefined, to: '/notifications' },
      ]
    : [
        { label: 'Appointments',        value: stats.appointments,   to: '/appointments' },
        { label: 'Active medications',  value: stats.medications,    to: '/medications' },
        { label: 'Unread messages',     value: stats.unreadMessages, accent: stats.unreadMessages > 0 ? '#0d9488' : undefined, to: '/messages' },
        { label: 'Unread alerts',       value: stats.unreadAlerts,   accent: stats.unreadAlerts > 0 ? '#dc2626' : undefined, to: '/notifications' },
      ]

  if (loading) return (
    <div className="loading-center">
      <div className="spinner" style={{ width: 24, height: 24 }} />
    </div>
  )

  return (
    <div style={{ maxWidth: 960 }}>

      {/* ── Greeting ── */}
      <div style={{ marginBottom: 32 }}>
        <div style={{
          fontFamily: 'var(--font-serif)',
          fontSize: 26,
          fontWeight: 400,
          color: 'var(--gray-900)',
          letterSpacing: '-0.01em',
          lineHeight: 1.2,
        }}>
          {greeting}{firstName || username ? `, ${firstName || username}` : ''}
        </div>
        <div style={{ fontSize: 13, color: 'var(--gray-350, #adb5bd)', marginTop: 5 }}>
          {new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
        </div>
      </div>

      {/* ── Metric strip ── */}
      <div style={{
        display: 'flex',
        background: 'var(--white)',
        border: '1px solid var(--gray-150)',
        borderRadius: 14,
        overflow: 'hidden',
        marginBottom: 32,
      }}>
        {metricRow.map((m, i) => (
          <Metric key={i} {...m} />
        ))}
      </div>

      {/* ── Two-column layout ── */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: 24, alignItems: 'start' }}>

        {/* Quick actions */}
        <div>
          <div style={{
            fontSize: 11,
            fontWeight: 600,
            color: 'var(--gray-350, #adb5bd)',
            letterSpacing: '0.08em',
            textTransform: 'uppercase',
            marginBottom: 14,
          }}>
            Quick Actions
          </div>
          <div style={{
            background: 'var(--white)',
            border: '1px solid var(--gray-150)',
            borderRadius: 14,
            padding: '4px 20px',
          }}>
            {actions.map((a, i) => (
              <ActionRow key={a.to} {...a} last={i === actions.length - 1} />
            ))}
          </div>
        </div>

        {/* Right column */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

          {/* Alerts */}
          <div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
              <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--gray-350, #adb5bd)', letterSpacing: '0.08em', textTransform: 'uppercase' }}>
                Recent Alerts
              </div>
              <Link to="/notifications" style={{ fontSize: 12, color: 'var(--primary)', fontWeight: 500 }}>
                View all
              </Link>
            </div>
            <div style={{
              background: 'var(--white)',
              border: '1px solid var(--gray-150)',
              borderRadius: 14,
              padding: '4px 14px',
            }}>
              {recentAlerts.length === 0 ? (
                <div style={{ padding: '28px 16px', textAlign: 'center', color: 'var(--gray-300)', fontSize: 12 }}>
                  All caught up
                </div>
              ) : recentAlerts.map((a, i) => (
                <AlertCard key={a.id} alert={a} onDismiss={dismissAlert} last={i === recentAlerts.length - 1} />
              ))}
            </div>
          </div>

          {/* Simulator link — minimal */}
          <div style={{
            padding: '14px 16px',
            borderRadius: 10,
            background: 'var(--gray-25)',
            border: '1px solid var(--gray-150)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 12,
          }}>
            <div>
              <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--gray-700)', marginBottom: 2 }}>Data Simulator</div>
              <div style={{ fontSize: 12, color: 'var(--gray-400)', lineHeight: 1.5 }}>Generate test data</div>
            </div>
            <Link to="/simulator">
              <button className="btn btn-secondary btn-sm" style={{ whiteSpace: 'nowrap', fontSize: 12 }}>
                Open
              </button>
            </Link>
          </div>

        </div>
      </div>

    </div>
  )
}
