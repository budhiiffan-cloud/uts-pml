import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import ChatPanel from '../components/ChatPanel'
import { Button, ErrorNote, Spinner, TextField } from '../components/ui'
import { useAuth } from '../context/AuthContext'
import { api } from '../lib/api'

function savedSession() {
  try { const data = JSON.parse(localStorage.getItem('tamafarm_guest_chat')); return data?.id_pelanggan && data?.token_konsultasi ? data : null } catch { return null }
}

export default function Consultation() {
  const { user, loading } = useAuth()
  const [session, setSession] = useState(null)
  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  useEffect(() => {
    let off = false
    setSession(null)
    setError('')
    if (loading) return
    if (user?.role === 'pelanggan') {
      setBusy(true)
      api.post('/konsultasi/mulai', {}).then((r) => !off && setSession(r.data)).catch((e) => !off && setError(e.message)).finally(() => !off && setBusy(false))
    } else if (!user) { setSession(savedSession()); setBusy(false) }
    return () => { off = true }
  }, [user, loading])

  async function start(event) {
    event.preventDefault()
    setBusy(true)
    setError('')
    try { const response = await api.post('/konsultasi/mulai', { nama: name, no_hp: phone }); localStorage.setItem('tamafarm_guest_chat', JSON.stringify(response.data)); setSession(response.data) }
    catch (err) { setError(err.message) }
    finally { setBusy(false) }
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-10">
      <h1 className="font-display text-3xl font-bold">Konsultasi dengan admin</h1>
      <p className="mb-6 mt-2 text-tank/70">Tanyakan produk dan kebutuhanmu. Pesan tersimpan dan balasan diperbarui setiap 15 detik.</p>
      {error && <ErrorNote message={error} />}
      {loading || (busy && !session) ? <Spinner /> : user && user.role !== 'pelanggan' ? <Link to={user.role === 'admin' ? '/panel/konsultasi' : '/'} className="underline">Buka halaman sesuai akunmu</Link> : session ? <ChatPanel customerId={session.id_pelanggan} token={session.token_konsultasi} /> : <form onSubmit={start} className="space-y-4 rounded-lg border border-mist bg-white p-5"><p className="text-sm">Kamu bisa berkonsultasi tanpa registrasi. Riwayat tamu tersimpan di browser ini.</p><TextField label="Nama" value={name} onChange={(e) => setName(e.target.value)} maxLength={100} required /><TextField label="Nomor HP / WhatsApp" type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} maxLength={20} required /><Button disabled={busy} type="submit">Mulai konsultasi</Button></form>}
    </div>
  )
}
