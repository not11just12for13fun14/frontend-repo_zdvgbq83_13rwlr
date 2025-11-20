import { useEffect, useState } from 'react'

const baseUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:8000'

function useAuthHeaders() {
  const token = localStorage.getItem('token')
  return token ? { Authorization: `Bearer ${token}` } : {}
}

function Stat({ label, value }) {
  return (
    <div className="bg-slate-800/60 border border-blue-500/20 rounded-xl p-4">
      <p className="text-blue-300 text-sm">{label}</p>
      <p className="text-white text-2xl font-bold mt-1">{value}</p>
    </div>
  )
}

export default function Dashboard() {
  const [me, setMe] = useState(null)
  const [tab, setTab] = useState('donors')
  const [donors, setDonors] = useState([])
  const [inventory, setInventory] = useState(null)
  const [requests, setRequests] = useState([])
  const [notifs, setNotifs] = useState([])
  const [certs, setCerts] = useState([])
  const [loading, setLoading] = useState(false)
  const headers = useAuthHeaders()

  const fetchMe = async () => {
    const res = await fetch(`${baseUrl}/me`, { headers })
    if (res.ok) setMe(await res.json())
  }
  const fetchDonors = async () => {
    const res = await fetch(`${baseUrl}/donors`, { headers })
    if (res.ok) setDonors(await res.json())
  }
  const fetchInventory = async () => {
    const res = await fetch(`${baseUrl}/inventory`, { headers })
    if (res.ok) setInventory(await res.json())
  }
  const fetchRequests = async () => {
    const res = await fetch(`${baseUrl}/requests`, { headers })
    if (res.ok) setRequests(await res.json())
  }
  const fetchNotifs = async () => {
    const res = await fetch(`${baseUrl}/notifications`, { headers })
    if (res.ok) setNotifs(await res.json())
  }

  useEffect(() => {
    fetchMe()
    fetchDonors()
    fetchInventory()
    fetchRequests()
    fetchNotifs()
  }, [])

  const [newDonor, setNewDonor] = useState({ name: '', blood_group: 'A+', phone: '', location: '' })
  const addDonor = async (e) => {
    e.preventDefault()
    if (!me?.hospital_id) return alert('Hospital not linked')
    setLoading(true)
    try {
      const res = await fetch(`${baseUrl}/donors`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...headers },
        body: JSON.stringify({ ...newDonor, hospital_id: me.hospital_id })
      })
      if (!res.ok) throw new Error('Failed to add donor')
      setNewDonor({ name: '', blood_group: 'A+', phone: '', location: '' })
      fetchDonors()
    } catch (e) { alert(e.message) } finally { setLoading(false) }
  }

  const [reqForm, setReqForm] = useState({ blood_group: 'A+', quantity: 1, urgency: 'high', patient_name: '', patient_details: '' })
  const createRequest = async (e) => {
    e.preventDefault()
    if (!me?.hospital_id) return alert('Hospital not linked')
    setLoading(true)
    try {
      const res = await fetch(`${baseUrl}/requests`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...headers },
        body: JSON.stringify({ ...reqForm, hospital_id: me.hospital_id })
      })
      if (!res.ok) throw new Error('Failed to create request')
      await fetchRequests()
      await fetchNotifs()
      setTab('requests')
    } catch (e) { alert(e.message) } finally { setLoading(false) }
  }

  const [chatInput, setChatInput] = useState('')
  const [chat, setChat] = useState([])
  const sendChat = async (e) => {
    e.preventDefault()
    if (!chatInput.trim()) return
    const userMsg = { role: 'user', content: chatInput }
    setChat(c => [...c, userMsg])
    setChatInput('')
    const res = await fetch(`${baseUrl}/chat`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ message: userMsg.content }) })
    const data = await res.json()
    setChat(c => [...c, { role: 'assistant', content: data.reply }])
  }

  const [donationUnits, setDonationUnits] = useState(1)
  const completeDonation = async (donor) => {
    if (!confirm(`Mark donation complete for ${donor.name}?`)) return
    try {
      const res = await fetch(`${baseUrl}/donations/complete`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...headers },
        body: JSON.stringify({ donor_id: donor._id, hospital_id: donor.hospital_id, units: donationUnits })
      })
      if (!res.ok) throw new Error('Failed to complete donation')
      await fetchDonors()
      await fetchInventory()
      // load certs for that donor
      const r2 = await fetch(`${baseUrl}/certificates/${donor._id}`, { headers })
      if (r2.ok) setCerts(await r2.json())
      setTab('certs')
    } catch (e) { alert(e.message) }
  }

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      <header className="border-b border-blue-500/20 bg-slate-900/60 backdrop-blur sticky top-0 z-20">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-red-500 font-bold">H</span>
            <span className="font-semibold tracking-wide">HEMO LINK</span>
          </div>
          <div className="flex items-center gap-2 text-sm text-blue-200">
            {me && <span className="px-2 py-1 bg-white/5 rounded-md">{me.role} · {me.email}</span>}
            <button onClick={() => { localStorage.removeItem('token'); location.reload() }} className="px-3 py-1.5 rounded-md bg-white/10 hover:bg-white/20">Logout</button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-8">
        {/* Stats */}
        <div className="grid md:grid-cols-4 gap-4 mb-8">
          <Stat label="Donors" value={donors.length} />
          <Stat label="Requests" value={requests.length} />
          <Stat label="Notifications" value={notifs.length} />
          <Stat label="Units Available" value={inventory?.units ? Object.values(inventory.units).reduce((a,b)=>a+Number(b||0),0) : 0} />
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-6 flex-wrap">
          {['donors','inventory','requests','notifications','chat','certs'].map(t => (
            <button key={t} onClick={()=>setTab(t)} className={`px-4 py-2 rounded-lg text-sm font-medium border ${tab===t? 'bg-red-500 border-red-500':'bg-white/5 border-blue-500/20 hover:bg-white/10'}`}>{t.toUpperCase()}</button>
          ))}
        </div>

        {tab === 'donors' && (
          <div className="grid lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 bg-slate-800/60 border border-blue-500/20 rounded-xl p-4 overflow-auto">
              <table className="w-full text-sm">
                <thead className="text-blue-300">
                  <tr>
                    <th className="text-left py-2">Name</th>
                    <th className="text-left py-2">Group</th>
                    <th className="text-left py-2">Phone</th>
                    <th className="text-left py-2">Donations</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {donors.map(d => (
                    <tr key={d._id} className="border-t border-white/5">
                      <td className="py-2">{d.name}</td>
                      <td className="py-2">{d.blood_group}</td>
                      <td className="py-2">{d.phone}</td>
                      <td className="py-2">{d.donation_count||0}</td>
                      <td className="py-2 text-right">
                        <button onClick={()=>completeDonation(d)} className="px-3 py-1.5 rounded-md bg-green-600 hover:bg-green-700 text-white text-xs">Mark Donation</button>
                      </td>
                    </tr>
                  ))}
                  {donors.length===0 && (
                    <tr><td colSpan="5" className="py-10 text-center text-blue-300">No donors yet</td></tr>
                  )}
                </tbody>
              </table>
            </div>
            <div className="bg-slate-800/60 border border-blue-500/20 rounded-xl p-4">
              <h3 className="font-semibold">Add Donor</h3>
              <form onSubmit={addDonor} className="mt-3 space-y-3">
                <input className="w-full bg-slate-900/60 px-3 py-2 rounded-md border border-blue-500/20" placeholder="Name" value={newDonor.name} onChange={e=>setNewDonor(s=>({...s,name:e.target.value}))} required />
                <select className="w-full bg-slate-900/60 px-3 py-2 rounded-md border border-blue-500/20" value={newDonor.blood_group} onChange={e=>setNewDonor(s=>({...s,blood_group:e.target.value}))}>
                  {['A+','A-','B+','B-','AB+','AB-','O+','O-'].map(bg => <option key={bg} value={bg}>{bg}</option>)}
                </select>
                <input className="w-full bg-slate-900/60 px-3 py-2 rounded-md border border-blue-500/20" placeholder="Phone" value={newDonor.phone} onChange={e=>setNewDonor(s=>({...s,phone:e.target.value}))} required />
                <input className="w-full bg-slate-900/60 px-3 py-2 rounded-md border border-blue-500/20" placeholder="Location" value={newDonor.location} onChange={e=>setNewDonor(s=>({...s,location:e.target.value}))} />
                <button disabled={loading} className="w-full bg-red-500 hover:bg-red-600 px-4 py-2 rounded-md font-semibold">{loading? 'Saving...':'Save Donor'}</button>
              </form>
            </div>
          </div>
        )}

        {tab === 'inventory' && inventory && (
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
            {Object.entries(inventory.units || {}).map(([bg, val]) => {
              const n = Number(val||0)
              const level = n <= (inventory.critical_threshold||2) ? 'critical' : (n <= (inventory.low_threshold||5) ? 'low' : 'ok')
              return (
                <div key={bg} className={`rounded-xl p-4 border ${level==='critical' ? 'bg-red-950/60 border-red-700/40' : level==='low' ? 'bg-yellow-950/40 border-yellow-700/40' : 'bg-slate-800/60 border-blue-500/20'}`}>
                  <p className="text-blue-300 text-sm">{bg}</p>
                  <p className="text-3xl font-bold mt-2">{n}</p>
                  {level!=='ok' && <p className="text-xs mt-1 text-red-300">{level==='critical'?'Critical':'Low'} stock</p>}
                </div>
              )
            })}
          </div>
        )}

        {tab === 'requests' && (
          <div className="grid lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 bg-slate-800/60 border border-blue-500/20 rounded-xl p-4 overflow-auto">
              <table className="w-full text-sm">
                <thead className="text-blue-300">
                  <tr>
                    <th className="text-left py-2">Blood Group</th>
                    <th className="text-left py-2">Qty</th>
                    <th className="text-left py-2">Urgency</th>
                    <th className="text-left py-2">Status</th>
                    <th className="text-left py-2">Matched</th>
                  </tr>
                </thead>
                <tbody>
                  {requests.map(r => (
                    <tr key={r._id} className="border-t border-white/5">
                      <td className="py-2">{r.blood_group}</td>
                      <td className="py-2">{r.quantity}</td>
                      <td className="py-2">{r.urgency}</td>
                      <td className="py-2">{r.status}</td>
                      <td className="py-2">{r.matched_donor_ids?.length||0}</td>
                    </tr>
                  ))}
                  {requests.length===0 && <tr><td colSpan="5" className="py-10 text-center text-blue-300">No requests yet</td></tr>}
                </tbody>
              </table>
            </div>
            <div className="bg-slate-800/60 border border-blue-500/20 rounded-xl p-4">
              <h3 className="font-semibold">Create Emergency Request</h3>
              <form onSubmit={createRequest} className="mt-3 space-y-3">
                <select className="w-full bg-slate-900/60 px-3 py-2 rounded-md border border-blue-500/20" value={reqForm.blood_group} onChange={e=>setReqForm(s=>({...s,blood_group:e.target.value}))}>
                  {['A+','A-','B+','B-','AB+','AB-','O+','O-'].map(bg => <option key={bg} value={bg}>{bg}</option>)}
                </select>
                <input type="number" min="1" className="w-full bg-slate-900/60 px-3 py-2 rounded-md border border-blue-500/20" value={reqForm.quantity} onChange={e=>setReqForm(s=>({...s,quantity:Number(e.target.value)}))} />
                <select className="w-full bg-slate-900/60 px-3 py-2 rounded-md border border-blue-500/20" value={reqForm.urgency} onChange={e=>setReqForm(s=>({...s,urgency:e.target.value}))}>
                  {['low','medium','high','critical'].map(u => <option key={u} value={u}>{u}</option>)}
                </select>
                <input placeholder="Patient name" className="w-full bg-slate-900/60 px-3 py-2 rounded-md border border-blue-500/20" value={reqForm.patient_name} onChange={e=>setReqForm(s=>({...s,patient_name:e.target.value}))} />
                <textarea placeholder="Details" className="w-full bg-slate-900/60 px-3 py-2 rounded-md border border-blue-500/20" value={reqForm.patient_details} onChange={e=>setReqForm(s=>({...s,patient_details:e.target.value}))} />
                <button disabled={loading} className="w-full bg-red-500 hover:bg-red-600 px-4 py-2 rounded-md font-semibold">{loading? 'Submitting...':'Raise Request'}</button>
              </form>
            </div>
          </div>
        )}

        {tab === 'notifications' && (
          <div className="bg-slate-800/60 border border-blue-500/20 rounded-xl p-4">
            <ul className="divide-y divide-white/5">
              {notifs.map(n => (
                <li key={n._id} className="py-3">
                  <p className="text-sm">{n.message}</p>
                  <p className="text-xs text-blue-300 mt-1">to donor {n.donor_id} · via {n.channel} · {n.status}</p>
                </li>
              ))}
              {notifs.length===0 && <p className="py-10 text-center text-blue-300">No notifications yet</p>}
            </ul>
          </div>
        )}

        {tab === 'chat' && (
          <div className="grid md:grid-cols-3 gap-6">
            <div className="md:col-span-2 bg-slate-800/60 border border-blue-500/20 rounded-xl p-4 h-[420px] overflow-auto">
              {chat.length===0 && <p className="text-blue-300">Ask me about eligibility, registration, inventory, or emergency steps.</p>}
              <div className="space-y-3">
                {chat.map((m, i) => (
                  <div key={i} className={`max-w-[80%] p-3 rounded-lg ${m.role==='user' ? 'ml-auto bg-red-600/80' : 'bg-white/10'}`}>
                    <p className="text-sm">{m.content}</p>
                  </div>
                ))}
              </div>
            </div>
            <form onSubmit={sendChat} className="bg-slate-800/60 border border-blue-500/20 rounded-xl p-4 flex flex-col gap-3">
              <input value={chatInput} onChange={e=>setChatInput(e.target.value)} className="bg-slate-900/60 px-3 py-2 rounded-md border border-blue-500/20" placeholder="Type your question" />
              <button className="bg-red-500 hover:bg-red-600 px-4 py-2 rounded-md font-semibold">Send</button>
            </form>
          </div>
        )}

        {tab === 'certs' && (
          <div className="bg-slate-800/60 border border-blue-500/20 rounded-xl p-4">
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              {certs.map(c => (
                <div key={c._id} className="rounded-xl border border-blue-500/20 bg-gradient-to-br from-slate-900 to-slate-800 p-4">
                  <div className="flex items-center justify-between">
                    <h4 className="font-semibold">Certificate</h4>
                    <span className="px-2 py-1 rounded-md text-xs bg-white/10">{c.badge}</span>
                  </div>
                  <p className="text-blue-300 text-sm mt-1">{c.donor_name} · {new Date(c.donation_date).toLocaleDateString()}</p>
                  <p className="mt-3 text-sm leading-relaxed">{c.ai_message}</p>
                  <a
                    href={`data:text/json;charset=utf-8,${encodeURIComponent(JSON.stringify(c,null,2))}`}
                    download={`certificate-${c._id}.json`}
                    className="inline-block mt-4 px-3 py-1.5 rounded-md bg-white/10 hover:bg-white/20 text-sm"
                  >Download</a>
                </div>
              ))}
              {certs.length===0 && <p className="text-blue-300">No certificates yet. Mark a donation to generate one.</p>}
            </div>
          </div>
        )}
      </main>
    </div>
  )
}
