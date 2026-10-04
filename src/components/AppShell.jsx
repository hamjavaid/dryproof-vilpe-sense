import { NavLink, useNavigate } from 'react-router-dom'
import { useData } from '../data.jsx'
import Wordmark from './Wordmark.jsx'
import Bell from './Bell.jsx'

const ROLE_NAMES = { owner: 'Property owner', insurer: 'Insurer', service: 'VILPE service' }

// Menu items per role. "How it works" shows every role the same flow chart.
const NAV = {
  owner: [
    { to: '/owner', label: 'Roof map', end: true },
    { to: '/owner/value', label: 'Value' },
    { to: '/owner/certificate', label: 'Certificate' },
  ],
  insurer: [{ to: '/insurer', label: 'Portfolio', end: true }],
  service: [{ to: '/service', label: 'Work orders', end: true }, { to: '/service/fleet', label: 'Fleet map' }],
}

// Top bar shared by all signed-in screens. Children render only once data.json has loaded,
// so pages can use the data without their own loading checks.
export default function AppShell({ children }) {
  const { data, error, role, setRole } = useData()
  const navigate = useNavigate()
  const nav = [...(NAV[role] ?? [])]
  if (role === 'owner' && data) nav.push({ to: `/passport/${data.building.id}`, label: 'Passport' })
  nav.push({ to: '/how-it-works', label: 'How it works' })

  return (
    <div className="shell">
      <header className="shell-bar">
        <div className="shell-brand">
          <Wordmark />
          {role && <span className="shell-role">{ROLE_NAMES[role]}{data ? ` · ${data.building.name}` : ''}</span>}
        </div>
        <nav className="shell-nav" aria-label="Sections">
          {nav.map(n => <NavLink key={n.to} to={n.to} end={n.end}>{n.label}</NavLink>)}
        </nav>
        <div className="shell-actions">
          {role && data && <Bell role={role} />}
          <button className="btn" onClick={() => navigate('/story')}>Story</button>
          <button className="btn" onClick={() => { setRole(null); navigate('/login') }}>{role ? 'Sign out' : 'Sign in'}</button>
        </div>
      </header>
      <main className="page">
        {error ? <p className="loading">{error}</p> : data ? children : <p className="loading">Loading building data</p>}
      </main>
    </div>
  )
}
