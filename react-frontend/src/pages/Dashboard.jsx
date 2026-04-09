import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { appointmentApi, medicationApi, messageApi, notificationApi } from '../api/client'

function StatCard({ title, value, sub, color, to }) {
  const content = (
    <div className="card" style={{ padding: '20px', borderTop: `3px solid ${color}` }}>
      <div style={{ fontSize: 28, fontWeight: 700, color }}>{value ?? '—'}</div>
      <div style={{ fontSize: 14, fontWeight: 600, marginTop: 4 }}>{title}</div>
      {sub && <div style={{ fontSize: 12, color: 'var(--gray-400)', marginTop: 2 }}>{sub}</div>}
    </div>
  )
  return to ? <Link to={to} style={{ textDecoration: 'none' }}>{content}</Link> : content
}

export default function Dashboard() {
  const { profile, isProvider, isPatient } = useAuth()
  const [stats, setStats] = useState({})
  const [recentAlerts, setRecentAlerts] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let alive = true
    const load = async () => {
      try {
        const [alerts, meds, msgs] = await Promise.allSettled([
          notificationApi.alerts(),
          medicationApi.current(),
          messageApi.unread(),
        ])

        let apptCount = 0
        let pendingCount = 0
        try {
          if (isProvider) {
            const pending = await appointmentApi.pendingRequests()
            pendingCount = Array.isArray(pending) ? pending.length : (pending.results?.length ?? 0)
          } else {
            const appts = await appointmentApi.list()
            apptCount = Array.isArray(appts) ? appts.length : (appts.results?.length ?? 0)
          }
        } catch {}

        if (!alive) return
        const alertList = alerts.value ? (Array.isArray(alerts.value) ? alerts.value : alerts.value.results || []) : []
        const medList   = meds.value  ? (Array.isArray(meds.value)  ? meds.value  : meds.value.results  || []) : []
        const msgList   = msgs.value  ? (Array.isArray(msgs.value)  ? msgs.value  : msgs.value.results  || []) : []

        setStats({
          appointments: isProvider ? pendingCount : apptCount,
          medications: medList.length,
          unreadMessages: msgList.length,
          unreadAlerts: alertList.filter(a => !a.is_read).length,
          pendingRequests: pendingCount,
        })
        setRecentAlerts(alertList.filter(a => !a.is_read).slice(0, 5))
      } catch (err) {
        console.error(err)
      } finally {
        if (alive) setLoading(false)
      }
    }
    load()
    return () => { alive = false }
  }, [isProvider])

  if (loading) return <div className="loading-center"><div className="spinner" /></div>

  return (
    <div>
      <div className="page-header">
        <h1>Welcome back, {profile?.user_first_name || profile?.user?.first_name || profile?.user_username || profile?.user?.username} 👋</h1>
        <p style={{ color: 'var(--gray-500)', fontSize: 14, marginTop: 4, textTransform: 'capitalize' }}>
          {profile?.role?.replace('_', ' ')} Dashboard
        </p>
      </div>

      {/* Stats grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(190px, 1fr))', gap: 16, marginBottom: 28 }}>
        <StatCard
          title={isProvider ? 'Pending Requests' : 'Appointments'}
          value={isProvider ? stats.pendingRequests : stats.appointments}
          sub={isProvider ? 'Need review' : 'Scheduled'}
          color="var(--primary)"
          to="/appointments"
        />
        <StatCard title="Active Medications" value={stats.medications} sub="Current prescriptions" color="var(--secondary)" to="/medications" />
        <StatCard title="Unread Messages" value={stats.unreadMessages} sub="In your inbox" color="var(--warning)" to="/messages" />
        <StatCard title="New Alerts" value={stats.unreadAlerts} sub="Unread notifications" color="var(--danger)" to="/notifications" />
      </div>

      {/* Two-col layout */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: 20 }}>
        {/* Recent Alerts */}
        <div className="card">
          <div className="card-header">
            <h3>Recent Alerts</h3>
            <Link to="/notifications" style={{ fontSize: 12, color: 'var(--primary)' }}>View all →</Link>
          </div>
          <div className="card-body" style={{ padding: 0 }}>
            {recentAlerts.length === 0 ? (
              <div className="empty-state" style={{ padding: 24 }}>
                <p>No unread alerts</p>
              </div>
            ) : recentAlerts.map(a => (
              <div key={a.id} style={{ padding: '12px 20px', borderBottom: '1px solid var(--gray-100)', fontSize: 13 }}>
                <div style={{ fontWeight: 500 }}>{a.message}</div>
                <div style={{ fontSize: 11, color: 'var(--gray-400)', marginTop: 3 }}>
                  {new Date(a.created_at).toLocaleString()}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Quick actions */}
        <div className="card">
          <div className="card-header"><h3>Quick Actions</h3></div>
          <div className="card-body" style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {!isProvider && (
              <Link to="/providers" className="btn btn-primary" style={{ justifyContent: 'center' }}>
                Find a Provider
              </Link>
            )}
            {isProvider && (
              <Link to="/appointments" className="btn btn-primary" style={{ justifyContent: 'center' }}>
                Review Appointment Requests
              </Link>
            )}
            {isProvider && (
              <Link to="/availability" className="btn btn-secondary" style={{ justifyContent: 'center' }}>
                Manage My Availability
              </Link>
            )}
            <Link to="/messages" className="btn btn-secondary" style={{ justifyContent: 'center' }}>
              Send a Message
            </Link>
            <Link to="/medical-history" className="btn btn-secondary" style={{ justifyContent: 'center' }}>
              View Medical History
            </Link>
            <Link to="/simulator" className="btn btn-secondary" style={{ justifyContent: 'center' }}>
              Data Simulator
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
