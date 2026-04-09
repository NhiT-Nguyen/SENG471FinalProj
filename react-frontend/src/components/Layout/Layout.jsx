import React, { useState, useEffect } from 'react'
import { Outlet, useNavigate } from 'react-router-dom'
import Sidebar from './Sidebar'
import TopBar from './TopBar'
import { useAuth } from '../../context/AuthContext'

export default function Layout() {
  const { loading, token } = useAuth()
  const navigate = useNavigate()
  const [sidebarOpen, setSidebarOpen] = useState(false)

  useEffect(() => {
    if (!loading && !token) navigate('/login')
  }, [loading, token, navigate])

  // Close sidebar on route change
  useEffect(() => {
    setSidebarOpen(false)
  }, [location.pathname])

  if (loading) return (
    <div style={{ display: 'flex', height: '100vh', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 12 }}>
      <div className="spinner" style={{ width: 32, height: 32 }} />
      <span style={{ fontSize: 13, color: 'var(--gray-400)' }}>Loading…</span>
    </div>
  )

  if (!token) return null

  return (
    <div style={{ display: 'flex', height: '100vh', overflow: 'hidden', background: 'var(--gray-50)' }}>

      {/* Mobile backdrop */}
      {sidebarOpen && (
        <div
          onClick={() => setSidebarOpen(false)}
          style={{
            position: 'fixed', inset: 0,
            background: 'rgba(10,15,26,.4)',
            backdropFilter: 'blur(2px)',
            zIndex: 90,
          }}
        />
      )}

      {/* Desktop sidebar */}
      <div className="sidebar-desktop" style={{ flexShrink: 0 }}>
        <Sidebar />
      </div>

      {/* Mobile sidebar — slides in */}
      <div
        className="sidebar-mobile"
        style={{
          position: 'fixed', top: 0, bottom: 0, left: 0,
          zIndex: 100,
          transform: sidebarOpen ? 'translateX(0)' : 'translateX(-100%)',
          transition: 'transform .22s cubic-bezier(.4,0,.2,1)',
        }}
      >
        <Sidebar onClose={() => setSidebarOpen(false)} />
      </div>

      {/* Content */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', minWidth: 0 }}>
        <TopBar onMenuClick={() => setSidebarOpen(true)} />
        <main style={{
          flex: 1,
          overflowY: 'auto',
          padding: '28px 28px',
          background: 'var(--gray-50)',
        }}>
          <Outlet />
        </main>
      </div>

      <style>{`
        @media (min-width: 768px) {
          .sidebar-mobile { display: none !important; }
          .sidebar-desktop { display: block; }
        }
        @media (max-width: 767px) {
          .sidebar-desktop { display: none; }
          .sidebar-mobile { display: block; }
        }
      `}</style>
    </div>
  )
}
