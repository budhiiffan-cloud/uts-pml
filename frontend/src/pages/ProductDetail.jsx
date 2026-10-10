import { Link, useParams } from 'react-router-dom'
import { Price, ProductImage } from '../components/ProductCard'
import { ErrorNote, Spinner } from '../components/ui'
import { qty, waLink } from '../lib/format'
import { useFetch } from '../lib/useFetch'
import { useAuth } from '../context/AuthContext'

export default function ProductDetail() {
  const { id } = useParams()
  const { user } = useAuth()
  const { data: p, loading, error, reload } = useFetch(`/produk/${id}`)

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <Link to="/#katalog" className="text-sm font-semibold underline underline-offset-4">
        Kembali ke katalog
      </Link>

      {loading ? (
        <Spinner />
      ) : error ? (
        <div className="mt-6"><ErrorNote message={error} onRetry={reload} /></div>
      ) : (
        <div className="mt-6 grid gap-8 md:grid-cols-2">
          <ProductImage produk={p} className="aspect-[4/3] w-full rounded-md" />
          <div>
            <p className="text-sm font-semibold text-kelp">{p.kategori?.nama_kategori}</p>
            <h1 className="font-display text-4xl font-extrabold leading-tight">{p.nama_produk}</h1>
            <div className="mt-4"><Price produk={p} large /></div>

            <dl className="mt-6 divide-y divide-mist border-y border-mist text-sm">
              {p.ukuran && <Row label="Ukuran" value={p.ukuran} />}
              <Row
                label="Stok"
                value={Number(p.stok) > 0 ? `${qty(p.stok)} ${p.satuan}` : 'Habis'}
              />
              {p.satuan === 'kg' && (
                <>
                  <Row label="Minimal order restoran" value={`${qty(p.moq_restoran)} kg`} />
                  <Row label="Minimal order luar negeri" value={`${qty(p.moq_luar_negeri)} kg`} />
                </>
              )}
            </dl>

            {p.deskripsi && <p className="mt-6 max-w-prose whitespace-pre-line leading-relaxed text-tank/85">{p.deskripsi}</p>}

            {(!user || user.role === 'pelanggan') && <div className="mt-8 flex flex-wrap gap-3">
              {Number(p.stok) > 0 ? <Link to={`/checkout/${id}`} className="rounded-md bg-tank px-5 py-3 font-semibold text-foam hover:bg-tank-soft">Ajukan pesanan</Link> : <span className="rounded-md bg-mist px-5 py-3 font-semibold">Stok habis</span>}
              <Link to="/konsultasi" className="rounded-md border border-tank px-5 py-3 font-semibold">Konsultasi dengan admin</Link>
            </div>}

            {waLink(`Halo Tamafarm, saya tertarik dengan ${p.nama_produk}.`) && (
              <a
                href={waLink(`Halo Tamafarm, saya tertarik dengan ${p.nama_produk}.`)}
                target="_blank"
                rel="noreferrer"
                className="mt-8 inline-block rounded-md bg-shell px-5 py-3 font-semibold text-white hover:bg-shell-dark"
              >
                Pesan lewat WhatsApp
              </a>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

function Row({ label, value }) {
  return (
    <div className="flex justify-between gap-4 py-3">
      <dt className="text-tank/70">{label}</dt>
      <dd className="font-semibold">{value}</dd>
    </div>
  )
}
