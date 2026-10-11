import { useEffect, useState } from 'react'
import { api } from '../../lib/api'
import { rupiah, qty } from '../../lib/format'
import { statusLabel } from '../../lib/orders'
import { useFetch } from '../../lib/useFetch'

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
    api
      .get(`/pengelolaan/pesanan/${code}`)
      .then((r) => {
        if (off) return
        setOrder(r.data)
        setOffer({
          biaya_pengiriman: r.data.biaya_pengiriman || 0,
          catatan_penawaran: r.data.catatan_penawaran || '',
          items: r.data.items.map((item) => ({ id_detail: item.id_detail, harga_satuan: item.harga_satuan })),
        })
        setShipment({ kurir: r.data.pengiriman?.kurir || '', no_resi: r.data.pengiriman?.no_resi || '' })
      })
      .catch((e) => !off && setFailure(e.message))
    return () => {
      off = true
    }
  }, [code])

  async function save(path, body) {
    setBusy(true)
    setFailure('')
    try {
      await api.post(`/pengelolaan/pesanan/${code}/${path}`, body)
      setCode(null)
      reload()
    } catch (err) {
      setFailure(Object.values(err.errors || {}).flat().join(' ') || err.message)
    } finally {
      setBusy(false)
    }
  }

  const getStatusColor = (status, penawaran) => {
    if (penawaran === 'menunggu') return 'bg-emerald-50 text-emerald-700 border-emerald-200'
    if (status === 'menunggu_persetujuan') return 'bg-amber-50 text-amber-700 border-amber-200'
    if (status === 'disetujui') return 'bg-amber-100 text-amber-800 border-amber-200'
    if (status === 'dp_dibayar' || status === 'lunas') return 'bg-green-50 text-green-700 border-green-200'
    if (status === 'dikirim') return 'bg-teal-50 text-teal-700 border-teal-200'
    if (status === 'ditolak') return 'bg-red-50 text-red-700 border-red-200'
    return 'bg-slate-50 text-slate-700 border-slate-200'
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900">
            Daftar Pesanan Pelanggan
          </h1>
          <p className="mt-1 text-sm text-slate-500 font-normal">
            Kelola persetujuan, penawaran harga, pembayaran, dan informasi pengiriman (Product Backlog #19-#23).
          </p>
        </div>
        <button
          onClick={reload}
          className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors shadow-2xs"
        >
          Perbarui Data
        </button>
      </div>

      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-xs font-semibold text-red-600">
          {error}
        </div>
      )}

      {/* Orders Table */}
      <div className="overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-[0_2px_12px_rgba(0,0,0,0.02)]">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-100 text-left text-sm">
            <thead className="bg-slate-50/80 font-bold text-slate-700 text-xs uppercase tracking-wider">
              <tr>
                <th className="px-6 py-4">Kode Pesanan</th>
                <th className="px-6 py-4">Tanggal</th>
                <th className="px-6 py-4">Status Pesanan</th>
                <th className="px-6 py-4">Total</th>
                <th className="px-6 py-4 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-xs text-slate-400">
                    Memuat pesanan...
                  </td>
                </tr>
              ) : data?.data?.length ? (
                data.data.map((item) => (
                  <tr key={item.kode_pesanan} className="hover:bg-slate-50/60 transition-colors">
                    <td className="px-6 py-4 font-bold text-slate-900 font-mono">
                      {item.kode_pesanan}
                    </td>
                    <td className="px-6 py-4 text-xs text-slate-500">
                      {item.tanggal}
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold border ${getStatusColor(
                          item.status_pesanan,
                          item.status_penawaran
                        )}`}
                      >
                        {statusLabel(item.status_pesanan)}
                      </span>
                    </td>
                    <td className="px-6 py-4 font-bold text-slate-900 text-sm">
                      {rupiah(item.total)}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button
                        onClick={() => setCode(item.kode_pesanan)}
                        className="rounded-lg bg-[#0c1929] hover:bg-[#182638] px-4 py-1.5 text-xs font-semibold text-white transition-colors cursor-pointer"
                      >
                        Kelola
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-xs text-slate-400">
                    Belum ada pesanan masuk.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {data?.last_page > 1 && (
          <div className="flex items-center justify-between p-4 border-t border-slate-100 text-xs">
            <button
              disabled={page === 1}
              onClick={() => setPage(page - 1)}
              className="px-3 py-1.5 rounded border border-slate-200 disabled:opacity-40"
            >
              Sebelumnya
            </button>
            <span className="text-slate-500">
              Halaman {page} dari {data.last_page}
            </span>
            <button
              disabled={page === data.last_page}
              onClick={() => setPage(page + 1)}
              className="px-3 py-1.5 rounded border border-slate-200 disabled:opacity-40"
            >
              Berikutnya
            </button>
          </div>
        )}
      </div>

      {/* Modal Detail & Aksi Kelola Pesanan */}
      {code && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="w-full max-w-2xl bg-white rounded-3xl p-6 sm:p-8 shadow-2xl max-h-[90vh] overflow-y-auto space-y-6">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div>
                <h2 className="text-xl font-bold text-slate-900">Kelola Pesanan: {code}</h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Status: <span className="font-semibold capitalize text-slate-800">{statusLabel(order?.status_pesanan)}</span>
                </p>
              </div>
              <button
                onClick={() => !busy && setCode(null)}
                className="rounded-lg p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
              >
                ✕
              </button>
            </div>

            {failure && (
              <div className="rounded-xl border border-red-200 bg-red-50 p-3.5 text-xs text-red-600 font-medium">
                {failure}
              </div>
            )}

            {!order ? (
              <p className="py-8 text-center text-xs text-slate-500">Memuat rincian pesanan...</p>
            ) : (
              <div className="space-y-5 text-xs sm:text-sm">
                {/* Data Pengiriman */}
                {order.data_pengiriman && (
                  <div className="rounded-xl bg-slate-50 p-4 space-y-1">
                    <span className="text-xs font-bold uppercase tracking-wider text-slate-400 block mb-1">
                      Data Penerima
                    </span>
                    <p className="font-bold text-slate-900">{order.data_pengiriman.nama} ({order.data_pengiriman.no_hp})</p>
                    <p className="text-slate-600">{order.data_pengiriman.alamat}, {order.data_pengiriman.negara}</p>
                    <p className="text-slate-500 text-xs">
                      Tipe Pembeli: <strong className="capitalize">{order.data_pengiriman.tipe_pembeli}</strong>
                    </p>
                  </div>
                )}

                {/* Items */}
                <div className="space-y-2">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-400 block">
                    Item Produk Dipesan
                  </span>
                  <div className="rounded-xl border border-slate-100 divide-y divide-slate-100">
                    {order.items.map((item) => (
                      <div key={item.id_detail} className="p-3 flex justify-between items-center text-xs">
                        <div>
                          <p className="font-bold text-slate-900">{item.nama_produk}</p>
                          <p className="text-slate-500 mt-0.5">
                            {qty(item.jumlah)} {item.satuan} × {rupiah(item.harga_satuan)}
                          </p>
                        </div>
                        <span className="font-bold text-slate-900">{rupiah(item.subtotal)}</span>
                      </div>
                    ))}
                  </div>
                  <div className="p-2 flex justify-between font-bold text-sm text-slate-900">
                    <span>Total Tagihan Saat Ini:</span>
                    <span className="text-[#dc4c3e]">{rupiah(order.total)}</span>
                  </div>
                </div>

                {/* Form Kirim Penawaran */}
                {['menunggu_persetujuan', 'disetujui'].includes(order.status_pesanan) && (
                  <form
                    onSubmit={(e) => {
                      e.preventDefault()
                      save('penawaran', offer)
                    }}
                    className="rounded-2xl border border-slate-200 bg-slate-50/50 p-5 space-y-4"
                  >
                    <h3 className="font-bold text-slate-900 text-sm">
                      Kirim / Revisi Penawaran Transaksi (#21)
                    </h3>
                    {order.items.map((item, index) => (
                      <div key={item.id_detail}>
                        <label className="block text-xs font-semibold text-slate-700 mb-1">
                          Harga per {item.satuan}: {item.nama_produk}
                        </label>
                        <input
                          type="number"
                          min={1}
                          required
                          value={offer.items[index]?.harga_satuan || ''}
                          onChange={(e) =>
                            setOffer((f) => ({
                              ...f,
                              items: f.items.map((row, i) =>
                                i === index ? { ...row, harga_satuan: Number(e.target.value) } : row
                              ),
                            }))
                          }
                          className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-sm focus:border-slate-800 focus:outline-none"
                        />
                      </div>
                    ))}
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        Biaya Pengiriman / Ongkir (Rp)
                      </label>
                      <input
                        type="number"
                        min={0}
                        required
                        value={offer.biaya_pengiriman}
                        onChange={(e) =>
                          setOffer((f) => ({ ...f, biaya_pengiriman: Number(e.target.value) }))
                        }
                        className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-sm focus:border-slate-800 focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        Catatan Penawaran (atau alasan penolakan jika ditolak)
                      </label>
                      <textarea
                        rows={2}
                        value={offer.catatan_penawaran}
                        onChange={(e) =>
                          setOffer((f) => ({ ...f, catatan_penawaran: e.target.value }))
                        }
                        className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-sm focus:border-slate-800 focus:outline-none"
                      />
                    </div>
                    <div className="flex gap-3 pt-2">
                      <button
                        type="submit"
                        disabled={busy}
                        className="rounded-xl bg-[#dc4c3e] hover:bg-[#c93f31] px-5 py-2.5 text-xs font-semibold text-white shadow-xs transition-colors cursor-pointer"
                      >
                        Kirim Penawaran ke Pembeli
                      </button>
                      <button
                        type="button"
                        disabled={busy || !offer.catatan_penawaran.trim()}
                        onClick={() => save('tolak', { alasan: offer.catatan_penawaran })}
                        className="rounded-xl border border-red-200 text-red-600 hover:bg-red-50 px-4 py-2.5 text-xs font-semibold transition-colors cursor-pointer"
                      >
                        Tolak Pesanan
                      </button>
                    </div>
                  </form>
                )}

                {/* Form Input Resi Pengiriman */}
                {order.status_penawaran === 'diterima' &&
                  order.pembayaran.some((p) => p.jenis === 'dp' && p.status_bayar === 'dibayar') &&
                  order.pengiriman?.status_pengiriman !== 'diterima' && (
                    <form
                      onSubmit={(e) => {
                        e.preventDefault()
                        save('pengiriman', shipment)
                      }}
                      className="rounded-2xl border border-slate-200 bg-slate-50/50 p-5 space-y-3"
                    >
                      <h3 className="font-bold text-slate-900 text-sm">
                        Input Ekspedisi & Nomor Resi (#23)
                      </h3>
                      <div>
                        <label className="block text-xs font-semibold text-slate-700 mb-1">Kurir / Ekspedisi</label>
                        <input
                          type="text"
                          required
                          value={shipment.kurir}
                          onChange={(e) => setShipment((s) => ({ ...s, kurir: e.target.value }))}
                          placeholder="Contoh: JNE Cargo / Ekspedisi Khusus Lobster"
                          className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-sm focus:border-slate-800 focus:outline-none"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-slate-700 mb-1">Nomor Resi / Surat Jalan</label>
                        <input
                          type="text"
                          required
                          value={shipment.no_resi}
                          onChange={(e) => setShipment((s) => ({ ...s, no_resi: e.target.value }))}
                          placeholder="Contoh: TM-LOB-99210"
                          className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-sm focus:border-slate-800 focus:outline-none"
                        />
                      </div>
                      <button
                        type="submit"
                        disabled={busy}
                        className="rounded-xl bg-[#0c1929] hover:bg-[#182638] px-5 py-2.5 text-xs font-semibold text-white shadow-xs cursor-pointer"
                      >
                        Simpan Pengiriman
                      </button>
                    </form>
                  )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
