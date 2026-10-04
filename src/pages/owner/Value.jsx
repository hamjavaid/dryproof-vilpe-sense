import { useState } from 'react'
import { useData } from '../../data.jsx'
import { monthsBetween } from '../../format.js'
import AppShell from '../../components/AppShell.jsx'
import InfoTip from '../../components/InfoTip.jsx'
import Icon from '../../components/Icon.jsx'
import './value.css'

// Example assumptions. The owner types their own numbers; nothing here is presented as fact.
const DEFAULTS = { checkCost: 60, premium: 10000, discount: 8, earlyFix: 5000, price: 19 }
const eur = n => `€${Math.round(n).toLocaleString('en')}`

function Field({ label, hint, value, onChange, unit }) {
  return (
    <label className="vf">
      <span className="vf-label">{label}</span>
      <span className="vf-input">
        {unit === '€' && <i>€</i>}
        <input type="number" min="0" value={value} onChange={e => onChange(Math.max(0, Number(e.target.value)))} />
        {unit !== '€' && <i>{unit}</i>}
      </span>
      <span className="vf-hint">{hint}</span>
    </label>
  )
}

function Body() {
  const { data } = useData()
  const [a, setA] = useState(DEFAULTS)
  const set = k => v => setA(x => ({ ...x, [k]: v }))
  const { summary, building, structures } = data
  const months = monthsBetween(building.period.from, building.period.to)

  // Facts from the data
  const alarmsPerYear = (summary.old_alarms_total * 12) / months
  const fanStopDays = Math.round(Math.max(...structures.flatMap(s => s.watchdog.filter(w => w.check === 'Fan stopped').map(w => w.days)), 0))

  // Value per year with the owner's numbers
  const lines = [
    { label: 'False alarms you no longer chase', calc: `${Math.round(alarmsPerYear)} alarms a year × ${eur(a.checkCost)}`, value: alarmsPerYear * a.checkCost, icon: 'alert' },
    { label: 'Lower insurance premium', calc: `${a.discount} % of ${eur(a.premium)}, once certified`, value: (a.premium * a.discount) / 100, icon: 'shield' },
    { label: 'Faults fixed early instead of late', calc: 'Your estimate of repairs avoided per year', value: a.earlyFix, icon: 'wrench' },
  ]
  const total = lines.reduce((n, l) => n + l.value, 0)
  const cost = structures.length * a.price * 12
  const net = total - cost
  const max = Math.max(total, cost, 1)

  return (
    <div className="value">
      <div className="page-head">
        <div>
          <h1>What DryProof is worth to you</h1>
          <p className="muted">Real findings from your building, turned into euros with your own numbers. Change any blue field.</p>
        </div>
      </div>

      <div className="stats">
        <div className="stat"><span className="stat-value num" style={{ color: 'var(--brick)' }}>{summary.old_alarms_total}</span><span className="stat-label">Old alarms in {months} months, all on healthy structures<InfoTip term="oldAlarm" /></span></div>
        <div className="stat"><span className="stat-value num">{summary.structures_with_watchdog_issue} of {summary.structures}</span><span className="stat-label">Units with a silent fault nobody noticed<InfoTip term="watchdog" /></span></div>
        <div className="stat"><span className="stat-value num" style={{ color: 'var(--brick)' }}>{fanStopDays}</span><span className="stat-label">Days one fan stood still without an alarm</span></div>
        <div className="stat"><span className="stat-value num" style={{ color: 'var(--moss)' }}>{summary.highest_mold_index_ours.toFixed(2)}</span><span className="stat-label">Highest mold index. No growth so far<InfoTip term="mold" /></span></div>
      </div>

      <div className="value-grid">
        <section className="card">
          <h2>Your numbers</h2>
          <p className="card-note">Example values. Replace them with your own.</p>
          <div className="vf-list">
            <Field label="Cost to check one alarm" unit="€" value={a.checkCost} onChange={set('checkCost')} hint="Staff time or a call-out per alarm" />
            <Field label="Building insurance premium" unit="€ / year" value={a.premium} onChange={set('premium')} hint="What you pay today" />
            <Field label="Discount for a certified building" unit="%" value={a.discount} onChange={set('discount')} hint="Leak-sensor discounts are often 3 to 10 %" />
            <Field label="Repairs avoided by fixing early" unit="€ / year" value={a.earlyFix} onChange={set('earlyFix')} hint="VILPE: small roof breaches cost a few thousand euros, late damage far more" />
            <Field label="DryProof price per structure" unit="€ / month" value={a.price} onChange={set('price')} hint={`Proposal. You have ${structures.length} structures`} />
          </div>
        </section>

        <section className="card value-result">
          <h2>Per year</h2>
          <ul className="vl">
            {lines.map(l => (
              <li key={l.label}>
                <span className="vl-icon"><Icon name={l.icon} size={16} /></span>
                <span><strong>{l.label}</strong><span>{l.calc}</span></span>
                <span className="num vl-value">{eur(l.value)}</span>
              </li>
            ))}
          </ul>

          <div className="vbars">
            <div><span>Value</span><i style={{ width: `${(total / max) * 100}%` }} className="v" /><strong className="num">{eur(total)}</strong></div>
            <div><span>Cost</span><i style={{ width: `${(cost / max) * 100}%` }} className="c" /><strong className="num">{eur(cost)}</strong></div>
          </div>

          <div className={`vnet ${net >= 0 ? 'ok' : 'bad'}`}>
            <span>Net value per year</span>
            <strong className="num">{eur(net)}</strong>
            {cost > 0 && <span className="num">{(total / cost).toFixed(1)} × what it costs</span>}
          </div>
          <p className="faint">Not counted: a clean moisture record when you sell or let the building. Moisture damage is the most common cause of property sale disputes in Finland.</p>
        </section>
      </div>
    </div>
  )
}

export default function Value() {
  return <AppShell><Body /></AppShell>
}
