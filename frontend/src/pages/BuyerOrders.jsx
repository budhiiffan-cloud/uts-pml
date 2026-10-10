import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Button, Empty, ErrorNote, Spinner, TextField } from '../components/ui'
import { useAuth } from '../context/AuthContext'
import { useFetch } from '../lib/useFetch'
import { guestOrders, rememberOrder, statusLabel } from '../lib/orders'
import { rupiah } from '../lib/format'

export default function BuyerOrders() {
  const { user, loading: authLoading } = useAuth()
  const [page, setPage] = useState(1)
  const { data, loading, error, reload } = useFetch(user?.role === 'pelanggan' ? `/pembeli/pesanan?page=${page}` : null)
  const [code, setCode] = useState('')
  const [token, setToken] = useState('')
  const navigate = useNavigate()
  const guests = guestOrders()

  function track(event) {
    event.preventDefault()
    const normalized = code.trim().toUpperCase()
    if (token.trim()) rememberOrder(normalized, token.trim())
    navigate(`/pesanan/${encodeURIComponent(normalized)}`)
  }

  return (
    <div className="mx-auto max-w-5xl px-4 py-10">
      <h1 className="font-display text-3xl font-bold">Pesanan saya</h1>
      <p className="mt-2 text-tank/70">Pantau penawaran, pembayaran, dan pengiriman.</p>
      {authLoading || (user?.role === 'pelanggan' && loading) ? <Spinner /> : error ? <ErrorNote message={error} onRetry={reload} /> : user?.role === 'pelanggan' ? (
        <div className="mt-6 space-y-3">
          {data?.data?.length ? data.data.map((order) => (
            <Link key={order.kode_pesanan} to={`/pesanan/${order.kode_pesanan}`} className="flex flex-wrap justify-between gap-3 rounded-md border border-mist bg-white p-5">
              <div><p className="font-bold">{order.kode_pesanan}</p><p className="mt-1 text-sm capitalize">{statusLabel(order.status_pesanan)}</p></div>
              <p className="font-bold">{rupiah(order.total)}</p>
            </Link>
          )) : <Empty title="Belum ada pesanan"><Link to="/#katalog" className="underline">Pilih produk dari katalog</Link></Empty>}
          {data?.last_page > 1 && <div className="flex gap-3"><Button disabled={page === 1} onClick={() => setPage(page - 1)}>Sebelumnya</Button><span>Halaman {page}</span><Button disabled={page === data.last_page} onClick={() => setPage(page + 1)}>Berikutnya</Button></div>}
        </div>
      ) : (
        <div className="mt-6 space-y-3">
          <p className="text-sm text-tank/70">Pesanan tamu tersimpan pada browser ini. Simpan kode dan token akses untuk membukanya di perangkat lain.</p>
          {guests.length ? guests.map((order) => <Link key={order.code} className="block rounded-md border border-mist bg-white p-4 font-semibold" to={`/pesanan/${order.code}`}>{order.code} →</Link>) : <Empty title="Belum ada pesanan di browser ini" />}
        </div>
      )}
      <form onSubmit={track} className="mt-10 max-w-lg space-y-4 rounded-lg border border-mist p-5">
        <h2 className="font-display text-xl font-bold">Buka pesanan dengan kode</h2>
        <TextField label="Kode pesanan" value={code} onChange={(e) => setCode(e.target.value)} required maxLength={30} placeholder="TF-..." />
        <TextField label="Token akses pesanan tamu" value={token} onChange={(e) => setToken(e.target.value)} hint="Tidak perlu diisi untuk pesanan milik akun yang sedang login." maxLength={64} />
        <Button type="submit">Lihat pesanan</Button>
      </form>
    </div>
  )
}
