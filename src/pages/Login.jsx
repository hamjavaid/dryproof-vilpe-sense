import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useData } from '../data.jsx'
import WarehouseIso from '../components/WarehouseIso.jsx'
import logo from '../assets/vilpe-sense-logo.png'
import './login.css'

// 'YYYY-MM-DD' -> 'Sep 2026'
const monShort = iso => new Date(iso + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', year: 'numeric' })

const ROLES = [
  { id: 'owner', title: 'Property owner', sub: 'See your buildings, reports and certificates', email: 'owner@demo.structura', color: '#4f7a3a' },
  { id: 'insurer', title: 'Insurer', sub: 'Check which buildings qualify for better terms', email: 'insurer@demo.structura', color: '#2f7a6e' },
  { id: 'service', title: 'VILPE service', sub: 'Find and fix faults across all sites', email: 'service@demo.structura', color: '#e51e25' },
]

export default function Login() {
  const { data, error, setRole } = useData()
  const [picked, setPicked] = useState('owner')
  const navigate = useNavigate()
  const role = ROLES.find(r => r.id === picked)

  const signIn = (e) => {
    e.preventDefault()
    setRole(picked)
    navigate(`/${picked}`)
  }

  return (
    <div className="lg">
      <aside className="lg-art">
        <p className="lg-kicker">VILPE Express Store, Vantaa</p>
        <h1 className="lg-title">Every roof proves it is dry, every day.</h1>
        <WarehouseIso />
        <p className="lg-foot">
          {data
            ? `${data.building.readings.toLocaleString('en')} sensor readings from ${data.summary.structures} Sense fans, ${monShort(data.building.period.from)} to ${monShort(data.building.period.to)}`
            : 'Loading building data'}
        </p>
      </aside>

      <main className="lg-side">
        <form className="lg-card" onSubmit={signIn}>
          <img className="lg-logo-img" src={logo} alt="VILPE Sense" />
          <h2 className="lg-name">DryProof</h2>
          <p className="lg-sub">Sign in to see how your structures are doing.</p>

          <div className="lg-roles" role="group" aria-label="Choose a demo account">
            {ROLES.map(r => {
              const on = picked === r.id
              return (
                <button type="button" key={r.id} className="lg-role" aria-pressed={on} onClick={() => setPicked(r.id)}>
                  <span className="lg-dot" style={{ background: r.color }} />
                  <span className="lg-role-text">
                    <span className="lg-role-top">
                      <span className="lg-role-title">{r.title}</span>
                      {on && <span className="lg-role-mail">{r.email}</span>}
                    </span>
                    {on && <span className="lg-role-sub">{r.sub}</span>}
                  </span>
                </button>
              )
            })}
          </div>

          <label className="lg-label" htmlFor="email">Email</label>
          <input className="lg-input" id="email" value={role.email} readOnly />
          <label className="lg-label" htmlFor="password">Password</label>
          <input className="lg-input" id="password" type="password" value="demo-password" readOnly />

          <button className="lg-btn lg-primary" type="submit">Sign in</button>
          <button className="lg-btn lg-outline" type="button" onClick={() => navigate('/story')}>Watch the story</button>

          {error && <p className="lg-error">{error}. Run python engine\step_f_export.py first.</p>}
          <p className="lg-note">Demo accounts. In production this uses VILPE Sense cloud accounts.</p>
        </form>
      </main>
    </div>
  )
}