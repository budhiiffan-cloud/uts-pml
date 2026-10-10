import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import { api, getToken, setToken } from '../lib/api'

const AuthContext = createContext(null)

// Halaman awal panel sesuai role (pemilik hanya mengelola akun admin).
export const homeFor = (user) => {
  if (user?.role === 'pemilik') return '/panel/akun'
  if (user?.role === 'admin') return '/panel/produk'
  if (user?.role === 'pelanggan') return '/pesanan'
  return '/'
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(!!getToken())

  useEffect(() => {
    if (!getToken()) return
    api
      .get('/me')
      .then((r) => setUser(r.data))
      .catch(() => setToken(null))
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => {
    const onExpired = () => setUser(null)
    window.addEventListener('auth:expired', onExpired)
    return () => window.removeEventListener('auth:expired', onExpired)
  }, [])

  const login = useCallback(async (username, password) => {
    const r = await api.post('/login', { username, password })
    setToken(r.data.token)
    setUser(r.data.user)
    return r.data.user
  }, [])

  const logout = useCallback(async () => {
    try {
      await api.post('/logout')
    } catch {
      /* token mungkin sudah tidak berlaku */
    }
    setToken(null)
    setUser(null)
  }, [])

  const value = useMemo(() => ({ user, loading, login, logout }), [user, loading, login, logout])
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export const useAuth = () => useContext(AuthContext)
