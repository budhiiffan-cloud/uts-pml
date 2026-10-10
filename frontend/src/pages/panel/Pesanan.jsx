import { useEffect, useState } from 'react'
import { Button, Empty, ErrorNote, Modal, TextArea, TextField } from '../../components/ui'
import { useFetch } from '../../lib/useFetch'
import { api } from '../../lib/api'
import { rupiah, qty } from '../../lib/format'
import { statusLabel } from '../../lib/orders'

export default function Pesanan() {
  const [page, setPage] = useState(1)
  const { data, loading, error, reload } = useFetch(`/pengelolaan/pesanan?page=${page}`)
  const [code, setCode] = useState(null)
  const [order, setOrder] = useState(null)
  const [offer, setOffer] = useState({ biaya_pengiriman: 0, catatan_penawaran: '', items: [] })
  const [shipment, setShipment] = useState({ kurir: '', no_resi: '' })
  const [failure, setFailure] = useState('')
  const [busy, setBusy] = useState(false)
  useEffect(() => {
    let off = false
    setOrder(null)
    setFailure('')
    if (!code) return
    api.get(`/pengelolaan/pesanan/${code}`).then((r) => {
      if (off) return
      setOrder(r.data)
      setOffer({ biaya_pengiriman: r.data.biaya_pengiriman, catatan_penawaran: r.data.catatan_penawaran || '', items: r.data.items.map((item) => ({ id_detail: item.id_detail, harga_satuan: item.harga_satuan })) })
      setShipment({ kurir: r.data.pengiriman?.kurir || '', no_resi: r.data.pengiriman?.no_resi || '' })
    }).catch((e) => !off && setFailure(e.message))
    return () => { off = true }
  }, [code])

  async function save(path, body) {
    setBusy(true)
    setFailure('')
    try { await api.post(`/pengelolaan/pesanan/${code}/${path}`, body); setCode(null); reload() }
    catch (err) { setFailure(Object.values(err.errors || {}).flat().join(' ') || err.message) }
    finally { setBusy(false) }
  }

  return (
    <div>
      <div className="flex justify-between gap-3"><h1 className="font-display text-3xl font-bold">Pesanan pembeli</h1><Button variant="ghost" onClick={reload}>Perbarui</Button></div>
      {error && <ErrorNote message={error} onRetry={reload} />}
      <div className="mt-6 space-y-3">{loading ? <p>Memuat pesanan...</p> : data?.data?.length ? data.data.map((item) => <button key={item.kode_pesanan} onClick={() => setCode(item.kode_pesanan)} className="flex w-full flex-wrap justify-between gap-3 rounded-md border border-mist bg-white p-5 text-left"><div><p className="font-bold">{item.kode_pesanan}</p><p className="mt-1 text-sm capitalize">{statusLabel(item.status_pesanan)}</p></div><p>{rupiah(item.total)}</p></button>) : <Empty title="Belum ada pesanan" />}</div>
      {data?.last_page > 1 && <div className="mt-4 flex gap-3"><Button disabled={page === 1} onClick={() => setPage(page - 1)}>Sebelumnya</Button><Button disabled={page === data.last_page} onClick={() => setPage(page + 1)}>Berikutnya</Button></div>}
      <Modal open={!!code} onClose={() => !busy && setCode(null)} title={code || 'Pesanan'} wide>
        {failure && <ErrorNote message={failure} />}
        {!order ? <p>Memuat...</p> : <div className="space-y-5">
          <p className="capitalize">Status: {statusLabel(order.status_pesanan)}</p>
          {order.data_pengiriman && <p className="whitespace-pre-line">{order.data_pengiriman.nama} · {order.data_pengiriman.no_hp}<br />{order.data_pengiriman.alamat}, {order.data_pengiriman.negara}<br />Tipe: {statusLabel(order.data_pengiriman.tipe_pembeli)}</p>}
          {order.catatan && <p>Catatan: {order.catatan}</p>}
          <p>Total: {rupiah(order.total)} · Dibayar: {rupiah(order.total_dibayar)}</p>
          {order.items.map((item) => <p key={item.id_detail}>{item.nama_produk} · {qty(item.jumlah)} {item.satuan} · {rupiah(item.subtotal)}</p>)}
          {['menunggu_persetujuan', 'disetujui'].includes(order.status_pesanan) ? <form onSubmit={(e) => { e.preventDefault(); save('penawaran', offer) }} className="space-y-4 border-t border-mist pt-4">
            <h2 className="font-semibold">Kirim atau revisi penawaran</h2>
            {order.items.map((item, index) => <TextField key={item.id_detail} label={`Harga per ${item.satuan}: ${item.nama_produk}`} type="number" min={1} max={1000000000} step={1} required value={offer.items[index]?.harga_satuan || ''} onChange={(e) => setOffer((f) => ({ ...f, items: f.items.map((row, i) => i === index ? { ...row, harga_satuan: Number(e.target.value) } : row) }))} />)}
            <TextField label="Biaya pengiriman (Rp)" type="number" min={0} max={1000000000} step={1} required value={offer.biaya_pengiriman} onChange={(e) => setOffer((f) => ({ ...f, biaya_pengiriman: Number(e.target.value) }))} />
            <TextArea label="Catatan penawaran / alasan penolakan" maxLength={2000} value={offer.catatan_penawaran} onChange={(e) => setOffer((f) => ({ ...f, catatan_penawaran: e.target.value }))} />
            <div className="flex gap-3"><Button disabled={busy} type="submit">Kirim penawaran</Button><Button variant="danger" type="button" disabled={busy || !offer.catatan_penawaran.trim()} onClick={() => save('tolak', { alasan: offer.catatan_penawaran })}>Tolak pesanan</Button></div>
          </form> : order.status_penawaran === 'diterima' && order.pembayaran.some((p) => p.jenis === 'dp' && p.status_bayar === 'dibayar') && order.pengiriman?.status_pengiriman !== 'diterima' ? <form onSubmit={(e) => { e.preventDefault(); save('pengiriman', shipment) }} className="space-y-4 border-t border-mist pt-4"><h2 className="font-semibold">Informasi pengiriman</h2><TextField label="Kurir" required maxLength={100} value={shipment.kurir} onChange={(e) => setShipment((s) => ({ ...s, kurir: e.target.value }))} /><TextField label="Nomor resi" required maxLength={100} value={shipment.no_resi} onChange={(e) => setShipment((s) => ({ ...s, no_resi: e.target.value }))} /><Button disabled={busy}>Simpan pengiriman</Button></form> : <p className="text-sm text-tank/70">Menunggu langkah berikutnya dari pembeli atau pembayaran.</p>}
        </div>}
      </Modal>
    </div>
  )
}
