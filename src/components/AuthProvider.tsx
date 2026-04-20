'use client'
import { createContext, useContext, useEffect, useState, ReactNode } from 'react'
import axios from 'axios'
import { IUser } from '@/types'

interface AuthContextType {
  user: IUser | null
  token: string | null
  loading: boolean
  login: (email: string, password: string) => Promise<void>
  register: (username: string, email: string, password: string, role: string) => Promise<void>
  logout: () => void
  refreshUser: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<IUser | null>(null)
  const [token, setToken] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const stored = localStorage.getItem('token')
    if (stored) {
      setToken(stored)
      axios.defaults.headers.common['Authorization'] = `Bearer ${stored}`
      fetchUser(stored)
    } else {
      setLoading(false)
    }
  }, [])

  async function fetchUser(t: string) {
    try {
      const res = await axios.get('/api/auth/me', {
        headers: { 
          Authorization: `Bearer ${t}`,
          'Content-Type': 'application/json'
        },
        timeout: 8000 // Increased timeout for slower connections
      })
      if (res.data.success && res.data.data) {
        setUser(res.data.data.user)
      } else {
        throw new Error('Identity verification failed')
      }
    } catch (error: any) {
      console.error('Auth error:', error)
      // Only logout on authentication errors, not on network/server errors
      if (error.response?.status === 401) {
        localStorage.removeItem('token')
        setToken(null)
        setUser(null)
      } else if (error.code === 'ECONNABORTED' || error.response?.status >= 500) {
        // For timeout or server errors, keep user logged in and retry after delay
        console.warn('Network/server error, keeping user session')
        // Don't set loading to false yet, will retry
        setTimeout(() => {
          if (token) fetchUser(token)
        }, 3000)
        return
      } else {
        // For other errors, keep user logged in but stop loading
        console.warn('Other error, keeping user session')
      }
    } finally {
      setLoading(false)
    }
  }

  async function login(email: string, password: string) {
    const res = await axios.post('/api/auth/login', { email, password })
    if (res.data.success && res.data.data) {
      const { token: t, user: u } = res.data.data
      localStorage.setItem('token', t)
      axios.defaults.headers.common['Authorization'] = `Bearer ${t}`
      setToken(t)
      setUser(u)
    } else {
       throw new Error(res.data.error || 'Authentication failure')
    }
  }

  async function register(username: string, email: string, password: string, role: string) {
    const res = await axios.post('/api/auth/register', { username, email, password, role })
    if (res.data.success && res.data.data) {
      const { token: t, user: u } = res.data.data
      localStorage.setItem('token', t)
      axios.defaults.headers.common['Authorization'] = `Bearer ${t}`
      setToken(t)
      setUser(u)
    } else {
       throw new Error(res.data.error || 'Identity initialization failure')
    }
  }

  function logout() {
    localStorage.removeItem('token')
    delete axios.defaults.headers.common['Authorization']
    setToken(null)
    setUser(null)
  }

  async function refreshUser() {
    if (token) await fetchUser(token)
  }

  // Add automatic token refresh every 6 days (before 7-day expiration)
  useEffect(() => {
    if (!token) return

    const refreshInterval = setInterval(async () => {
      try {
        await refreshUser()
      } catch (error) {
        console.error('Token refresh failed:', error)
      }
    }, 12 * 60 * 60 * 1000) // 12 hours in milliseconds instead of 6 days

    return () => clearInterval(refreshInterval)
  }, [token])

  return (
    <AuthContext.Provider value={{ user, token, loading, login, register, logout, refreshUser }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
