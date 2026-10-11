import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { api } from '../lib/api'
import { useFetch } from '../lib/useFetch'
import { rupiah, qty } from '../lib/format'
import { rememberOrder } from '../lib/orders'

export default function Checkout() {
  const { id } = useParams()
  const [searchParams] = useSearchParams()
  const initialQty = Math.max(1, Number(searchParams.get('qty') || 1))

  const { user } = useAuth()
  const { data: product, loading, error } = useFetch(`/produk/${id}`)
  const [form, setForm] = useState({
    nama: '',
    no_hp: '',
    alamat: '',
    negara: 'Indonesia',
    tipe_pembeli: 'perorangan',
    jumlah: String(initialQty),
    catatan: '',
  })
  const [busy, setBusy] = useState(false)
  const [message, setMessage] = useState('')
  const navigate = useNavigate()

  useEffect(() => {
    let off = false
    if (user?.role === 'pelanggan') {
      api
        .get('/pembeli/profil')
        .then((r) => {
          if (!off) {
            setForm((f) => ({
              ...f,
              nama: r.data.nama || '',
              no_hp: r.data.no_hp || '',
              alamat: r.data.alamat || '',
              negara: r.data.negara || 'Indonesia',
              tipe_pembeli: r.data.tipe_pembeli || 'perorangan',
            }))
          }
        })
        .catch(() => {})
    }
    return () => {
      off = true
    }
  }, [user])

  if (loading) {
    return <div className="mx-auto max-w-4xl px-4 py-16 text-center text-sm text-slate-500">Memuat data produk...</div>
  }

  if (error || !product) {
    return <div className="mx-auto max-w-4xl px-4 py-16 text-center text-red-500">{error || 'Produk tidak ditemukan.'}</div>
  }

  const change = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }))

  const subtotal = Number(product.harga) * Number(form.jumlah || 1)

  async function submit(e) {
    e.preventDefault()
    setBusy(true)
    setMessage('')
    try {
      const { jumlah, ...profile } = form
      const result = await api.post('/pesanan', {
        ...profile,
        items: [{ id_produk: Number(id), jumlah: Number(jumlah) }],
      })
      rememberOrder(result.data.kode_pesanan, result.data.token_akses)
      navigate(`/pesanan/${result.data.kode_pesanan}`)
    } catch (err) {
      setMessage(Object.values(err.errors || {}).flat().join(' ') || err.message)
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="mx-auto max-w-5xl px-4 sm:px-6 py-8 sm:py-12">
      {/* Breadcrumb */}
      <div className="mb-6 flex items-center gap-2 text-xs font-medium text-slate-400">
        <Link to="/" className="hover:text-slate-700">Beranda</Link>
        <span>/</span>
        <Link to={`/produk/${id}`} className="hover:text-slate-700">{product.nama_produk}</Link>
        <span>/</span>
        <span className="text-slate-800 font-semibold">Checkout Pesanan</span>
      </div>

      <div className="mb-8">
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
          Formulir Pemesanan
        </h1>
        <p className="mt-1 text-sm text-slate-500 font-normal">
          Lengkapi data penerima dan alamat pengiriman. Admin akan memeriksa stok dan mengirimkan penawaran transaksi.
        </p>
      </div>

      {message && (
        <div className="mb-6 rounded-xl border border-red-200 bg-red-50 p-4 text-xs font-semibold text-red-600">
          {message}
        </div>
      )}

      <form onSubmit={submit} className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left: Shipping Data Form */}
        <div className="lg:col-span-7 bg-white rounded-2xl border border-slate-100 p-6 sm:p-8 shadow-[0_2px_12px_rgba(0,0,0,0.02)] space-y-4">
          <h2 className="text-base font-bold text-slate-900 pb-2 border-b border-slate-100">
            Informasi Pembeli & Pengiriman
          </h2>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Nama Lengkap</label>
            <input
              type="text"
              value={form.nama}
              onChange={change('nama')}
              required
              placeholder="Contoh: Budi Santoso"
              className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm focus:border-slate-800 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Nomor WhatsApp / HP</label>
            <input
              type="tel"
              value={form.no_hp}
              onChange={change('no_hp')}
              required
              placeholder="Contoh: 081234567890"
              className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm focus:border-slate-800 focus:outline-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Tipe Pembeli</label>
              <select
                value={form.tipe_pembeli}
                onChange={change('tipe_pembeli')}
                className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm focus:border-slate-800 focus:outline-none bg-white"
              >
                <option value="perorangan">Perorangan (Konsumsi)</option>
                <option value="restoran">Restoran / Rumah Makan</option>
                <option value="luar_negeri">Luar Negeri / Ekspor</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Negara Tujuan</label>
              <input
                type="text"
                value={form.negara}
                onChange={change('negara')}
                required
                className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm focus:border-slate-800 focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Alamat Lengkap Pengiriman</label>
            <textarea
              rows={3}
              value={form.alamat}
              onChange={change('alamat')}
              required
              placeholder="Sebutkan jalan, nomor rumah, RT/RW, kelurahan, kecamatan, dan kota tujuan..."
              className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm focus:border-slate-800 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Catatan Tambahan (Opsional)</label>
            <input
              type="text"
              value={form.catatan}
              onChange={change('catatan')}
              placeholder="Contoh: packing ekstra oksigen, kirim pagi hari, dll."
              className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm focus:border-slate-800 focus:outline-none"
            />
          </div>
        </div>

        {/* Right: Order Summary */}
        <div className="lg:col-span-5 bg-white rounded-2xl border border-slate-100 p-6 sm:p-8 shadow-[0_2px_12px_rgba(0,0,0,0.02)] space-y-5">
          <h2 className="text-base font-bold text-slate-900 pb-2 border-b border-slate-100">
            Ringkasan Pesanan
          </h2>

          <div className="rounded-xl bg-slate-50 p-4 space-y-2">
            <div className="flex justify-between items-start">
              <div>
                <p className="font-bold text-slate-900 text-sm">{product.nama_produk}</p>
                <p className="text-xs text-slate-500 mt-0.5">{product.ukuran || 'Ukuran Standar'}</p>
              </div>
              <p className="font-bold text-slate-900 text-sm">{rupiah(product.harga)}/{product.satuan}</p>
            </div>

            <div className="pt-2 flex items-center justify-between text-xs text-slate-600 border-t border-slate-200/70">
              <label>Kuantiti yang dipesan:</label>
              <input
                type="number"
                min={1}
                value={form.jumlah}
                onChange={change('jumlah')}
                required
                className="w-20 rounded-lg border border-slate-300 px-2.5 py-1 text-center font-bold text-sm bg-white"
              />
            </div>
          </div>

          <div className="space-y-2 text-xs text-slate-600">
            <div className="flex justify-between">
              <span>Subtotal Produk</span>
              <span className="font-semibold text-slate-800">{rupiah(subtotal)}</span>
            </div>
            <div className="flex justify-between">
              <span>Biaya Pengiriman</span>
              <span className="text-slate-500 italic">Dihitung pada Penawaran</span>
            </div>
            <div className="pt-3 border-t border-slate-100 flex justify-between text-sm font-bold text-slate-900">
              <span>Total Awal</span>
              <span className="text-[#dc4c3e] text-base">{rupiah(subtotal)}</span>
            </div>
          </div>

          <div className="rounded-xl bg-amber-50 p-3.5 border border-amber-100 text-[11px] text-amber-800 leading-relaxed">
            💡 <strong>Alur Transaksi (Sesuai Product Backlog)</strong>: Setelah Anda mengajukan pesanan, Admin Tama Farm akan memeriksa stok dan memberikan rincian penawaran harga & ongkos kirim. Anda dapat menyetujui penawaran sebelum melakukan pembayaran online Midtrans.
          </div>

          <button
            type="submit"
            disabled={busy}
            className="w-full rounded-xl bg-[#dc4c3e] hover:bg-[#c93f31] py-3 text-sm font-semibold text-white shadow-xs transition-colors disabled:opacity-50 cursor-pointer"
          >
            {busy ? 'Mengajukan Pesanan...' : 'Ajukan Pesanan'}
          </button>
        </div>
      </form>
    </div>
  )
}
