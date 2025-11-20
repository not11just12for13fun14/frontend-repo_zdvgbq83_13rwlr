import { useState } from 'react'
import Hero from './components/Hero'
import Auth from './components/Auth'
import Dashboard from './components/Dashboard'

function App() {
  const [authed, setAuthed] = useState(!!localStorage.getItem('token'))
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
      {!authed ? (
        <>
          <Hero />
          <Auth onAuthed={() => setAuthed(true)} />
        </>
      ) : (
        <Dashboard />
      )}
    </div>
  )
}

export default App
