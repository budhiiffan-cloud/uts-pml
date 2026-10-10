import { useState } from 'react'
import ChatPanel from '../../components/ChatPanel'
import { Button, Empty, ErrorNote, Spinner } from '../../components/ui'
import { useFetch } from '../../lib/useFetch'

export default function Konsultasi() {
  const [page, setPage] = useState(1)
  const { data, loading, error, reload } = useFetch(`/pengelolaan/konsultasi?page=${page}`)
  const [selected, setSelected] = useState(null)
  return <div><div className="flex justify-between gap-3"><h1 className="font-display text-3xl font-bold">Konsultasi pembeli</h1><Button variant="ghost" onClick={reload}>Perbarui</Button></div><div className="mt-6 grid gap-6 lg:grid-cols-[18rem_1fr]"><div className="space-y-3">{loading ? <Spinner /> : error ? <ErrorNote message={error} onRetry={reload} /> : data?.data?.length ? data.data.map((thread) => <button key={thread.id_pelanggan} onClick={() => setSelected(thread)} className={`block w-full rounded-md border p-4 text-left ${selected?.id_pelanggan === thread.id_pelanggan ? 'border-tank bg-sand' : 'border-mist bg-white'}`}><p className="font-semibold">{thread.nama}</p><p className="mt-1 truncate text-sm">{thread.isi_pesan}</p></button>) : <Empty title="Belum ada konsultasi" />}{data?.last_page > 1 && <div className="flex gap-2"><Button disabled={page === 1} onClick={() => setPage(page - 1)}>←</Button><Button disabled={page === data.last_page} onClick={() => setPage(page + 1)}>→</Button></div>}</div><div>{selected ? <><h2 className="mb-3 font-semibold">{selected.nama}</h2><ChatPanel key={selected.id_pelanggan} customerId={selected.id_pelanggan} /></> : <Empty title="Pilih percakapan untuk membalas" />}</div></div></div>
}
