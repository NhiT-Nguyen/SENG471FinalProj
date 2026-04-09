import React, { createContext, useContext, useState, useEffect, useCallback } from 'react'
import { authApi } from '../api/client'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser]       = useState(null)   // raw profile object
  const [profile, setProfile] = useState(null)   // full profile from my_profile
  const [loading, setLoading] = useState(true)
  const [token, setToken]     = useState(() => localStorage.getItem('authToken'))

  const loadProfile = useCallback(async () => {
    try {
      const p = await authApi.myProfile()
      setProfile(p)
      // Support both flat (user_username) and nested (user.username) forms
      const username = p.user_username || p.user?.username
      const userId = p.user?.id || p.user
      setUser({ username, role: p.role, userId })
    } catch {
      localStorage.removeItem('authToken')
      setToken(null)
      setProfile(null)
      setUser(null)
    }
  }, [])

  useEffect(() => {
    if (token) {
      loadProfile().finally(() => setLoading(false))
    } else {
      setLoading(false)
    }
  }, [token, loadProfile])

  const login = async (uname, password) => {
    const res = await authApi.login({ username: uname, password })
    localStorage.setItem('authToken', res.token)
    setToken(res.token)
    const p = await authApi.myProfile()
    setProfile(p)
    const u = p.user_username || p.user?.username
    const userId = p.user?.id || p.user
    setUser({ username: u, role: p.role, userId })
    return p
  }

  const logout = () => {
    localStorage.removeItem('authToken')
    setToken(null)
    setProfile(null)
    setUser(null)
  }

  const refreshProfile = () => loadProfile()

  const role = profile?.role || null
  const isProvider = role === 'healthcare_provider'
  const isPatient  = role === 'patient'
  const isCaregiver = role === 'caregiver'
  const isFamilyMember = role === 'family_member'

  return (
    <AuthContext.Provider value={{
      user, profile, token, loading,
      role, isProvider, isPatient, isCaregiver, isFamilyMember,
      login, logout, refreshProfile
    }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  return useContext(AuthContext)
}
