import { useState, useEffect } from 'react'
import { api } from '../../lib/api'
import { rupiah } from '../../lib/format'
import { Button } from '../../components/ui'

export default function Laporan() {
  const [tab, setTab] = useState('transaksi')
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api
      .get('/pengelolaan/pesanan')
      .then((res) => {
        setOrders(res.data?.data || [])
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  // Dummy budidaya data based on Product Backlog #14-18 & #27
  const budidayaData = [
    {
      kolam: 'Kolam A1 (Indukan)',
      suhu: '27.5 °C',
      ph: '7.8',
      salinitas: '0 ppt',
      pakan: 'Pelet Protein 40% (0.5 kg/hari)',
      pertumbuhan: 'Indukan rata-rata 120-150 gram',
      panen: 'Estimasi panen bibit: 2 minggu lagi',
    },
    {
      kolam: 'Kolam B1 (Pembesaran 1)',
      suhu: '28.0 °C',
      ph: '7.6',
      salinitas: '0 ppt',
      pakan: 'Pelet & Sayuran (1.2 kg/hari)',
      pertumbuhan: 'Size Medium (50-80 gram)',
      panen: 'Panen parsial 35 kg tercatat',
    },
    {
      kolam: 'Kolam B2 (Pembesaran 2)',
      suhu: '27.8 °C',
      ph: '7.7',
      salinitas: '0 ppt',
      pakan: 'Pelet & Tauge (1.5 kg/hari)',
      pertumbuhan: 'Size Large (>100 gram)',
      panen: 'Siap panen untuk restoran',
    },
  ]

  const totalOmzet = orders.reduce((sum, o) => sum + Number(o.total || 0), 0)

  const exportCSV = () => {
    if (tab === 'transaksi') {
      const headers = ['Kode Pesanan', 'Tanggal', 'Total (Rp)', 'Status Pesanan', 'Status Penawaran']
      const rows = orders.map((o) => [
        o.kode_pesanan,
        o.tanggal,
        o.total,
        o.status_pesanan,
        o.status_penawaran || '-',
      ])
      const csvContent =
        'data:text/csv;charset=utf-8,' +
        [headers.join(','), ...rows.map((e) => e.join(','))].join('\n')
      const encodedUri = encodeURI(csvContent)
      const link = document.createElement('a')
      link.setAttribute('href', encodedUri)
      link.setAttribute('download', `laporan-transaksi-${new Date().toISOString().slice(0, 10)}.csv`)
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
    } else {
      const headers = ['Kolam', 'Suhu', 'pH', 'Salinitas', 'Pemberian Pakan', 'Pertumbuhan', 'Panen']
      const rows = budidayaData.map((b) => [
        `"${b.kolam}"`,
        `"${b.suhu}"`,
        `"${b.ph}"`,
        `"${b.salinitas}"`,
        `"${b.pakan}"`,
        `"${b.pertumbuhan}"`,
        `"${b.panen}"`,
      ])
      const csvContent =
        'data:text/csv;charset=utf-8,' +
        [headers.join(','), ...rows.map((e) => e.join(','))].join('\n')
      const encodedUri = encodeURI(csvContent)
      const link = document.createElement('a')
      link.setAttribute('href', encodedUri)
      link.setAttribute('download', `laporan-budidaya-${new Date().toISOString().slice(0, 10)}.csv`)
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-slate-900">Laporan Usaha</h1>
          <p className="mt-1 text-sm text-slate-500">
            Laporan transaksi penjualan dan riwayat budidaya lobster (Product Backlog #26, #27, #29).
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="ghost" onClick={() => window.print()}>
            Cetak / Print
          </Button>
          <Button onClick={exportCSV}>
            Unduh / Export CSV
          </Button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-200">
        <button
          onClick={() => setTab('transaksi')}
          className={`pb-3 px-5 text-sm font-semibold border-b-2 transition-colors ${
            tab === 'transaksi'
              ? 'border-shell text-shell'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          Laporan Transaksi & Penjualan (#26)
        </button>
        <button
          onClick={() => setTab('budidaya')}
          className={`pb-3 px-5 text-sm font-semibold border-b-2 transition-colors ${
            tab === 'budidaya'
              ? 'border-shell text-shell'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          Laporan Budidaya Lobster (#27)
        </button>
      </div>

      {tab === 'transaksi' && (
        <div className="space-y-6">
          {/* Summary KPIs */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-xs">
              <p className="text-xs font-medium text-slate-500">Total Transaksi</p>
              <p className="mt-2 text-2xl font-bold text-slate-900">{orders.length} Pesanan</p>
            </div>
            <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-xs">
              <p className="text-xs font-medium text-slate-500">Estimasi Total Omzet</p>
              <p className="mt-2 text-2xl font-bold text-slate-900">{rupiah(totalOmzet)}</p>
            </div>
            <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-xs">
              <p className="text-xs font-medium text-slate-500">Pesanan Selesai / Dikirim</p>
              <p className="mt-2 text-2xl font-bold text-teal-600">
                {orders.filter((o) => ['dikirim', 'diterima', 'lunas'].includes(o.status_pesanan)).length}
              </p>
            </div>
          </div>

          {/* Table */}
          <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-xs">
            <table className="min-w-full divide-y divide-slate-200 text-left text-sm">
              <thead className="bg-slate-50 font-semibold text-slate-700">
                <tr>
                  <th className="px-5 py-3">Kode Pesanan</th>
                  <th className="px-5 py-3">Tanggal</th>
                  <th className="px-5 py-3">Status Pesanan</th>
                  <th className="px-5 py-3">Status Penawaran</th>
                  <th className="px-5 py-3 text-right">Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {orders.map((o) => (
                  <tr key={o.kode_pesanan} className="hover:bg-slate-50/70">
                    <td className="px-5 py-3 font-semibold text-slate-900">{o.kode_pesanan}</td>
                    <td className="px-5 py-3 text-slate-500">{o.tanggal}</td>
                    <td className="px-5 py-3">
                      <span className="rounded-md bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-800 capitalize">
                        {o.status_pesanan?.replaceAll('_', ' ')}
                      </span>
                    </td>
                    <td className="px-5 py-3">
                      {o.status_penawaran ? (
                        <span className="rounded-md bg-emerald-50 px-2 py-0.5 text-xs font-medium text-emerald-700">
                          {o.status_penawaran}
                        </span>
                      ) : (
                        '-'
                      )}
                    </td>
                    <td className="px-5 py-3 text-right font-medium text-slate-900">{rupiah(o.total)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {tab === 'budidaya' && (
        <div className="space-y-4">
          <p className="text-sm text-slate-600">
            Monitoring parameter kolam, kualitas air (pH, suhu, salinitas), pakan, serta siklus pertumbuhan dan panen.
          </p>
          <div className="grid gap-4">
            {budidayaData.map((item) => (
              <div
                key={item.kolam}
                className="rounded-xl border border-slate-200 bg-white p-5 shadow-xs space-y-3"
              >
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <h3 className="font-bold text-slate-900">{item.kolam}</h3>
                  <span className="text-xs font-medium bg-emerald-50 text-emerald-700 px-2.5 py-1 rounded-full">
                    Kondisi Air Normal
                  </span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-sm">
                  <div>
                    <span className="text-slate-500 text-xs block">Kualitas Air (Suhu / pH / Salinitas)</span>
                    <span className="font-medium text-slate-800">{item.suhu} · pH {item.ph} · {item.salinitas}</span>
                  </div>
                  <div>
                    <span className="text-slate-500 text-xs block">Pemberian Pakan (#16)</span>
                    <span className="font-medium text-slate-800">{item.pakan}</span>
                  </div>
                  <div>
                    <span className="text-slate-500 text-xs block">Pertumbuhan & Panen (#17, #18)</span>
                    <span className="font-medium text-slate-800">{item.pertumbuhan}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

