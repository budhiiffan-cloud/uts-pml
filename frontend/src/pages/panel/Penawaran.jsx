import { useState, useEffect } from 'react'
import { api } from '../../lib/api'
import { rupiah } from '../../lib/format'
import { statusLabel } from '../../lib/orders'
import { Button, Modal, TextField, TextArea, ErrorNote, Empty } from '../../components/ui'
import { useAuth } from '../../context/AuthContext'

export default function Penawaran() {
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const [selectedCode, setSelectedCode] = useState(null)
  const [selectedOrder, setSelectedOrder] = useState(null)
  const [offer, setOffer] = useState({ biaya_pengiriman: 0, catatan_penawaran: '', items: [] })
  const [busy, setBusy] = useState(false)
  const [errorMsg, setErrorMsg] = useState('')

  const fetchOrders = () => {
    setLoading(true)
    api
      .get('/pengelolaan/pesanan')
      .then((res) => {
        const allOrders = res.data?.data || []
        // Filter orders that need an offer or have an offer
        const offerOrders = allOrders.filter(
          (o) =>
            o.status_penawaran === 'menunggu' ||
            o.status_pesanan === 'menunggu_persetujuan' ||
            o.status_pesanan === 'disetujui'
        )
        setOrders(offerOrders.length > 0 ? offerOrders : allOrders)
      })
      .catch((err) => setErrorMsg(err.message))
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    fetchOrders()
  }, [])

  useEffect(() => {
    if (!selectedCode) return
    setSelectedOrder(null)
    api
      .get(`/pengelolaan/pesanan/${selectedCode}`)
      .then((res) => {
        const d = res.data
        setSelectedOrder(d)
        setOffer({
          biaya_pengiriman: d.biaya_pengiriman || 0,
          catatan_penawaran: d.catatan_penawaran || '',
          items: d.items.map((i) => ({ id_detail: i.id_detail, harga_satuan: i.harga_satuan })),
        })
      })
      .catch((err) => setErrorMsg(err.message))
  }, [selectedCode])

  const submitOffer = async (e) => {
    e.preventDefault()
    setBusy(true)
    setErrorMsg('')
    try {
      await api.post(`/pengelolaan/pesanan/${selectedCode}/penawaran`, offer)
      setSelectedCode(null)
      fetchOrders()
    } catch (err) {
      setErrorMsg(Object.values(err.errors || {}).flat().join(' ') || err.message)
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-extrabold tracking-tight text-slate-900">Penawaran Transaksi</h1>
        <p className="mt-1 text-sm text-slate-500">
          Kelola dan kirim rincian penawaran harga & ongkos kirim ke pembeli (Product Backlog #21).
        </p>
      </div>

      {errorMsg && <ErrorNote message={errorMsg} />}

      {loading ? (
        <p className="text-sm text-slate-500">Memuat data penawaran...</p>
      ) : orders.length === 0 ? (
        <Empty title="Belum ada pesanan yang memerlukan penawaran" />
      ) : (
        <div className="grid gap-3">
          {orders.map((item) => (
            <div
              key={item.kode_pesanan}
              className="flex items-center justify-between rounded-xl border border-slate-200 bg-white p-5 shadow-xs"
            >
              <div>
                <p className="font-bold text-slate-900">{item.kode_pesanan}</p>
                <div className="mt-1 flex gap-2 text-xs">
                  <span className="rounded-md bg-amber-50 px-2 py-0.5 font-medium text-amber-700 capitalize">
                    {statusLabel(item.status_pesanan)}
                  </span>
                  {item.status_penawaran && (
                    <span className="rounded-md bg-emerald-50 px-2 py-0.5 font-medium text-emerald-700">
                      Penawaran: {item.status_penawaran}
                    </span>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-4">
                <span className="text-sm font-semibold text-slate-900">{rupiah(item.total)}</span>
                <Button onClick={() => setSelectedCode(item.kode_pesanan)}>
                  Buat / Revisi Penawaran
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal Penawaran */}
      <Modal
        open={!!selectedCode}
        onClose={() => !busy && setSelectedCode(null)}
        title={`Rincian Penawaran: ${selectedCode}`}
        wide
      >
        {!selectedOrder ? (
          <p className="text-sm text-slate-500">Memuat detail...</p>
        ) : (
          <form onSubmit={submitOffer} className="space-y-4">
            <div className="rounded-lg bg-slate-50 p-4 text-sm">
              <p className="font-semibold text-slate-800">
                Pembeli: {selectedOrder.data_pengiriman?.nama} ({selectedOrder.data_pengiriman?.no_hp})
              </p>
              <p className="text-slate-600 mt-1">{selectedOrder.data_pengiriman?.alamat}</p>
              <p className="text-slate-500 text-xs mt-2">
                Tipe Pembeli: <span className="capitalize">{selectedOrder.data_pengiriman?.tipe_pembeli}</span>
              </p>
            </div>

            <div className="space-y-3">
              <h3 className="font-semibold text-slate-900">Item Produk & Harga Penawaran</h3>
              {selectedOrder.items.map((item, index) => (
                <TextField
                  key={item.id_detail}
                  label={`Harga per ${item.satuan}: ${item.nama_produk} (Jumlah: ${item.jumlah} ${item.satuan})`}
                  type="number"
                  min={1}
                  required
                  value={offer.items[index]?.harga_satuan || ''}
                  onChange={(e) =>
                    setOffer((prev) => ({
                      ...prev,
                      items: prev.items.map((row, i) =>
                        i === index ? { ...row, harga_satuan: Number(e.target.value) } : row
                      ),
                    }))
                  }
                />
              ))}
              <TextField
                label="Biaya Pengiriman (Rp)"
                type="number"
                min={0}
                required
                value={offer.biaya_pengiriman}
                onChange={(e) =>
                  setOffer((prev) => ({ ...prev, biaya_pengiriman: Number(e.target.value) }))
                }
              />
              <TextArea
                label="Catatan Penawaran ke Pembeli"
                maxLength={2000}
                value={offer.catatan_penawaran}
                onChange={(e) =>
                  setOffer((prev) => ({ ...prev, catatan_penawaran: e.target.value }))
                }
              />
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t border-slate-200">
              <Button type="button" variant="ghost" onClick={() => setSelectedCode(null)}>
                Batal
              </Button>
              <Button type="submit" disabled={busy}>
                {busy ? 'Mengirim...' : 'Kirim Penawaran ke Pembeli'}
              </Button>
            </div>
          </form>
        )}
      </Modal>
    </div>
  )
}

