import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { Button, ErrorNote, Select, Spinner, TextArea, TextField } from '../components/ui'
import { ProductImage } from '../components/ProductCard'
import { useAuth } from '../context/AuthContext'
import { api } from '../lib/api'
import { useFetch } from '../lib/useFetch'
import { rupiah, qty } from '../lib/format'
import { rememberOrder } from '../lib/orders'

export default function Checkout() {
  const { id } = useParams()
  const { user, loading: authLoading } = useAuth()
  const { data: product, loading, error } = useFetch(`/produk/${id}`)
  const [form, setForm] = useState({ nama: '', no_hp: '', alamat: '', negara: 'Indonesia', tipe_pembeli: 'perorangan', jumlah: '1', catatan: '' })
  const [busy, setBusy] = useState(false)
  const [message, setMessage] = useState('')
  const navigate = useNavigate()

  useEffect(() => {
    let off = false
    if (user?.role === 'pelanggan') {
      api.get('/pembeli/profil').then((r) => {
        if (!off) setForm((f) => ({ ...f, nama: r.data.nama, no_hp: r.data.no_hp, alamat: r.data.alamat || '', negara: r.data.negara || 'Indonesia', tipe_pembeli: r.data.tipe_pembeli }))
      }).catch((e) => !off && setMessage(e.message))
    }
    return () => { off = true }
  }, [user])

  if (loading || authLoading) return <Spinner />
  if (error) return <ErrorNote message={error} />
  if (user && user.role !== 'pelanggan') return <div className="mx-auto max-w-3xl px-4 py-10"><ErrorNote message="Gunakan akun pelanggan atau keluar untuk mengajukan pesanan sebagai tamu." /></div>

  const minimum = product.satuan === 'paket' ? 1 : Number(form.tipe_pembeli === 'restoran' ? product.moq_restoran || 1 : form.tipe_pembeli === 'luar_negeri' ? product.moq_luar_negeri || 1 : 1)
  const change = (key) => (event) => setForm((f) => ({ ...f, [key]: event.target.value }))

  async function submit(event) {
    event.preventDefault()
    setBusy(true)
    setMessage('')
    try {
      const { jumlah, ...profile } = form
      const result = await api.post('/pesanan', { ...profile, items: [{ id_produk: Number(id), jumlah: Number(jumlah) }] })
      rememberOrder(result.data.kode_pesanan, result.data.token_akses)
      navigate(`/pesanan/${result.data.kode_pesanan}`)
    } catch (err) {
      setMessage(Object.values(err.errors || {}).flat().join(' ') || err.message)
    } finally { setBusy(false) }
  }

  return (
    <div className="mx-auto max-w-5xl px-4 py-10">
      <Link to={`/produk/${id}`} className="text-sm underline">Kembali ke produk</Link>
      <h1 className="mt-4 font-display text-3xl font-bold">Ajukan pesanan</h1>
      <p className="mt-2 text-tank/70">Isi data pengiriman. Admin akan mengirim penawaran sebelum pembayaran. Kamu bisa memesan tanpa membuat akun.</p>
      <form onSubmit={submit} className="mt-8 grid gap-8 md:grid-cols-2">
        <div className="space-y-4">
          <TextField label="Nama penerima" value={form.nama} onChange={change('nama')} maxLength={100} required />
          <TextField label="Nomor HP / WhatsApp" type="tel" value={form.no_hp} onChange={change('no_hp')} maxLength={20} required />
          <TextArea label="Alamat pengiriman" value={form.alamat} onChange={change('alamat')} maxLength={2000} required />
          <TextField label="Negara" value={form.negara} onChange={change('negara')} maxLength={50} required />
          <Select label="Tipe pembeli" value={form.tipe_pembeli} onChange={change('tipe_pembeli')}>
            <option value="perorangan">Perorangan</option><option value="restoran">Restoran</option><option value="luar_negeri">Luar negeri</option>
          </Select>
          <TextArea label="Catatan untuk admin" value={form.catatan} onChange={change('catatan')} maxLength={2000} />
        </div>
        <div className="space-y-4 rounded-lg border border-mist bg-white p-5">
          <ProductImage produk={product} className="aspect-[4/3] w-full rounded" />
          <h2 className="font-display text-xl font-bold">{product.nama_produk}</h2>
          <p>{rupiah(product.harga)} / {product.satuan} · Stok {qty(product.stok)} {product.satuan}</p>
          <TextField label={`Jumlah (${product.satuan})`} type="number" min={minimum} max={Number(product.stok)} step={product.satuan === 'paket' ? 1 : 0.01} value={form.jumlah} onChange={change('jumlah')} hint={`Minimal ${qty(minimum)} ${product.satuan}`} required />
          <p className="text-xl font-bold">Estimasi {rupiah(Math.round(Number(form.jumlah) * Number(product.harga)))}</p>
          <p className="text-sm text-tank/70">Belum termasuk ongkir. Harga akhir mengikuti penawaran admin. Pembayaran diproses dalam rupiah.</p>
          {message && <ErrorNote message={message} />}
          <Button type="submit" disabled={busy || Number(product.stok) <= 0} className="w-full">{busy ? 'Mengajukan...' : 'Ajukan pesanan'}</Button>
        </div>
      </form>
    </div>
  )
}
