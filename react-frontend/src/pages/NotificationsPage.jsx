import React, { useState, useEffect } from 'react'
import { notificationApi } from '../api/client'
import { useToast } from '../hooks/useToast'

function Icon({ path, size = 16 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
      <path d={path} />
    </svg>
  )
}

function timeAgo(dateStr) {
  const diff = Date.now() - new Date(dateStr).getTime()
  const m = Math.floor(diff / 60000)
  if (m < 1) return 'just now'
  if (m < 60) return `${m}m ago`
  const h = Math.floor(m / 60)
  if (h < 24) return `${h}h ago`
  const d = Math.floor(h / 24)
  if (d < 7) return `${d}d ago`
  return new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

function AlertItem({ alert, onMarkRead, onDismiss }) {
  const [expanded, setExpanded] = useState(false)

  return (
    <div style={{
      borderBottom: '1px solid var(--gray-100)',
      transition: 'background .1s',
    }}>
      {/* Header row — always visible, clickable to expand */}
      <div
        style={{
          display: 'flex', alignItems: 'flex-start', gap: 12,
          padding: '14px 20px', cursor: 'pointer',
        }}
        onClick={() => setExpanded(e => !e)}
        onMouseEnter={e => e.currentTarget.style.background = 'var(--gray-25)'}
        onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
      >
        {/* Unread dot */}
        <div style={{
          width: 7, height: 7, borderRadius: '50%', marginTop: 5, flexShrink: 0,
          background: alert.is_read ? 'var(--gray-200)' : '#2563eb',
          boxShadow: alert.is_read ? 'none' : '0 0 0 2px #dbeafe',
        }} />

        {/* Content */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{
            fontSize: 13, lineHeight: 1.5,
            color: 'var(--gray-800)',
            fontWeight: alert.is_read ? 400 : 500,
            letterSpacing: '-0.01em',
          }}>
            {alert.message}
          </div>
          <div style={{ fontSize: 11, color: 'var(--gray-400)', marginTop: 3 }}>
            {timeAgo(alert.created_at)}
          </div>
        </div>

        {/* Expand chevron */}
        <div style={{
          color: 'var(--gray-300)', transition: 'transform .15s',
          transform: expanded ? 'rotate(180deg)' : 'none',
          flexShrink: 0, marginTop: 2,
        }}>
          <Icon path="M6 9l6 6 6-6" size={14} />
        </div>
      </div>

      {/* Expanded detail */}
      {expanded && (
        <div style={{
          padding: '0 20px 16px 39px',
          display: 'flex', flexDirection: 'column', gap: 10,
        }}>
          <div style={{
            padding: '10px 14px', borderRadius: 8,
            background: 'var(--gray-25)', border: '1px solid var(--gray-150)',
            fontSize: 13, color: 'var(--gray-600)', lineHeight: 1.6,
          }}>
            {alert.message}
            <div style={{ fontSize: 11, color: 'var(--gray-400)', marginTop: 6 }}>
              {new Date(alert.created_at).toLocaleString('en-US', {
                weekday: 'short', month: 'short', day: 'numeric',
                hour: '2-digit', minute: '2-digit',
              })}
            </div>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            {!alert.is_read && (
              <button
                className="btn btn-secondary btn-sm"
                style={{ fontSize: 12 }}
                onClick={e => { e.stopPropagation(); onMarkRead(alert.id) }}
              >
                Mark as read
              </button>
            )}
            <button
              className="btn btn-sm"
              style={{
                fontSize: 12, background: 'none', border: '1px solid var(--gray-200)',
                color: 'var(--danger)', cursor: 'pointer',
              }}
              onClick={e => { e.stopPropagation(); onDismiss(alert.id) }}
            >
              Dismiss
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

const SETTING_KEYS = [
  { key: 'email_alerts',        label: 'Email Alerts',                desc: 'Receive alerts via email' },
  { key: 'sms_alerts',          label: 'SMS Alerts',                  desc: 'Receive alerts via text message' },
  { key: 'push_notifications',  label: 'Push Notifications',          desc: 'Browser push notifications' },
  { key: 'appointment_reminders', label: 'Appointment Reminders',     desc: 'Reminders before scheduled appointments' },
  { key: 'medication_reminders',  label: 'Medication Reminders',      desc: 'Alerts for scheduled medications' },
  { key: 'profile_changes',       label: 'Profile Change Alerts',     desc: 'Notify when account details are updated' },
  { key: 'prescription_updates',  label: 'Prescription Updates',      desc: 'Alerts for new or changed prescriptions' },
]

export default function NotificationsPage() {
  const t = useToast()
  const [alerts, setAlerts]     = useState([])
  const [settings, setSettings] = useState(null)
  const [loading, setLoading]   = useState(true)
  const [tab, setTab]           = useState('alerts')
  const [saving, setSaving]     = useState(false)
  const [filter, setFilter]     = useState('all') // 'all' | 'unread' | 'read'

  const reload = async () => {
    setLoading(true)
    try {
      const [a, s] = await Promise.allSettled([notificationApi.alerts(), notificationApi.mySettings()])
      setAlerts(a.value ? (Array.isArray(a.value) ? a.value : a.value.results || []) : [])
      const sVal = s.value
      if (sVal) setSettings(Array.isArray(sVal) ? (sVal[0] || null) : sVal)
    } finally { setLoading(false) }
  }

  useEffect(() => { reload() }, [])

  const markRead = async (id) => {
    try {
      await notificationApi.markRead(id)
      setAlerts(prev => prev.map(a => a.id === id ? { ...a, is_read: true } : a))
    } catch (e) { t.error(e.message) }
  }

  const dismiss = async (id) => {
    try {
      await notificationApi.deleteAlert(id)
      setAlerts(prev => prev.filter(a => a.id !== id))
      t.success('Alert dismissed')
    } catch (e) {
      // If delete not supported, fall back to mark-read
      await markRead(id)
    }
  }

  const markAllRead = async () => {
    try {
      await Promise.all(alerts.filter(a => !a.is_read).map(a => notificationApi.markRead(a.id)))
      setAlerts(prev => prev.map(a => ({ ...a, is_read: true })))
    } catch (e) { t.error(e.message) }
  }

  const saveSettings = async () => {
    setSaving(true)
    try { await notificationApi.updateSettings(settings); t.success('Preferences saved') }
    catch (e) { t.error(e.message) }
    finally { setSaving(false) }
  }

  const toggle = (key) => setSettings(s => ({ ...s, [key]: !s[key] }))

  const unreadCount = alerts.filter(a => !a.is_read).length
  const displayed = filter === 'unread' ? alerts.filter(a => !a.is_read)
                  : filter === 'read'   ? alerts.filter(a => a.is_read)
                  : alerts

  return (
    <div style={{ maxWidth: 720 }}>
      {/* Header */}
      <div style={{ marginBottom: 28 }}>
        <h1 style={{ fontFamily: 'var(--font-serif)', fontSize: 24, fontWeight: 400, color: 'var(--gray-900)', letterSpacing: '-0.01em' }}>
          Notifications
        </h1>
        <p style={{ fontSize: 13, color: 'var(--gray-400)', marginTop: 4 }}>Stay informed about your care activity</p>
      </div>

      {/* Tabs */}
      <div className="tab-bar" style={{ marginBottom: 24 }}>
        <button className={`tab-btn ${tab === 'alerts' ? 'active' : ''}`} onClick={() => setTab('alerts')}>
          Alerts {unreadCount > 0 && (
            <span style={{
              marginLeft: 6, background: '#2563eb', color: '#fff',
              borderRadius: 20, fontSize: 10, fontWeight: 700,
              padding: '0px 5px', lineHeight: '16px', display: 'inline-block',
            }}>{unreadCount}</span>
          )}
        </button>
        <button className={`tab-btn ${tab === 'settings' ? 'active' : ''}`} onClick={() => setTab('settings')}>
          Preferences
        </button>
      </div>

      {loading ? <div className="loading-center"><div className="spinner" /></div> : (
        <>
          {/* ── Alerts tab ── */}
          {tab === 'alerts' && (
            <div>
              {/* Filter + actions bar */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16, gap: 12 }}>
                <div style={{ display: 'flex', gap: 4 }}>
                  {['all', 'unread', 'read'].map(f => (
                    <button key={f} onClick={() => setFilter(f)} style={{
                      padding: '4px 12px', borderRadius: 100, fontSize: 12, border: 'none',
                      background: filter === f ? 'var(--gray-900)' : 'var(--gray-100)',
                      color: filter === f ? '#fff' : 'var(--gray-500)',
                      fontWeight: 500, cursor: 'pointer', fontFamily: 'var(--font)',
                      textTransform: 'capitalize',
                    }}>{f}</button>
                  ))}
                </div>
                {unreadCount > 0 && (
                  <button className="btn btn-ghost btn-sm" style={{ fontSize: 12, color: 'var(--primary)' }} onClick={markAllRead}>
                    Mark all read
                  </button>
                )}
              </div>

              {displayed.length === 0 ? (
                <div style={{
                  padding: '52px 20px', textAlign: 'center', color: 'var(--gray-300)',
                  border: '1px dashed var(--gray-200)', borderRadius: 12,
                }}>
                  <Icon path="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9M13.73 21a2 2 0 0 1-3.46 0" size={28} />
                  <p style={{ marginTop: 12, fontSize: 14 }}>
                    {filter === 'unread' ? 'No unread alerts' : filter === 'read' ? 'No read alerts' : 'No alerts'}
                  </p>
                </div>
              ) : (
                <div style={{ background: 'var(--white)', border: '1px solid var(--gray-150)', borderRadius: 14, overflow: 'hidden' }}>
                  {displayed.map((a, i) => (
                    <AlertItem
                      key={a.id}
                      alert={a}
                      onMarkRead={markRead}
                      onDismiss={dismiss}
                    />
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ── Settings tab ── */}
          {tab === 'settings' && (
            <div style={{ background: 'var(--white)', border: '1px solid var(--gray-150)', borderRadius: 14, overflow: 'hidden' }}>
              <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--gray-100)' }}>
                <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--gray-900)', letterSpacing: '-0.01em' }}>
                  Notification Preferences
                </div>
                <div style={{ fontSize: 12, color: 'var(--gray-400)', marginTop: 2 }}>
                  Choose how and when you receive notifications
                </div>
              </div>

              {!settings ? (
                <div style={{ padding: 24, color: 'var(--gray-500)', fontSize: 13 }}>
                  No preferences configured for your account.
                </div>
              ) : (
                <>
                  <div style={{ padding: '4px 0' }}>
                    {SETTING_KEYS.map(({ key, label, desc }) => settings[key] !== undefined && (
                      <label key={key} style={{
                        display: 'flex', alignItems: 'center', gap: 14,
                        padding: '14px 20px', cursor: 'pointer',
                        borderBottom: '1px solid var(--gray-100)',
                        transition: 'background .1s',
                      }}
                      onMouseEnter={e => e.currentTarget.style.background = 'var(--gray-25)'}
                      onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                      >
                        {/* Toggle switch */}
                        <div
                          style={{
                            width: 36, height: 20, borderRadius: 10, flexShrink: 0, position: 'relative',
                            background: settings[key] ? '#2563eb' : 'var(--gray-200)',
                            transition: 'background .2s', cursor: 'pointer',
                          }}
                          onClick={() => toggle(key)}
                        >
                          <div style={{
                            position: 'absolute', top: 2, left: settings[key] ? 18 : 2,
                            width: 16, height: 16, borderRadius: '50%',
                            background: 'white', boxShadow: '0 1px 3px rgba(0,0,0,.2)',
                            transition: 'left .2s',
                          }} />
                        </div>
                        <div>
                          <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--gray-800)', letterSpacing: '-0.01em' }}>{label}</div>
                          <div style={{ fontSize: 11, color: 'var(--gray-400)', marginTop: 1 }}>{desc}</div>
                        </div>
                      </label>
                    ))}
                  </div>
                  <div style={{ padding: '14px 20px', borderTop: '1px solid var(--gray-100)', display: 'flex', justifyContent: 'flex-end' }}>
                    <button className="btn btn-primary btn-sm" onClick={saveSettings} disabled={saving}>
                      {saving ? 'Saving…' : 'Save Preferences'}
                    </button>
                  </div>
                </>
              )}
            </div>
          )}
        </>
      )}
    </div>
  )
}
