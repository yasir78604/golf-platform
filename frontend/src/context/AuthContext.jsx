import { useCallback, useState, useEffect } from "react"
import api from "../services/api"
import { AuthContext } from './auth-context'

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const getMe = async () => {
      try {
        const { data } = await api.get('/api/auth/me')

        if (data?.user) {
          setUser(data.user)
        } else {
          setUser(null)
        }
      } catch (err) {
        console.log("AUTH FAILED", err.response?.data)
        setUser(null)
      } finally {
        setLoading(false)
      }
    }

    getMe()
  }, [])

  const login = async (email, password) => {
    const { data } = await api.post('/api/auth/login', {
      email,
      password
    })

    if (data.token) {
      localStorage.setItem('token', data.token)
    }

    setUser(data.user)
    return data.user
  }

  const register = async (
    email,
    password,
    name,
    charity_id,
    charity_percentage = 10
  ) => {
    const { data } = await api.post('/api/auth/register', {
      email,
      password,
      name,
      charity_id,
      charity_percentage
    })

    if (data.token) {
      localStorage.setItem('token', data.token)
    }

    setUser(data.user)
    return data.user
  }

  const logout = async () => {
    try {
      await api.post('/api/auth/logout')
    } catch (err) {}

    localStorage.removeItem('token')
    setUser(null)
  }

  const refreshUser = useCallback(async () => {
    try {
      const { data } = await api.get('/api/auth/me')

      if (data?.user) {
        setUser(data.user)
        return data.user
      }

      return null
    } catch (err) {
      return null
    }
  }, [])

  const updateProfile = async (updates) => {
    const { data } = await api.patch('/api/auth/me', updates)
    setUser(data.user)
    return data.user
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        setUser,
        loading,
        login,
        register,
        logout,
        refreshUser,
        updateProfile
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}