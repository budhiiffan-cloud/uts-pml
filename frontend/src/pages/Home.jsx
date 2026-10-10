import { useEffect, useMemo, useState } from 'react'
import { useLocation } from 'react-router-dom'
import ProductCard from '../components/ProductCard'
import { Empty, ErrorNote, Spinner } from '../components/ui'
import { qty, rupiah, waLink } from '../lib/format'
import { useFetch } from '../lib/useFetch'

function PriceBoard({ produk }) {
  const kg = produk.filter((p) => p.satuan === 'kg').slice(0, 6)
  const paket = produk.filter((p) => p.satuan === 'paket')
  const paketMulai = paket.length ? Math.min(...paket.map((p) => Number(p.harga))) : null

  return (
    <section aria-label="Papan harga" className="rounded-lg bg-tank p-5 text-foam sm:p-6">
      <div className="flex items-baseline justify-between border-b border-foam/25 pb-3">
        <h2 className="font-display text-xl font-bold">Papan harga</h2>
        <span className="text-sm text-foam/70">Harga per kg</span>
      </div>
      {kg.length === 0 ? (
        <p className="py-8 text-sm text-foam/70">Belum ada lobster hidup yang dijual.</p>
      ) : (
        <ul className="divide-y divide-foam/15">
          {kg.map((p, i) => (
            <li
              key={p.id_produk}
              className="row-in flex items-center justify-between gap-4 py-3"
              style={{ animationDelay: `${i * 90}ms` }}
            >
              <div className="min-w-0">
                <p className="truncate font-semibold">{p.nama_produk}</p>
                <p className="text-xs text-foam/65">
                  {p.ukuran ? `Ukuran ${p.ukuran}, ` : ''}
                  {Number(p.stok) > 0 ? `stok ${qty(p.stok)} kg` : 'stok habis'}
                </p>
              </div>
              <p className="font-display text-lg font-bold">{rupiah(p.harga)}</p>
            </li>
          ))}
        </ul>
      )}
      {paketMulai != null && (
        <p className="border-t border-foam/25 pt-3 text-sm text-foam/80">
          Paket kemitraan mulai {rupiah(paketMulai)}
        </p>
      )}
    </section>
  )
}

export default function Home() {
  const { data, loading, error, reload } = useFetch('/produk')
  const [q, setQ] = useState('')
  const [kat, setKat] = useState('semua')
  const [ukuran, setUkuran] = useState('semua')
  const { hash } = useLocation()

  // Router tidak otomatis scroll ke #katalog, jadi dilakukan manual setelah data siap.
  useEffect(() => {
    if (hash && !loading) document.querySelector(hash)?.scrollIntoView()
  }, [hash, loading])

  const produk = data || []
  const kategori = useMemo(() => {
    const map = new Map()
    produk.forEach((p) => p.kategori && map.set(p.kategori.id_kategori, p.kategori.nama_kategori))
    return [...map.entries()]
  }, [produk])

  const tampil = produk.filter(
    (p) =>
      (kat === 'semua' || String(p.id_kategori) === kat) &&
      (ukuran === 'semua' || p.ukuran === ukuran) &&
      p.nama_produk.toLowerCase().includes(q.trim().toLowerCase()),
  )

  const wa = waLink('Halo Tamafarm, saya ingin bertanya tentang produk lobster.')

  return (
    <>
      <section className="mx-auto grid max-w-6xl items-center gap-10 px-4 py-12 lg:grid-cols-[1.1fr_1fr] lg:py-20">
        <div>
          <h1 className="font-display text-4xl font-extrabold leading-[1.05] tracking-tight sm:text-6xl">
            Lobster hidup, langsung dari tambak.
          </h1>
          <p className="mt-5 max-w-md text-lg text-tank/80">
            Pilih lobster per kilo untuk restoran dan pembeli luar negeri, atau mulai budidaya lewat paket kemitraan.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <a href="#katalog" className="rounded-md bg-shell px-5 py-3 font-semibold text-white hover:bg-shell-dark">
              Lihat katalog
            </a>
            {wa && (
              <a href={wa} target="_blank" rel="noreferrer" className="rounded-md border border-tank px-5 py-3 font-semibold hover:bg-tank hover:text-foam">
                Tanya lewat WhatsApp
              </a>
            )}
          </div>
        </div>
        {loading ? <Spinner label="Memuat harga..." /> : error ? null : <PriceBoard produk={produk} />}
      </section>

      <section id="katalog" className="mx-auto max-w-6xl scroll-mt-4 px-4 pb-20">
        <div className="flex flex-col gap-4 border-t border-mist pt-10 sm:flex-row sm:items-end sm:justify-between">
          <h2 className="font-display text-3xl font-bold">Katalog produk</h2>
          <input
            type="search"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Cari nama produk"
            aria-label="Cari nama produk"
            className="w-full rounded-md border border-mist bg-white px-3 py-2 text-sm sm:w-64"
          />
        </div>

        {kategori.length > 1 && (
          <div className="mt-5 flex flex-wrap gap-2" role="group" aria-label="Filter kategori">
            {[['semua', 'Semua'], ...kategori.map(([id, nama]) => [String(id), nama])].map(([id, nama]) => (
              <button
                key={id}
                onClick={() => setKat(id)}
                aria-pressed={kat === id}
                className={`rounded-full border px-4 py-1.5 text-sm font-semibold transition-colors ${
                  kat === id ? 'border-tank bg-tank text-foam' : 'border-mist bg-white hover:border-tank'
                }`}
              >
                {nama}
              </button>
            ))}
          </div>
        )}

        <div className="mt-8">
          <label className="mb-5 block max-w-xs text-sm font-semibold">Filter ukuran
            <select value={ukuran} onChange={(event) => setUkuran(event.target.value)} className="mt-1 block w-full rounded-md border border-mist bg-white px-3 py-2">
              <option value="semua">Semua ukuran</option>
              {[...new Set(produk.map((p) => p.ukuran).filter(Boolean))].map((value) => <option key={value} value={value}>{value}</option>)}
            </select>
          </label>
          {loading ? (
            <Spinner />
          ) : error ? (
            <ErrorNote message={error} onRetry={reload} />
          ) : tampil.length === 0 ? (
            <Empty title={produk.length ? 'Tidak ada produk yang cocok' : 'Belum ada produk'}>
              {produk.length ? 'Coba kata kunci atau kategori lain.' : 'Produk akan tampil di sini setelah admin menambahkannya.'}
            </Empty>
          ) : (
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {tampil.map((p) => (
                <ProductCard key={p.id_produk} produk={p} />
              ))}
            </div>
          )}
        </div>
      </section>
    </>
  )
}
