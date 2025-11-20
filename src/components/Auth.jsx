import { useState } from 'react'

export default function Auth({ onAuthed }) {
  const [mode, setMode] = useState('login')
  const [role, setRole] = useState('hospital')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [name, setName] = useState('')
  const [hospital, setHospital] = useState({ name: '', contact: '', city: '' })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const baseUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:8000'

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    try {
      if (mode === 'register') {
        const res = await fetch(`${baseUrl}/auth/register`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            email, password, role, name,
            hospital_name: role !== 'donor' ? hospital.name : undefined,
            city: hospital.city,
            contact_numbers: hospital.contact ? [hospital.contact] : [],
          })
        })
        if (!res.ok) throw new Error(await res.text())
        const data = await res.json()
        localStorage.setItem('token', data.access_token)
        onAuthed()
      } else {
        const body = new URLSearchParams()
        body.append('username', email)
        body.append('password', password)
        const res = await fetch(`${baseUrl}/auth/login`, { method: 'POST', body })
        if (!res.ok) throw new Error(await res.text())
        const data = await res.json()
        localStorage.setItem('token', data.access_token)
        onAuthed()
      }
    } catch (e) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <section id="auth" className="py-12">
      <div className="max-w-5xl mx-auto px-6">
        <div className="bg-slate-800/60 border border-blue-500/20 rounded-2xl p-6">
          <div className="flex items-center justify-between flex-wrap gap-3 mb-6">
            <div className="flex gap-2 bg-slate-900/60 p-1 rounded-lg">
              {['login','register'].map(m => (
                <button key={m} onClick={() => setMode(m)} className={`px-4 py-2 rounded-md text-sm font-medium ${mode===m? 'bg-red-500 text-white':'text-blue-200 hover:bg-white/10'}`}>{m.toUpperCase()}</button>
              ))}
            </div>
            <select value={role} onChange={e=>setRole(e.target.value)} className="bg-slate-900/60 text-blue-100 px-3 py-2 rounded-md border border-blue-500/20">
              <option value="hospital">Hospital</option>
              <option value="bloodbank">Blood Bank</option>
              <option value="donor">Donor</option>
              <option value="admin">Administrator</option>
            </select>
          </div>

          <form onSubmit={handleSubmit} className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="block text-blue-200 mb-1 text-sm">Email</label>
              <input className="w-full bg-slate-900/60 text-white rounded-md px-3 py-2 border border-blue-500/20" value={email} onChange={e=>setEmail(e.target.value)} required type="email" />
            </div>
            <div>
              <label className="block text-blue-200 mb-1 text-sm">Password</label>
              <input className="w-full bg-slate-900/60 text-white rounded-md px-3 py-2 border border-blue-500/20" value={password} onChange={e=>setPassword(e.target.value)} required type="password" />
            </div>
            <div className="md:col-span-2">
              <label className="block text-blue-200 mb-1 text-sm">Name</label>
              <input className="w-full bg-slate-900/60 text-white rounded-md px-3 py-2 border border-blue-500/20" value={name} onChange={e=>setName(e.target.value)} placeholder="Your name / contact person" />
            </div>
            {role !== 'donor' && (
              <>
                <div>
                  <label className="block text-blue-200 mb-1 text-sm">Hospital / Blood Bank Name</label>
                  <input className="w-full bg-slate-900/60 text-white rounded-md px-3 py-2 border border-blue-500/20" value={hospital.name} onChange={e=>setHospital(s=>({...s,name:e.target.value}))} />
                </div>
                <div>
                  <label className="block text-blue-200 mb-1 text-sm">Contact Number</label>
                  <input className="w-full bg-slate-900/60 text-white rounded-md px-3 py-2 border border-blue-500/20" value={hospital.contact} onChange={e=>setHospital(s=>({...s,contact:e.target.value}))} />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-blue-200 mb-1 text-sm">City</label>
                  <input className="w-full bg-slate-900/60 text-white rounded-md px-3 py-2 border border-blue-500/20" value={hospital.city} onChange={e=>setHospital(s=>({...s,city:e.target.value}))} />
                </div>
              </>
            )}

            <div className="md:col-span-2 flex items-center justify-between pt-2">
              {error && <p className="text-red-400 text-sm">{error}</p>}
              <button disabled={loading} className="ml-auto px-5 py-2.5 rounded-lg bg-red-500 hover:bg-red-600 text-white font-semibold disabled:opacity-60" type="submit">
                {loading ? 'Please wait...' : (mode==='login' ? 'Login' : 'Create account')}
              </button>
            </div>
          </form>
        </div>
      </div>
    </section>
  )
}
