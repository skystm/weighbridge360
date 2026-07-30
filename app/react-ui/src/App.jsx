import { useState } from 'react'
import CheckIn from './pages/CheckIn'
import Pesagem from './pages/Pesagem'
import Dashboard from './pages/Dashboard'
import './App.css'

export default function App() {
  const [page, setPage] = useState('checkin')
  const [ticketAtivo, setTicketAtivo] = useState(null)

  return (
    <div className="app">
      <header className="app-header">
        <div className="header-brand">
          <span className="brand-icon">⚖️</span>
          <span className="brand-name">WeighBridge <strong>360</strong></span>
          <span className="brand-fazenda">Fazenda Paiaguás · MT</span>
        </div>
        <nav className="header-nav">
          <button className={page === 'checkin' ? 'active' : ''} onClick={() => setPage('checkin')}>Check-in</button>
          <button className={page === 'pesagem' ? 'active' : ''} onClick={() => setPage('pesagem')}>Pesagem</button>
          <button className={page === 'dashboard' ? 'active' : ''} onClick={() => setPage('dashboard')}>Dashboard</button>
        </nav>
      </header>
      <main className="app-main">
        {page === 'checkin' && (
          <CheckIn onTicketCriado={(t) => { setTicketAtivo(t); setPage('pesagem') }} />
        )}
        {page === 'pesagem' && (
          <Pesagem ticket={ticketAtivo} onVoltar={() => setPage('checkin')} />
        )}
        {page === 'dashboard' && <Dashboard />}
      </main>
    </div>
  )
}
