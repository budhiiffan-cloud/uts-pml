import { useState } from 'react'
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom'
import { Button, TextField } from '../components/ui'
import { homeFor, useAuth } from '../context/AuthContext'

export default function Login() {
  const { user, login } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  if (user) return <Navigate to={homeFor(user)} replace />

  async function submit(e) {
    e.preventDefault()
    setBusy(true)
    setError('')
    try {
      const u = await login(username, password)
      navigate(location.state?.from || homeFor(u), { replace: true })
    } catch (err) {
      setError(err.message)
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <form onSubmit={submit} className="w-full max-w-sm rounded-lg border border-mist bg-white p-7">
        <Link to="/" className="font-display text-2xl font-extrabold tracking-tight">
          Tama<span className="text-shell">farm</span>
        </Link>
        <h1 className="mt-4 font-display text-2xl font-bold">Masuk ke akun</h1>
        <div className="mt-6 space-y-4">
          <TextField label="Username" value={username} onChange={(e) => setUsername(e.target.value)} autoComplete="username" autoFocus required />
          <TextField label="Password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} autoComplete="current-password" required />
        </div>
        {error && <p className="mt-4 text-sm font-medium text-shell-dark" role="alert">{error}</p>}
        <Button type="submit" disabled={busy} className="mt-6 w-full">
          {busy ? 'Memproses...' : 'Masuk'}
        </Button>
      </form>
    </div>
  )
}
