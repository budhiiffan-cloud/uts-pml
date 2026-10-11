import { useEffect, useMemo } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { useFetch } from '../lib/useFetch'
import { rupiah } from '../lib/format'

export default function Home() {
  const { data: rawProduk } = useFetch('/produk')
  const { hash } = useLocation()
  const produkList = rawProduk || []

  // Smooth scroll saat ada anchor hash (#produk atau #tentang)
  useEffect(() => {
    if (hash) {
      const el = document.querySelector(hash)
      if (el) {
        el.scrollIntoView({ behavior: 'smooth' })
      }
    }
  }, [hash])

  // Pisahkan produk lobster hidup (per kg) dan paket kemitraan (per paket)
  const lobsterProducts = useMemo(() => {
    const items = produkList.filter(
      (p) => p.satuan === 'kg' || p.kategori?.nama_kategori?.toLowerCase().includes('lobster')
    )
    if (items.length > 0) return items.slice(0, 3)
    return [
      { id_produk: 1, nama_produk: 'Lobster Air Tawar', ukuran: 'Ukuran 100–150 gr', harga: 120000, satuan: 'kg', gambar_url: null },
      { id_produk: 2, nama_produk: 'Lobster Air Tawar', ukuran: 'Ukuran 150–200 gr', harga: 145000, satuan: 'kg', gambar_url: null },
      { id_produk: 3, nama_produk: 'Lobster Air Tawar', ukuran: 'Ukuran 200–250 gr', harga: 170000, satuan: 'kg', gambar_url: null },
    ]
  }, [produkList])

  const kemitraanProducts = useMemo(() => {
    const items = produkList.filter(
      (p) => p.satuan === 'paket' || p.kategori?.nama_kategori?.toLowerCase().includes('kemitraan')
    )
    if (items.length > 0) return items.slice(0, 2)
    return [
      { id_produk: 7, nama_produk: 'Paket Pemula', ukuran: 'Ukuran 100–150 gr', harga: 5000000, satuan: 'paket', gambar_url: null },
      { id_produk: 8, nama_produk: 'Paket Farmer', ukuran: 'Ukuran 150–200 gr', harga: 10000000, satuan: 'paket', gambar_url: null },
    ]
  }, [produkList])

  return (
    <div className="mx-auto max-w-6xl px-4 sm:px-6 py-6 sm:py-10 space-y-16">
      {/* Hero Section Banner */}
      <section className="rounded-3xl bg-[#0c1929] text-white p-7 sm:p-10 lg:p-12 shadow-lg">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-10 items-center">
          {/* Left Text Column */}
          <div className="lg:col-span-7">
            <h1 className="text-3xl sm:text-4xl lg:text-[42px] font-extrabold leading-[1.18] tracking-tight text-white">
              Lobster Berkualitas<br />
              untuk Kebutuhan Anda
            </h1>
            <p className="mt-4 max-w-md text-sm sm:text-base text-slate-300 leading-relaxed font-normal">
              Produk lobster hasil budidaya dengan pilihan jenis, ukuran, harga, dan stok yang jelas.
            </p>
            <div className="mt-8">
              <button
                type="button"
                onClick={() => {
                  const el = document.getElementById('produk')
                  if (el) el.scrollIntoView({ behavior: 'smooth' })
                }}
                className="inline-flex items-center justify-center rounded-xl bg-[#dc4c3e] hover:bg-[#c93f31] active:bg-[#b83325] active:scale-95 px-7 py-3 text-sm font-semibold text-white transition-all duration-200 shadow-md hover:shadow-lg cursor-pointer"
              >
                Lihat Produk
              </button>
            </div>
          </div>

          {/* Right Image/Banner Placeholder */}
          <div className="lg:col-span-5">
            <div className="rounded-2xl bg-[#14283c] h-60 sm:h-72 lg:h-[280px] w-full flex items-center justify-center border border-slate-700/60 shadow-inner">
              <span className="text-xs sm:text-sm font-bold tracking-wider text-slate-400 uppercase text-center px-4">
                FOTO LOBSTER / TAMBAK
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* Section 1: Produk Lobster */}
      <section id="produk" className="space-y-4 scroll-mt-24">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-slate-900">Produk Lobster</h2>
          <p className="mt-1 text-sm text-slate-500 font-normal">
            Pilih produk sesuai jenis, ukuran, dan minimal pembelian.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-2">
          {lobsterProducts.map((p) => (
            <div
              key={p.id_produk}
              className="rounded-2xl border border-slate-100 bg-white p-5 shadow-[0_2px_12px_rgba(0,0,0,0.03)] hover:shadow-md transition-all duration-200 flex flex-col justify-between"
            >
              <div>
                {/* Photo container */}
                <div className="rounded-xl bg-[#e5eff2] h-44 flex items-center justify-center text-xs font-semibold tracking-wider text-slate-400 overflow-hidden relative">
                  {p.gambar_url ? (
                    <img src={p.gambar_url} alt={p.nama_produk} className="w-full h-full object-cover" />
                  ) : (
                    <span>FOTO PRODUK</span>
                  )}
                </div>

                {/* Info */}
                <div className="mt-4">
                  <h3 className="text-base font-bold text-slate-900">{p.nama_produk}</h3>
                  <p className="text-xs text-slate-400 mt-0.5">
                    {p.ukuran?.startsWith('Ukuran') ? p.ukuran : `Ukuran ${p.ukuran || '100–150 gr'}`}
                  </p>
                </div>
              </div>

              {/* Bottom row: Price & Detail Button */}
              <div className="mt-5 pt-3 flex items-center justify-between border-t border-slate-50">
                <span className="text-base font-bold text-[#dc4c3e]">
                  {rupiah(p.harga)}/kg
                </span>
                <Link
                  to={`/produk/${p.id_produk}`}
                  className="rounded-lg bg-[#0c1929] hover:bg-[#182638] active:bg-[#060c14] active:scale-95 px-5 py-2 text-xs font-semibold text-white transition-all duration-200 shadow-xs hover:shadow cursor-pointer"
                >
                  Detail
                </Link>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Section 2: Kemitraan */}
      <section id="kemitraan" className="space-y-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-slate-900">Kemitraan</h2>
          <p className="mt-1 text-sm text-slate-500 font-normal">
            Pilih produk sesuai jenis, ukuran, dan minimal pembelian.
          </p>
        </div>

        {/* 2 Cards centered neatly */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2 max-w-4xl mx-auto">
          {kemitraanProducts.map((p) => (
            <div
              key={p.id_produk}
              className="rounded-2xl border border-slate-100 bg-white p-5 shadow-[0_2px_12px_rgba(0,0,0,0.03)] hover:shadow-md transition-all duration-200 flex flex-col justify-between"
            >
              <div>
                {/* Photo container */}
                <div className="rounded-xl bg-[#e5eff2] h-44 flex items-center justify-center text-xs font-semibold tracking-wider text-slate-400 overflow-hidden relative">
                  {p.gambar_url ? (
                    <img src={p.gambar_url} alt={p.nama_produk} className="w-full h-full object-cover" />
                  ) : (
                    <span>FOTO PRODUK</span>
                  )}
                </div>

                {/* Info */}
                <div className="mt-4">
                  <h3 className="text-base font-bold text-slate-900">{p.nama_produk}</h3>
                  <p className="text-xs text-slate-400 mt-0.5">
                    {p.ukuran?.startsWith('Ukuran') ? p.ukuran : `Ukuran ${p.ukuran || '100–150 gr'}`}
                  </p>
                </div>
              </div>

              {/* Bottom row: Price & Detail Button */}
              <div className="mt-5 pt-3 flex items-center justify-between border-t border-slate-50">
                <span className="text-base font-bold text-[#dc4c3e]">
                  {rupiah(p.harga)}
                </span>
                <Link
                  to={`/produk/${p.id_produk}`}
                  className="rounded-lg bg-[#0c1929] hover:bg-[#182638] active:bg-[#060c14] active:scale-95 px-5 py-2 text-xs font-semibold text-white transition-all duration-200 shadow-xs hover:shadow cursor-pointer"
                >
                  Detail
                </Link>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Section 3: Tentang Kami (Sesuai Dokumen Product Backlog) */}
      <section id="tentang" className="space-y-6 scroll-mt-24 pt-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-slate-900">Tentang Kami</h2>
          <p className="mt-1 text-sm text-slate-500 font-normal">
            Mengenal Tama Farm dan komitmen kami dalam penyediaan lobster air tawar unggulan.
          </p>
        </div>

        {/* 3 Keunggulan Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="rounded-2xl border border-slate-100 bg-white p-6 shadow-[0_2px_10px_rgba(0,0,0,0.02)] space-y-3">
            <div className="w-10 h-10 rounded-xl bg-red-50 text-[#dc4c3e] flex items-center justify-center font-bold text-lg">
              🦞
            </div>
            <h3 className="text-base font-bold text-slate-900">Budidaya Mandiri Berkualitas</h3>
            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
              Lobster air tawar dibudidayakan langsung pada tambak terkontrol dengan monitoring kualitas air (suhu, pH, dan salinitas) yang terjaga untuk memastikan kesegaran optimal.
            </p>
          </div>

          <div className="rounded-2xl border border-slate-100 bg-white p-6 shadow-[0_2px_10px_rgba(0,0,0,0.02)] space-y-3">
            <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold text-lg">
              ⚖️
            </div>
            <h3 className="text-base font-bold text-slate-900">Transparansi MOQ & Ukuran</h3>
            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
              Menyediakan klasifikasi ukuran yang akurat dengan batas minimal pembelian (MOQ) transparan untuk kebutuhan eceran, pasokan restoran reguler, hingga kuantiti ekspor.
            </p>
          </div>

          <div className="rounded-2xl border border-slate-100 bg-white p-6 shadow-[0_2px_10px_rgba(0,0,0,0.02)] space-y-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold text-lg">
              🤝
            </div>
            <h3 className="text-base font-bold text-slate-900">Program Kemitraan Terbina</h3>
            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
              Mendukung petani baru lewat Paket Pemula dan Paket Farmer, dilengkapi bibit sehat, pakan starter bernutrisi tinggi, dan bimbingan teknis budidaya hingga masa panen.
            </p>
          </div>
        </div>

        {/* Profil Lokasi & Mitra */}
        <div className="rounded-2xl border border-slate-200/90 bg-white p-6 sm:p-8 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="space-y-1">
            <span className="text-xs font-semibold text-[#dc4c3e] uppercase tracking-wider block">
              Identitas Mitra Tama Farm
            </span>
            <h4 className="text-lg font-bold text-slate-900">
              Pusat Budidaya & Distribusi Lobster Air Tawar
            </h4>
            <p className="text-xs sm:text-sm text-slate-600 max-w-2xl leading-relaxed">
              📍 Jl. Tik Nibung 2 No.16, RT.002/RW.08, Perak Utara, Kec. Pabean Cantian, Kota Surabaya<br />
              👤 Penanggung Jawab: Ahmad Rama Aditiya Iswanto · 📞 085755971102
            </p>
          </div>
          <Link
            to="/konsultasi"
            className="inline-flex items-center justify-center rounded-xl border border-slate-300 hover:border-slate-800 hover:bg-slate-800 hover:text-white active:scale-95 px-6 py-2.5 text-xs font-semibold text-slate-800 transition-all duration-200 shrink-0 cursor-pointer"
          >
            Hubungi Kami
          </Link>
        </div>
      </section>
    </div>
  )
}
