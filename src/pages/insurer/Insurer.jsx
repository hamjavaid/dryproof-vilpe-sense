import { useState } from 'react'
import { useData } from '../../data.jsx'
import { certifyBuilding, passportUrl } from '../../certification.js'
import { longDate, monthsBetween } from '../../format.js'
import AppShell from '../../components/AppShell.jsx'
import InfoTip from '../../components/InfoTip.jsx'
import Icon from '../../components/Icon.jsx'
import ServiceStatus from '../../components/ServiceStatus.jsx'
import './insurer.css'

// Indicative premium change per risk grade. To be agreed with the insurer in a pilot.
const PREMIUM = { A: -8, B: -4, C: 1 }
// Example rows that show how the portfolio view scales. Not real buildings, marked as examples on screen.
const EXAMPLES = [
  { name: 'Logistics hub, Tampere', months: 6, uptime: 61, grade: 'B' },
  { name: 'Office building, Espoo', months: 3, uptime: 43, grade: 'C' },
  { name: 'Production hall, Turku', months: 18, uptime: 91, grade: 'A' },
]

const gradeFor = (avg, atRisk) => (avg >= 80 && !atRisk ? 'A' : avg >= 65 ? 'B' : 'C')
const signed = n => (n > 0 ? `+${n}%` : `${n}%`)

