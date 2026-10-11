import { useState } from 'react'
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom'
import { homeFor, useAuth } from '../context/AuthContext'

export default function Login({ defaultRegister = false }) {
  const { user, login, register } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()

  const [isRegister, setIsRegister] = useState(defaultRegister || location.pathname === '/register')
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [nama, setNama] = useState('')
  const [noHp, setNoHp] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  if (user) return <Navigate to={homeFor(user)} replace />

  const isFromConsultation = location.state?.from === '/konsultasi'

  async function handleLogin(e) {
    e.preventDefault()
    setBusy(true)
    setError('')
    try {
      const u = await login(username, password)
      const destination = u.role === 'admin' || u.role === 'pemilik'
        ? '/panel/dashboard'
        : (location.state?.from || homeFor(u))
      navigate(destination, { replace: true })
    } catch (err) {
      setError(err.message || 'Username atau password salah.')
    } finally {
      setBusy(false)
    }
  }

  async function handleRegister(e) {
    e.preventDefault()
    if (password !== confirmPassword) {
      setError('Konfirmasi password tidak cocok.')
      return
    }
    if (password.length < 6) {
      setError('Password minimal harus 6 karakter.')
      return
    }
    setBusy(true)
    setError('')
    try {
      const u = await register(nama, username, password, noHp)
      navigate(location.state?.from || homeFor(u), { replace: true })
    } catch (err) {
      setError(err.message || 'Gagal mendaftarkan akun. Silakan periksa kembali data Anda.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="min-h-screen grid grid-cols-1 lg:grid-cols-12 bg-white antialiased">
      {/* Left Column: Brand & Hero Graphic (Matching Figma Frame 1) */}
      <div className="hidden lg:flex lg:col-span-6 xl:col-span-7 bg-[#0c1929] text-white p-12 lg:p-16 flex-col justify-between relative overflow-hidden">
        <div>
          <Link to="/" className="text-2xl font-extrabold tracking-wider text-white">
            TAMA FARM
          </Link>
          <div className="mt-16 max-w-lg">
            <span className="text-xs font-semibold tracking-wider text-[#dc4c3e] uppercase">
              Sistem Informasi Manajemen
            </span>
            <h2 className="mt-3 text-3xl xl:text-4xl font-extrabold leading-tight tracking-tight text-white">
              Budidaya dan Penjualan Lobster Berbasis Web
            </h2>
            <p className="mt-4 text-sm sm:text-base text-slate-300 leading-relaxed">
              Platform terintegrasi untuk pengelolaan data produk lobster, monitoring stok budidaya, pelayanan konsultasi, hingga pemrosesan pesanan dan transaksi online.
            </p>
          </div>
        </div>

        {/* Tambak / Lobster Graphic Card */}
        <div className="rounded-2xl bg-[#14283c] h-64 w-full max-w-lg flex items-center justify-center border border-slate-700/60 shadow-inner my-8">
          <div className="text-center px-6">
            <span className="text-4xl block mb-2">🦞</span>
            <span className="text-xs font-bold tracking-wider text-slate-300 uppercase">
              TAMA FARM · PUSAT BUDIDAYA LOBSTER AIR TAWAR
            </span>
            <p className="text-xs text-slate-400 mt-1">Surabaya, Jawa Timur</p>
          </div>
        </div>

        <div className="text-xs text-slate-500">
          © {new Date().getFullYear()} TAMA FARM. Hak Cipta Dilindungi.
        </div>
      </div>

      {/* Right Column: Form (Login or Register) */}
      <div className="col-span-1 lg:col-span-6 xl:col-span-5 flex items-center justify-center p-6 sm:p-12 bg-[#f6f8fb] lg:bg-white">
        <div className="w-full max-w-md bg-white p-8 sm:p-10 rounded-2xl shadow-sm lg:shadow-none border border-slate-100 lg:border-none">
          <div className="lg:hidden mb-6">
            <Link to="/" className="text-xl font-extrabold tracking-wider text-slate-900">
              TAMA FARM
            </Link>
          </div>

          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900">
            {isRegister ? 'Daftar Akun Baru' : 'Masuk ke Akun'}
          </h1>
          <p className="mt-1 text-sm text-slate-500 font-normal">
            {isRegister
              ? 'Lengkapi data berikut untuk membuat akun pelanggan Tama Farm.'
              : 'Silakan masukkan username dan password untuk mengakses akun Anda.'}
          </p>

          {/* Banner notifikasi jika diarahkan dari fitur Konsultasi */}
          {isFromConsultation && (
            <div className="mt-5 rounded-xl border border-amber-200 bg-amber-50 p-3.5 text-xs text-amber-800 flex items-start gap-2">
              <span className="text-base leading-none">💬</span>
              <span>
                <strong>Login Diperlukan:</strong> Silakan masuk atau daftar akun baru terlebih dahulu untuk melanjutkan sesi konsultasi dengan admin.
              </span>
            </div>
          )}

          {error && (
            <div className="mt-4 rounded-xl border border-red-200 bg-red-50 p-3.5 text-xs font-medium text-red-600">
              {error}
            </div>
          )}

          {!isRegister ? (
            /* Form Login */
            <form onSubmit={handleLogin} className="mt-6 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Username</label>
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Masukkan username"
                  required
                  autoFocus
                  className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm focus:border-slate-800 focus:outline-none focus:ring-1 focus:ring-slate-800"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Password</label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Masukkan password"
                  required
                  className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm focus:border-slate-800 focus:outline-none focus:ring-1 focus:ring-slate-800"
                />
              </div>

              <button
                type="submit"
                disabled={busy}
                className="mt-6 w-full rounded-xl bg-[#dc4c3e] hover:bg-[#c93f31] active:scale-95 py-3 text-sm font-semibold text-white shadow-xs transition-all duration-200 disabled:opacity-50 cursor-pointer"
              >
                {busy ? 'Memproses...' : 'Masuk'}
              </button>

              <div className="mt-6 text-center text-xs text-slate-600">
                Belum punya akun?{' '}
                <button
                  type="button"
                  onClick={() => {
                    setIsRegister(true)
                    setError('')
                  }}
                  className="font-semibold text-[#dc4c3e] hover:underline cursor-pointer"
                >
                  Daftar Sekarang
                </button>
              </div>
            </form>
          ) : (
            /* Form Register */
            <form onSubmit={handleRegister} className="mt-6 space-y-3.5">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Nama Lengkap</label>
                <input
                  type="text"
                  value={nama}
                  onChange={(e) => setNama(e.target.value)}
                  placeholder="Contoh: Budi Santoso"
                  required
                  autoFocus
                  className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm focus:border-slate-800 focus:outline-none focus:ring-1 focus:ring-slate-800"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">No. WhatsApp / HP</label>
                <input
                  type="tel"
                  value={noHp}
                  onChange={(e) => setNoHp(e.target.value)}
                  placeholder="Contoh: 081234567890"
                  required
                  className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm focus:border-slate-800 focus:outline-none focus:ring-1 focus:ring-slate-800"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Username</label>
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Pilih username unik"
                  required
                  className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm focus:border-slate-800 focus:outline-none focus:ring-1 focus:ring-slate-800"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Password</label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Minimal 6 karakter"
                  required
                  className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm focus:border-slate-800 focus:outline-none focus:ring-1 focus:ring-slate-800"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Konfirmasi Password</label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Ulangi password di atas"
                  required
                  className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm focus:border-slate-800 focus:outline-none focus:ring-1 focus:ring-slate-800"
                />
              </div>

              <button
                type="submit"
                disabled={busy}
                className="mt-5 w-full rounded-xl bg-[#dc4c3e] hover:bg-[#c93f31] active:scale-95 py-3 text-sm font-semibold text-white shadow-xs transition-all duration-200 disabled:opacity-50 cursor-pointer"
              >
                {busy ? 'Mendaftarkan...' : 'Daftar Sekarang'}
              </button>

              <div className="mt-6 text-center text-xs text-slate-600">
                Sudah punya akun?{' '}
                <button
                  type="button"
                  onClick={() => {
                    setIsRegister(false)
                    setError('')
                  }}
                  className="font-semibold text-[#dc4c3e] hover:underline cursor-pointer"
                >
                  Masuk di sini
                </button>
              </div>
            </form>
          )}

          <div className="mt-6 pt-6 border-t border-slate-100 text-center">
            <Link to="/" className="text-xs font-medium text-slate-500 hover:text-slate-800 transition-colors">
              ← Kembali ke Beranda Website
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
