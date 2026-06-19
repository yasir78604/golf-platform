import { createContext, useCallback, useContext, useState, useEffect } from "react"
import api from "../services/api"

const AuthContext = createContext()

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const getMe = async () => {
      try {
        const { data } = await api.get('/api/auth/me')
        setUser(data.user)
      } catch {
        setUser(null)
      } finally {
        setLoading(false)
      }
    }
    getMe()
  }, [])

  const login = async (email, password) => {
    const { data } = await api.post('/api/auth/login', { 
      email, password 
    })
    setUser(data.user)
    return data.user
  }

  const register = async (email, password, name) => {
    const { data } = await api.post('/api/auth/register', { 
      email, password, name 
    })
    setUser(data.user)
    return data.user
  }

  const logout = async () => {
    await api.post('/api/auth/logout')
    setUser(null)
  }

  const refreshUser = useCallback(async () => {
    try {
      const { data } = await api.get('/api/auth/me')
      setUser(data.user)
      return data.user
    } catch {
      setUser(null)
      return null
    }
  }, [])

  return (
    <AuthContext.Provider value={{ 
      user, setUser, loading, login, register, logout, refreshUser 
    }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)