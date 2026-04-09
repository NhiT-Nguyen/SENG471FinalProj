import React from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import { ToastProvider } from './hooks/useToast'
import Layout from './components/Layout/Layout'
import LoginPage from './pages/LoginPage'
import RegisterPage from './pages/RegisterPage'
import Dashboard from './pages/Dashboard'
import AppointmentsPage from './pages/AppointmentsPage'
import ProvidersPage from './pages/ProvidersPage'
import AvailabilityPage from './pages/AvailabilityPage'
import MedicationsPage from './pages/MedicationsPage'
import MessagesPage from './pages/MessagesPage'
import NotificationsPage from './pages/NotificationsPage'
import MedicalHistoryPage from './pages/MedicalHistoryPage'
import FamilyPage from './pages/FamilyPage'
import ProfilePage from './pages/ProfilePage'
import SimulatorPage from './pages/SimulatorPage'

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <ToastProvider>
          <Routes>
            {/* Public routes */}
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />

            {/* Protected routes inside main layout */}
            <Route element={<Layout />}>
              <Route path="/" element={<Dashboard />} />
              <Route path="/appointments" element={<AppointmentsPage />} />
              <Route path="/providers" element={<ProvidersPage />} />
              <Route path="/availability" element={<AvailabilityPage />} />
              <Route path="/medications" element={<MedicationsPage />} />
              <Route path="/messages" element={<MessagesPage />} />
              <Route path="/notifications" element={<NotificationsPage />} />
              <Route path="/medical-history" element={<MedicalHistoryPage />} />
              <Route path="/family" element={<FamilyPage />} />
              <Route path="/profile" element={<ProfilePage />} />
              <Route path="/simulator" element={<SimulatorPage />} />
            </Route>

            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </ToastProvider>
      </AuthProvider>
    </BrowserRouter>
  )
}
