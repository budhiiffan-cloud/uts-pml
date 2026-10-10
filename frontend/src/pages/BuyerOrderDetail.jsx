import { useCallback, useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { Button, ConfirmDialog, ErrorNote, Spinner } from '../components/ui'
import { api } from '../lib/api'
import { guestOrders, orderHeaders, statusLabel } from '../lib/orders'
import { rupiah, qty } from '../lib/format'
import { useAuth } from '../context/AuthContext'

export default function BuyerOrderDetail() {
  const { code } = useParams()
  const { user, loading: authLoading } = useAuth()
  const token = guestOrders().find((item) => item.code === code)?.token
  const [order, setOrder] = useState(null)
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const [decision, setDecision] = useState(null)
  const load = useCallback(async () => {
    try { const response = await api.get(`/pesanan/${code}`, orderHeaders(token)); setOrder(response.data); setError('') }
    catch (err) { setError(err.message) }
  }, [code, token])
  useEffect(() => { if (!authLoading) { setOrder(null); load() } }, [load, authLoading, user])

  async function action(path, body) {
    setBusy(true)
    setError('')
    try { await api.post(`/pesanan/${code}/${path}`, body, orderHeaders(token)); await load() }
    catch (err) { setError(err.message) }
    finally { setBusy(false); setDecision(null) }
  }

  async function pay(jenis) {
    setBusy(true)
    setError('')
    try {
      const response = await api.post(`/pesanan/${code}/pembayaran`, { jenis }, orderHeaders(token))
      const url = new URL(response.data.redirect_url)
      if (url.protocol !== 'https:' || url.hostname !== 'app.sandbox.midtrans.com') throw new Error('Alamat pembayaran tidak valid.')
      window.location.assign(url.href)
    } catch (err) { setError(err.message); setBusy(false) }
  }

  if (!order) return <div className="mx-auto max-w-4xl px-4 py-10">{error ? <ErrorNote message={error} onRetry={load} /> : <Spinner />}</div>
  const dpPaid = order.pembayaran.some((payment) => payment.jenis === 'dp' && payment.status_bayar === 'dibayar')
  const balance = Math.max(0, Number(order.total) - Number(order.total_dibayar))

  return (
    <div className="mx-auto max-w-4xl px-4 py-10">
      <Link to="/pesanan" className="text-sm underline">Semua pesanan</Link>
      <div className="mt-4 flex flex-wrap justify-between gap-4"><div><h1 className="font-display text-3xl font-bold">{code}</h1><p className="mt-2 capitalize">{statusLabel(order.status_pesanan)}</p></div><Button variant="ghost" onClick={load} disabled={busy}>Perbarui</Button></div>
      {error && <div className="mt-4"><ErrorNote message={error} /></div>}
      {token && <div className="mt-6 rounded-md border border-mist p-4 text-sm"><p className="font-semibold">Simpan akses pesanan tamu</p><p className="mt-2 break-all">Token: <code>{token}</code></p><p className="mt-2 text-tank/70">Simpan kode pesanan dan token ini. Jangan bagikan kepada orang lain.</p></div>}
      <div className="mt-6 rounded-lg border border-mist bg-white p-5">
        <h2 className="font-display text-xl font-bold">Rincian pesanan</h2>
        {order.items.map((item) => <div key={item.id_detail} className="flex justify-between gap-3 border-b border-mist py-4"><div><p className="font-semibold">{item.nama_produk || `Produk #${item.id_produk}`}</p><p className="text-sm">{qty(item.jumlah)} {item.satuan} × {rupiah(item.harga_satuan)}</p></div><p>{rupiah(item.subtotal)}</p></div>)}
        <p className="mt-4 flex justify-between">Ongkir <span>{rupiah(order.biaya_pengiriman)}</span></p>
        <p className="mt-3 flex justify-between text-xl font-bold">Total <span>{rupiah(order.total)}</span></p>
        <p className="mt-2 text-sm text-tank/70">{order.penawaran_dikirim_at ? 'Harga sesuai penawaran admin.' : 'Estimasi awal. Menunggu penawaran admin beserta ongkir.'}</p>
        {order.catatan && <p className="mt-4 whitespace-pre-line text-sm">Catatan kamu: {order.catatan}</p>}
      </div>
      <section className="mt-6 rounded-lg border border-mist bg-white p-5">
        <h2 className="font-display text-xl font-bold">Penawaran admin</h2>
        <p className="mt-2 whitespace-pre-line">{order.catatan_penawaran || 'Belum ada catatan penawaran.'}</p>
        {order.status_penawaran && <p className="mt-2 capitalize">Status: {statusLabel(order.status_penawaran)}</p>}
        {order.status_penawaran === 'menunggu' && <div className="mt-4 flex gap-3"><Button disabled={busy} onClick={() => setDecision('diterima')}>Terima penawaran</Button><Button variant="danger" disabled={busy} onClick={() => setDecision('ditolak')}>Tolak penawaran</Button></div>}
      </section>
      <section className="mt-6 rounded-lg border border-mist bg-white p-5">
        <h2 className="font-display text-xl font-bold">Pembayaran</h2>
        <p className="mt-2">Sudah dibayar: {rupiah(order.total_dibayar)} · Sisa: {rupiah(balance)}</p>
        {order.status_penawaran === 'diterima' && !dpPaid && <p className="mt-2 text-sm">DP {order.dp_persen}%: {rupiah(order.nominal_dp)}. Sisa dibayar saat pelunasan.</p>}
        {order.pembayaran.map((payment) => <p key={payment.id_pembayaran} className="mt-2 text-sm capitalize">{payment.jenis === 'dp' ? 'DP' : 'Pelunasan'} · {rupiah(payment.jumlah)} · {statusLabel(payment.status_bayar)}</p>)}
        {!order.pembayaran_aktif && <p className="mt-4 text-sm text-tank/70">Pembayaran online belum diaktifkan. Hubungi admin melalui konsultasi.</p>}
        {order.status_penawaran === 'diterima' && balance > 0 && order.pembayaran_aktif && <div className="mt-4 flex flex-wrap gap-3"><Button disabled={busy} onClick={() => pay(dpPaid ? 'pelunasan' : 'dp')}>{dpPaid ? 'Bayar pelunasan' : 'Bayar DP'}</Button><Button variant="ghost" disabled={busy} onClick={() => action('status-pembayaran', {})}>Cek pembayaran</Button></div>}
      </section>
      <section className="mt-6 rounded-lg border border-mist bg-white p-5">
        <h2 className="font-display text-xl font-bold">Pengiriman</h2>
        {order.data_pengiriman && <p className="mt-2 whitespace-pre-line">{order.data_pengiriman.nama} · {order.data_pengiriman.no_hp}<br />{order.data_pengiriman.alamat}, {order.data_pengiriman.negara}</p>}
        {order.pengiriman ? <div className="mt-4"><p>{order.pengiriman.kurir} · Resi {order.pengiriman.no_resi}</p><p className="mt-2 capitalize">{statusLabel(order.pengiriman.status_pengiriman)}</p>{order.pengiriman.status_pengiriman === 'dikirim' && <Button className="mt-3" disabled={busy} onClick={() => setDecision('diterima_pesanan')}>Konfirmasi pesanan diterima</Button>}</div> : <p className="mt-4 text-sm text-tank/70">Informasi pengiriman belum tersedia.</p>}
      </section>
      <Link to="/konsultasi" className="mt-6 inline-block font-semibold underline">Konsultasi dengan admin</Link>
      <ConfirmDialog open={!!decision} title={decision === 'diterima_pesanan' ? 'Konfirmasi penerimaan' : 'Jawab penawaran'} message={decision === 'diterima_pesanan' ? 'Pastikan barang sudah kamu terima.' : decision === 'diterima' ? 'Terima rincian harga dan ongkir di atas? Stok akan dicadangkan untuk pesananmu.' : 'Tolak penawaran ini? Pesanan akan ditutup.'} confirmLabel="Konfirmasi" busy={busy} onCancel={() => setDecision(null)} onConfirm={() => action(decision === 'diterima_pesanan' ? 'diterima' : 'penawaran', decision === 'diterima_pesanan' ? {} : { keputusan: decision, versi_penawaran: order.versi_penawaran })} />
    </div>
  )
}
