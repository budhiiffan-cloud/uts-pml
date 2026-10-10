import { useState } from 'react'
import { Link, NavLink, Outlet } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'

const brand = (
  <>
    Tama<span className="text-shell">farm</span>
  </>
)

export default function PanelLayout() {
  const { user, logout } = useAuth()
  const [open, setOpen] = useState(false)

  const links =
    user.role === 'pemilik'
      ? [['/panel/akun', 'Akun admin']]
      : [
          ['/panel/produk', 'Produk'],
          ['/panel/kategori', 'Kategori'],
          ['/panel/pesanan', 'Pesanan pembeli'],
          ['/panel/konsultasi', 'Konsultasi'],
        ]

  return (
    <div className="min-h-screen lg:flex">
      {/* Bilah atas khusus layar kecil */}
      <div className="flex items-center justify-between border-b border-mist bg-white px-4 py-3 lg:hidden">
        <Link to="/" className="font-display text-xl font-extrabold tracking-tight">{brand}</Link>
        <button
          onClick={() => setOpen(true)}
          aria-label="Buka menu"
          aria-expanded={open}
          className="rounded-md p-2 hover:bg-mist/60"
        >
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <path d="M3 5h14M3 10h14M3 15h14" />
          </svg>
        </button>
      </div>

      {open && <div className="fixed inset-0 z-30 bg-tank/60 lg:hidden" onClick={() => setOpen(false)} aria-hidden="true" />}

      <aside
        className={`fixed inset-y-0 left-0 z-40 flex w-64 flex-col bg-tank text-foam transition-transform lg:sticky lg:top-0 lg:h-screen lg:shrink-0 lg:translate-x-0 ${
          open ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex items-center justify-between px-5 py-5">
          <Link to="/" className="font-display text-2xl font-extrabold tracking-tight">{brand}</Link>
          <button onClick={() => setOpen(false)} aria-label="Tutup menu" className="rounded p-1 text-foam/70 hover:text-foam lg:hidden">
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <path d="M3 3l10 10M13 3L3 13" />
            </svg>
          </button>
        </div>

        <nav className="flex-1 space-y-1 px-3" aria-label="Menu panel">
          {links.map(([to, label]) => (
            <NavLink
              key={to}
              to={to}
              onClick={() => setOpen(false)}
              className={({ isActive }) =>
                `block rounded-md border-l-4 px-3 py-2 text-sm font-semibold ${
                  isActive ? 'border-shell bg-foam/10 text-white' : 'border-transparent text-foam/75 hover:bg-foam/5 hover:text-white'
                }`
              }
            >
              {label}
            </NavLink>
          ))}
        </nav>

        <div className="border-t border-foam/15 p-4 text-sm">
          <p className="font-semibold">{user.nama}</p>
          <p className="text-foam/65">{user.role === 'pemilik' ? 'Pemilik' : 'Admin'}</p>
          <Link to="/" className="mt-3 block text-foam/75 underline underline-offset-4 hover:text-white">
            Lihat situs
          </Link>
          <button
            onClick={logout}
            className="mt-3 w-full rounded-md border border-foam/30 px-3 py-2 font-semibold hover:bg-foam/10"
          >
            Keluar
          </button>
        </div>
      </aside>

      <main className="min-w-0 flex-1 px-4 py-8 lg:px-10">
        <div className="mx-auto max-w-5xl">
          <Outlet />
        </div>
      </main>
    </div>
  )
}

export function PageHeader({ title, action }) {
  return (
    <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
      <h1 className="font-display text-3xl font-bold">{title}</h1>
      {action}
    </div>
  )
}
