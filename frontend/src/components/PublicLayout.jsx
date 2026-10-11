import { useEffect, useState } from 'react'
import { Link, Navigate, NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom'
import { homeFor, useAuth } from '../context/AuthContext'

export default function PublicLayout() {
  const { user, logout } = useAuth()

  // Jika admin atau pemilik login, langsung alihkan ke panel admin
  if (user?.role === 'admin' || user?.role === 'pemilik') {
    return <Navigate to="/panel/dashboard" replace />
  }

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [activeNav, setActiveNav] = useState('beranda')
  const location = useLocation()
  const navigate = useNavigate()

  // Track active section automatically during smooth scroll
  useEffect(() => {
    if (location.pathname === '/konsultasi') {
      setActiveNav('konsultasi')
      return
    }
    if (location.pathname !== '/') {
      setActiveNav('')
      return
    }

    const handleScroll = () => {
      const scrollPos = window.scrollY + 160
      const produkEl = document.getElementById('produk')
      const tentangEl = document.getElementById('tentang')

      if (tentangEl && scrollPos >= tentangEl.offsetTop) {
        setActiveNav('tentang')
      } else if (produkEl && scrollPos >= produkEl.offsetTop) {
        setActiveNav('produk')
      } else {
        setActiveNav('beranda')
      }
    }

    handleScroll()
    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [location.pathname])

  const goToSection = (sectionId) => {
    setMobileMenuOpen(false)
    if (!sectionId) {
      setActiveNav('beranda')
      if (location.pathname === '/') {
        window.scrollTo({ top: 0, behavior: 'smooth' })
        if (window.location.hash) {
          window.history.pushState(null, '', '/')
        }
      } else {
        navigate('/')
        setTimeout(() => {
          window.scrollTo({ top: 0, behavior: 'smooth' })
        }, 50)
      }
      return
    }

    setActiveNav(sectionId)
    if (location.pathname === '/') {
      const el = document.getElementById(sectionId)
      if (el) {
        el.scrollIntoView({ behavior: 'smooth' })
        window.history.pushState(null, '', `#${sectionId}`)
      }
    } else {
      navigate(`/#${sectionId}`)
    }
  }

  const navButtonClass = (id) => {
    const isActive = activeNav === id
    return `text-sm transition-all duration-200 cursor-pointer active:scale-95 select-none ${
      isActive
        ? 'text-white font-semibold'
        : 'text-slate-300 hover:text-white'
    }`
  }

  return (
    <div className="flex min-h-screen flex-col bg-[#f6f8fb] antialiased text-slate-800">
      {/* Navbar matching exact mockup */}
      <header className="bg-[#0c1929] text-white sticky top-0 z-50 shadow-md">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4 sm:px-8">
          {/* Brand */}
          <button
            type="button"
            onClick={() => goToSection(null)}
            className="text-xl font-extrabold tracking-wider text-white hover:opacity-90 active:scale-95 transition-all duration-200 cursor-pointer"
          >
            TAMA FARM
          </button>

          {/* Desktop Nav Items */}
          <nav className="hidden md:flex items-center gap-8 text-sm font-medium">
            <button
              type="button"
              onClick={() => goToSection(null)}
              className={navButtonClass('beranda')}
            >
              Beranda
            </button>
            <button
              type="button"
              onClick={() => goToSection('produk')}
              className={navButtonClass('produk')}
            >
              Produk
            </button>
            <button
              type="button"
              onClick={() => goToSection('tentang')}
              className={navButtonClass('tentang')}
            >
              Tentang Kami
            </button>
            <Link
              to="/konsultasi"
              className={navButtonClass('konsultasi')}
            >
              Konsultasi
            </Link>
          </nav>

          {/* Right Action: Keranjang then Login (on the right of Keranjang) */}
          <div className="hidden md:flex items-center gap-3">
            <Link
              to="/pesanan"
              className="inline-flex items-center gap-2 justify-center rounded-lg bg-[#dc4c3e] hover:bg-[#c93f31] active:bg-[#b83325] active:scale-95 px-4 py-2 text-sm font-semibold text-white transition-all duration-200 shadow-xs hover:shadow-md cursor-pointer"
            >
              <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="9" cy="21" r="1" />
                <circle cx="20" cy="21" r="1" />
                <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6" />
              </svg>
              Keranjang
            </Link>

            {/* Login on the right of Keranjang */}
            {!user ? (
              <Link
                to="/login"
                className="inline-flex items-center gap-1.5 justify-center rounded-lg border border-slate-600 bg-[#142436] hover:bg-slate-700 hover:border-slate-400 active:bg-slate-800 active:scale-95 px-4 py-2 text-sm font-semibold text-white transition-all duration-200 shadow-xs hover:shadow-md cursor-pointer"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4" />
                  <polyline points="10 17 15 12 10 7" />
                  <line x1="15" y1="12" x2="3" y2="12" />
                </svg>
                Login
              </Link>
            ) : (
              <div className="flex items-center gap-2">
                <span className="text-xs text-slate-300">
                  Hi, <span className="font-semibold text-white">{user.nama}</span>
                </span>
                <button
                  onClick={logout}
                  className="rounded-lg border border-slate-700/80 px-2.5 py-1.5 text-xs font-semibold text-slate-300 hover:text-red-400 hover:bg-slate-800 active:scale-95 transition-all duration-200 cursor-pointer"
                  title="Keluar dari akun"
                >
                  Keluar
                </button>
              </div>
            )}
          </div>

          {/* Mobile actions */}
          <div className="flex md:hidden items-center gap-2">
            <Link
              to="/pesanan"
              className="rounded-lg bg-[#dc4c3e] px-3 py-1.5 text-xs font-semibold text-white active:scale-95 transition-all"
            >
              Keranjang
            </Link>
            {!user ? (
              <Link
                to="/login"
                className="rounded-lg border border-slate-600 bg-[#142436] px-3 py-1.5 text-xs font-semibold text-white hover:bg-slate-700 active:scale-95 transition-all"
              >
                Login
              </Link>
            ) : (
              <button
                onClick={logout}
                className="rounded-lg border border-slate-700 px-2.5 py-1.5 text-xs text-slate-300 hover:text-red-400 active:scale-95 transition-all"
              >
                Keluar
              </button>
            )}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="rounded-lg p-2 text-slate-300 hover:bg-[#182638] hover:text-white active:scale-95 transition-all"
              aria-label="Toggle Menu"
            >
              <svg width="22" height="22" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <path d="M3 5h14M3 10h14M3 15h14" />
              </svg>
            </button>
          </div>
        </div>

        {/* Mobile dropdown */}
        {mobileMenuOpen && (
          <div className="md:hidden border-t border-slate-800 bg-[#0c1929] px-6 py-4 space-y-2">
            <button
              type="button"
              onClick={() => goToSection(null)}
              className="block w-full text-left px-3 py-2 rounded-lg text-sm font-medium text-slate-200 hover:text-white hover:bg-white/10 active:scale-95 transition-all"
            >
              Beranda
            </button>
            <button
              type="button"
              onClick={() => goToSection('produk')}
              className="block w-full text-left px-3 py-2 rounded-lg text-sm font-medium text-slate-200 hover:text-white hover:bg-white/10 active:scale-95 transition-all"
            >
              Produk
            </button>
            <button
              type="button"
              onClick={() => goToSection('tentang')}
              className="block w-full text-left px-3 py-2 rounded-lg text-sm font-medium text-slate-200 hover:text-white hover:bg-white/10 active:scale-95 transition-all"
            >
              Tentang Kami
            </button>
            <Link
              to="/konsultasi"
              onClick={() => setMobileMenuOpen(false)}
              className="block w-full text-left px-3 py-2 rounded-lg text-sm font-medium text-slate-200 hover:text-white hover:bg-white/10 active:scale-95 transition-all"
            >
              Konsultasi
            </Link>
            {user ? (
              <div className="pt-2 border-t border-slate-800 flex justify-between items-center text-xs">
                <span className="text-slate-400">{user.nama}</span>
                <button onClick={logout} className="text-[#f87171] font-semibold cursor-pointer">Keluar</button>
              </div>
            ) : (
              <div className="pt-2 border-t border-slate-800">
                <Link
                  to="/login"
                  onClick={() => setMobileMenuOpen(false)}
                  className="block text-sm font-semibold text-slate-200 hover:text-white"
                >
                  Login
                </Link>
              </div>
            )}
          </div>
        )}
      </header>

      {/* Main Content */}
      <main className="flex-1">
        <Outlet />
      </main>

      {/* Simple Footer */}
      <footer className="border-t border-slate-200/80 bg-white mt-16">
        <div className="mx-auto max-w-6xl px-6 py-8 flex flex-col sm:flex-row items-center justify-center text-center text-xs text-slate-500">
          <p>© {new Date().getFullYear()} TAMA FARM. Budidaya & Penjualan Lobster Air Tawar Berkualitas.</p>
        </div>
      </footer>
    </div>
  )
}