function Body() {
  const { data } = useData()
  const [code, setCode] = useState('')
  const [result, setResult] = useState(null)
  const { building, summary } = data
  const { rows, certified, issued, validUntil, certId } = certifyBuilding(data)
  const openEquipment = rows.filter(r => r.c.openFaults.length > 0)

  // The real building, scored from its own data
  const avg = rows.reduce((n, r) => n + r.s.latest.score, 0) / rows.length
  const uptime = data.structures.reduce((n, s) => n + s.equipment_uptime_pct, 0) / data.structures.length
  const grade = gradeFor(avg, rows.some(r => r.s.latest.grade === 'At risk'))
  const months = monthsBetween(building.period.from, building.period.to)

  const verify = e => {
    e.preventDefault()
    const v = code.trim().toUpperCase()
    if (!v) { setResult({ ok: false, text: 'Enter a certificate number first.' }); return }
    setResult(v === certId
      ? { ok: true, text: `${v} is valid until ${longDate(validUntil)}. ${certified.length} of ${rows.length} structures certified dry.` }
      : { ok: false, text: `${v} is not a valid current certificate for any insured building.` })
  }

  return (
    <>
      <div className="page-head">
        <div>
          <h1>Portfolio view</h1>
          <p className="muted">Verified moisture data instead of self-reported answers. Certified structures are candidates for better terms. Structures with open faults get a prevention task before a claim happens.</p>
        </div>
      </div>

      <div className="stats">
        <div className="stat">
          <span className="stat-icon ico-teal"><Icon name="shield" /></span>
          <span className="stat-label">Risk grade, {building.name}</span>
          <span className="stat-value num">{grade}<small className="stat-small"> average score {avg.toFixed(0)}</small></span>
          <span className="stat-label">Indicative premium {signed(PREMIUM[grade])}<InfoTip term="riskGrade" /></span>
        </div>
        <div className="stat">
          <span className="stat-icon ico-gold"><Icon name="building" /></span>
          <span className="stat-label">Structures certified dry</span>
          <span className="stat-value num">{certified.length} of {rows.length}</span>
          <span className="stat-label">30 clean days in a row<InfoTip term="certified" /></span>
        </div>
        <div className="stat">
          <span className="stat-icon ico-red"><Icon name="alert" /></span>
          <span className="stat-label">Open equipment faults</span>
          <span className="stat-value num">{openEquipment.length}</span>
          <span className="stat-label">Prevention task sent to owner and VILPE service</span>
        </div>
        <div className="stat">
          <span className="stat-icon ico-teal"><Icon name="doc" /></span>
          <span className="stat-label">Highest mold index in {months} months</span>
          <span className="stat-value num">{summary.highest_mold_index_ours.toFixed(2)}</span>
          <span className="stat-label">Growth starts at 1.0<InfoTip term="mold" /></span>
        </div>
      </div>

      <section className="card ins-table-card">
        <div className="card-head">
          <h2>Building sensor risk table</h2>
          <span className="faint">1 connected building, {EXAMPLES.length} example rows</span>
        </div>
        <div className="ins-table-wrap">
          <table className="ins-table">
            <thead>
              <tr>
                <th scope="col">Building</th>
                <th scope="col">Verified monitoring</th>
                <th scope="col">Equipment uptime</th>
                <th scope="col">Risk grade<InfoTip term="riskGrade" /></th>
                <th scope="col" className="r">Premium adjustment</th>
              </tr>
            </thead>
            <tbody>
              <tr className="is-live">
                <th scope="row">{building.name}, {building.city}<small>Live VILPE Sense data</small></th>
                <td className="num">{months} months verified</td>
                <td className="num">{uptime.toFixed(0)}%</td>
                <td><span className={`grade grade-${grade}`}>{grade}</span></td>
                <td className="r num ins-premium">{signed(PREMIUM[grade])}</td>
              </tr>
              {EXAMPLES.map(x => (
                <tr key={x.name} className="is-example">
                  <th scope="row">{x.name}<small><span className="pill pill-muted">Example</span></small></th>
                  <td className="num">{x.months} months verified</td>
                  <td className="num">{x.uptime}%</td>
                  <td><span className={`grade grade-${x.grade}`}>{x.grade}</span></td>
                  <td className="r num">{signed(PREMIUM[x.grade])}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="faint ins-note">Example rows show how the view scales and are not real buildings. Premium adjustments are indicative. LocalTapiola is a proposed partner, terms to be agreed in a pilot.</p>
      </section>

      <div className="ins-grid">
        <section className="card">
          <div className="card-head">
            <h2>{building.name}, {building.city}</h2>
            <a className="btn btn-outline btn-sm" href={passportUrl(building.id, certId)}>Open passport</a>
          </div>
          <p className="faint num">Certificate {certId}, issued {longDate(issued)}</p>
          <ul className="ins-list">
            {rows.map(({ s, label, c }) => (
              <li key={s.id} className={c.openFaults.length ? 'has-fault' : ''}>
                <div className="ins-row">
                  <span><strong>{label}</strong> <span className="faint">{s.type}</span></span>
                  <span className={`pill ${c.certified ? 'pill-ok' : 'pill-muted'}`}>{c.certified ? 'Certified dry' : `Score ${s.latest.score.toFixed(0)}`}</span>
                </div>
                {c.openFaults.length > 0 && (
                  <>
                    <p className="ins-fault"><Icon name="alert" size={16} />Open fault: {c.openFaults.join(', ')}. Certificate on hold, prevention task sent to VILPE service.</p>
                    <div className="ins-task"><ServiceStatus structureId={s.id} onlyEquipment compact /></div>
                  </>
                )}
              </li>
            ))}
          </ul>
        </section>

        <div className="ins-side">
          <section className="card">
            <h2>Check a certificate</h2>
            <p className="card-note">Paste the number from a certificate a customer sent you.</p>
            <form className="ins-verify" onSubmit={verify}>
              <input value={code} onChange={e => { setCode(e.target.value); setResult(null) }} placeholder="Enter certificate number" aria-label="Certificate number" />
              <button className="btn btn-primary" type="submit">Check</button>
            </form>
            <p className="faint">Try the current one: <button type="button" className="link-btn num" onClick={() => { setCode(certId); setResult(null) }}>{certId}</button></p>
            {result && <p className={`ins-result ${result.ok ? 'ok' : 'bad'}`} role="status">{result.text}</p>}
          </section>

          <section className="card">
            <h2>Claims evidence</h2>
            <p className="card-note">Every structure has a day-by-day record of humidity, mold index and equipment state. When a claim comes in, the passport shows whether moisture was under control and when a fault started.</p>
            <a className="btn btn-sm" href={passportUrl(building.id, certId)} style={{ marginTop: 12 }}><Icon name="passport" size={16} />See the record</a>
          </section>
        </div>
      </div>
    </>
  )
}

export default function Insurer() {
  return <AppShell><Body /></AppShell>
}
