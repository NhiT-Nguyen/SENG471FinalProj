import React, { useState, useEffect } from 'react'
import { notificationApi } from '../api/client'
import { useToast } from '../hooks/useToast'

export default function NotificationsPage() {
  const t = useToast()
  const [alerts, setAlerts]     = useState([])
  const [settings, setSettings] = useState(null)
  const [loading, setLoading]   = useState(true)
  const [tab, setTab]           = useState('alerts')
  const [saving, setSaving]     = useState(false)

  const reload = async () => {
    setLoading(true)
    try {
      const [a, s] = await Promise.allSettled([notificationApi.alerts(), notificationApi.mySettings()])
      setAlerts(a.value ? (Array.isArray(a.value) ? a.value : a.value.results || []) : [])
      // settings may be a list (take first) or an object
      const sVal = s.value
      if (sVal) {
        setSettings(Array.isArray(sVal) ? (sVal[0] || null) : sVal)
      }
    } finally { setLoading(false) }
  }

  useEffect(() => { reload() }, [])

  const markRead = async (id) => {
    try { await notificationApi.markRead(id); reload() }
    catch (e) { t.error(e.message) }
  }

  const markAllRead = async () => {
    try {
      await Promise.all(alerts.filter(a => !a.is_read).map(a => notificationApi.markRead(a.id)))
      reload()
    } catch (e) { t.error(e.message) }
  }

  const saveSettings = async () => {
    setSaving(true)
    try {
      await notificationApi.updateSettings(settings)
      t.success('Settings saved')
    } catch (e) { t.error(e.message) }
    finally { setSaving(false) }
  }

  const toggle = (key) => setSettings(s => ({ ...s, [key]: !s[key] }))

  const unread = alerts.filter(a => !a.is_read)

  const SETTING_KEYS = [
    { key: 'email_alerts', label: 'Email Alerts' },
    { key: 'sms_alerts', label: 'SMS Alerts' },
    { key: 'push_notifications', label: 'Push Notifications' },
    { key: 'appointment_reminders', label: 'Appointment Reminders' },
    { key: 'medication_reminders', label: 'Medication Reminders' },
    { key: 'profile_changes', label: 'Profile Change Notifications' },
    { key: 'prescription_updates', label: 'Prescription Updates' },
  ]

  return (
    <div>
      <div className="page-header">
        <h1>Notifications</h1>
        <p>View alerts and manage notification preferences</p>
      </div>

      <div style={{ display: 'flex', gap: 4, marginBottom: 20, borderBottom: '1px solid var(--gray-200)' }}>
        {[
          { id: 'alerts', label: `Alerts (${unread.length} unread)` },
          { id: 'settings', label: 'Settings' },
        ].map(tb => (
          <button key={tb.id} onClick={() => setTab(tb.id)}
            style={{
              background: 'none', border: 'none', padding: '10px 16px', fontSize: 13, fontWeight: 500,
              color: tab === tb.id ? 'var(--primary)' : 'var(--gray-500)',
              borderBottom: tab === tb.id ? '2px solid var(--primary)' : '2px solid transparent',
              marginBottom: -1,
            }}>
            {tb.label}
          </button>
        ))}
      </div>

      {loading ? <div className="loading-center"><div className="spinner" /></div> : (
        <>
          {tab === 'alerts' && (
            <div>
              {unread.length > 0 && (
                <div style={{ marginBottom: 12, display: 'flex', justifyContent: 'flex-end' }}>
                  <button className="btn btn-secondary btn-sm" onClick={markAllRead}>Mark all read</button>
                </div>
              )}
              {alerts.length === 0 ? (
                <div className="empty-state"><p>No alerts</p></div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {alerts.map(a => (
                    <div key={a.id} className="card" style={{
                      padding: 16,
                      borderLeft: `3px solid ${a.is_read ? 'var(--gray-200)' : 'var(--primary)'}`,
                      opacity: a.is_read ? .7 : 1,
                    }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12 }}>
                        <div>
                          <div style={{ fontSize: 14, fontWeight: a.is_read ? 400 : 600 }}>{a.message}</div>
                          <div style={{ fontSize: 11, color: 'var(--gray-400)', marginTop: 4 }}>
                            {new Date(a.created_at).toLocaleString()}
                          </div>
                        </div>
                        {!a.is_read && (
                          <button className="btn btn-secondary btn-sm" onClick={() => markRead(a.id)}>Mark read</button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {tab === 'settings' && (
            <div className="card" style={{ maxWidth: 480 }}>
              <div className="card-header"><h3>Notification Preferences</h3></div>
              <div className="card-body">
                {!settings ? (
                  <div className="alert alert-info">
                    No notification settings found.{' '}
                    <button className="btn btn-primary btn-sm" onClick={async () => {
                      try {
                        const s = await notificationApi.mySettings()
                        // POST to create if doesn't exist
                        if (!s || (Array.isArray(s) && s.length === 0)) {
                          const created = await notificationApi.mySettings()
                          setSettings(created)
                        }
                      } catch {}
                    }}>Initialize</button>
                  </div>
                ) : (
                  <>
                    {SETTING_KEYS.map(({ key, label }) => (
                      settings[key] !== undefined && (
                        <div key={key} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 0', borderBottom: '1px solid var(--gray-100)' }}>
                          <span style={{ fontSize: 14 }}>{label}</span>
                          <label style={{ cursor: 'pointer' }}>
                            <input
                              type="checkbox" checked={settings[key]} onChange={() => toggle(key)}
                              style={{ width: 16, height: 16, cursor: 'pointer' }}
                            />
                          </label>
                        </div>
                      )
                    ))}
                    <button className="btn btn-primary w-full" style={{ marginTop: 16 }} onClick={saveSettings} disabled={saving}>
                      {saving ? 'Saving…' : 'Save Preferences'}
                    </button>
                  </>
                )}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  )
}
