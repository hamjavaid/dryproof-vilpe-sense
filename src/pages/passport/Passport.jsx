import { useMemo } from 'react'
import { Link, useParams, useSearchParams } from 'react-router-dom'
import { useData, GRADE } from '../../data.jsx'
import { certifyBuilding, passportUrl } from '../../certification.js'
import { longDate, monthYear, monthsBetween } from '../../format.js'
import { checkName } from '../../explain.js'
import LineChart from '../../components/LineChart.jsx'
import BuildingIso from '../../components/BuildingIso.jsx'
import Wordmark from '../../components/Wordmark.jsx'
import Seal from '../../components/Seal.jsx'
import QrCode from '../../components/QrCode.jsx'
import InfoTip from '../../components/InfoTip.jsx'
import Icon from '../../components/Icon.jsx'
import './passport.css'

// Building-wide history: average score and highest mold index across all structures, per day
function buildingHistory(structures) {
  const byDate = {}
  for (const s of structures) for (const r of s.daily) {
    const d = (byDate[r.date] ??= { scores: [], mold: 0 })
    d.scores.push(r.score)
    d.mold = Math.max(d.mold, r.mold_index)
  }
  const dates = Object.keys(byDate).sort()
  return {
    dates,
    avgScore: dates.map(d => byDate[d].scores.reduce((a, b) => a + b, 0) / byDate[d].scores.length),
    maxMold: dates.map(d => byDate[d].mold),
  }
}

function Brand() {
  return (
    <div className="pp-brand"><Wordmark /></div>
  )
}

export default function Passport() {
  const { buildingId } = useParams()
  const [params] = useSearchParams()
  const scannedCert = params.get('cert')
  const { data, error, role } = useData()

  const history = useMemo(() => (data ? buildingHistory(data.structures) : null), [data])

  if (error) return <div className="pp"><p className="loading">{error}</p></div>
  if (!data) return <div className="pp"><p className="loading">Loading building passport</p></div>

  const { building } = data
  if (building.id !== buildingId) {
    return (
      <div className="pp">
        <Brand />
        <h1>Passport not found</h1>
        <p className="muted">There is no building passport for this link. Check the QR code or ask the building owner for a new one.</p>
      </div>
    )
  }

  const { rows, certified, from, issued, validUntil, certId } = certifyBuilding(data)
  const certStatus = !scannedCert ? 'none' : scannedCert === certId ? 'valid' : 'invalid'
  const avgNow = rows.reduce((n, r) => n + r.s.latest.score, 0) / rows.length
  const peakMold = Math.max(...history.maxMold)
  const months = monthsBetween(building.period.from, building.period.to)

  // Maintenance log: every watchdog finding, newest first, grouped per structure and check
  const log = []
  for (const { s, label } of rows) {
    const groups = {}
    for (const w of s.watchdog) {
      const g = (groups[w.check] ??= { label, check: w.check, kind: w.kind, start: w.start, end: w.end, days: 0 })
      g.start = w.start < g.start ? w.start : g.start
      g.end = w.end > g.end ? w.end : g.end
      g.days += w.days
    }
    log.push(...Object.values(groups))
  }
  log.sort((a, b) => b.end.localeCompare(a.end))
  const lastDay = history.dates[history.dates.length - 1]

  return (
    <div className="pp">
      <div className="pp-top">
        <Brand />
        {role && <Link className="btn btn-sm" to={`/${role}`}><Icon name="arrowLeft" size={15} />Back to dashboard</Link>}
      </div>

      {certStatus === 'valid' && (
        <div className="pp-verify ok" role="status">
          <Icon name="shield" size={26} />
          <div>
            <strong>Certificate {scannedCert} is valid</strong>
            <span>Valid until {longDate(validUntil)}. {certified.length} of {rows.length} structures certified dry.</span>
          </div>
        </div>
      )}
      {certStatus === 'invalid' && (
        <div className="pp-verify bad" role="alert">
          <Icon name="alert" size={26} />
          <div>
            <strong>Certificate {scannedCert} is not valid</strong>
            <span>It is outdated or was never issued. The current certificate is {certId}.</span>
          </div>
        </div>
      )}

      {/* The passport document */}
      <section className="pp-doc">
        <div className="pp-doc-head">
          <div>
            <h1 className="pp-doc-title">Building Moisture Passport</h1>
            <p className="pp-doc-sub">Record of verified structure health<br />{building.name}, {building.city}, Finland</p>
          </div>
          <div className="pp-doc-seal"><Seal size={128} /></div>
        </div>

        <div className="pp-doc-art">
          <BuildingIso structures={data.structures.map(s => ({ name: s.name, grade: s.latest.grade }))} />
          <div className="legend pp-doc-legend">
            {Object.entries(GRADE).map(([name, g]) => <span key={name}><i style={{ background: g.color }} />{name}</span>)}
          </div>
        </div>

        <div className="pp-doc-figures">
          <div><span>Structures monitored</span><strong className="num">{rows.length}</strong></div>
          <div><span>Monitoring period</span><strong className="num">{months} months</strong></div>
          <div><span>Certified dry today</span><strong className="num">{certified.length} of {rows.length}</strong></div>
        </div>
        <p className="pp-doc-verified">Verified data, VILPE Sense system</p>

        <div className="pp-doc-foot">
          <div className="pp-doc-qr">
            <QrCode url={passportUrl(building.id, certId)} size={92} />
            <span>Verify authenticity</span>
          </div>
          <p className="pp-doc-id num">DryProof by VILPE Sense · Document {certId} · Issued {longDate(issued)}</p>
        </div>
      </section>

      <div className="pp-facts">
        <div className="stat"><span className="stat-value num">{avgNow.toFixed(0)}</span><span className="stat-label">Average health score today, out of 100<InfoTip term="score" /></span></div>
        <div className="stat"><span className="stat-value num">{certified.length} of {rows.length}</span><span className="stat-label">Structures certified dry<InfoTip term="certified" /></span></div>
        <div className="stat"><span className="stat-value num">{peakMold.toFixed(2)}</span><span className="stat-label">Highest mold index ever recorded. Growth starts at 1.0<InfoTip term="mold" /></span></div>
        <div className="stat"><span className="stat-value num">{building.readings.toLocaleString('en')}</span><span className="stat-label">Sensor readings since {monthYear(building.period.from)}</span></div>
      </div>

      <div className="pp-grid">
        <section className="card pp-wide">
          <h2>Moisture history<InfoTip term="mold" /></h2>
          <p className="card-note">
            The highest mold index of any structure in the building, every day since monitoring began.
            {peakMold < 1 ? ' No mold growth has been recorded.' : ''}
          </p>
          <LineChart label="Highest mold index in the building per day" dates={history.dates} values={history.maxMold} min={0} max={3} digits={3}
            color="var(--moss)" area
            refs={[{ value: 2.5, label: 'Alarm level 2.5', color: 'var(--brick)' }, { value: 1, label: 'Growth starts 1.0', color: 'var(--amber)' }]} />
        </section>

        <section className="card pp-wide">
          <h2>Health score history<InfoTip term="score" /></h2>
          <p className="card-note">Average of all {rows.length} structures. Drops in autumn are the wet season.</p>
          <LineChart label="Average building health score per day" dates={history.dates} values={history.avgScore} min={0} max={100} area
            refs={[{ value: 85, label: 'Certified dry 85', color: 'var(--moss)' }]} />
        </section>

        <section className="card">
          <h2>Structures</h2>
          <ul className="pp-structs">
            {rows.map(({ s, label, c }) => {
              const g = GRADE[s.latest.grade]
              return (
                <li key={s.id}>
                  <i style={{ background: g?.color }} />
                  <span className="pp-sname">{label}<small>{s.type}</small></span>
                  <span className={`pill ${c.certified ? 'pill-ok' : g.pill}`}>{c.certified ? 'Certified dry' : s.latest.grade}</span>
                  <span className="num pp-sscore">{s.latest.score.toFixed(0)}</span>
                </li>
              )
            })}
          </ul>
        </section>

        <section className="card">
          <h2>Maintenance log</h2>
          <p className="card-note">Everything the monitoring system found, open or resolved. Shown in full so buyers and insurers can trust the record.</p>
          <ul className="pp-log">
            {log.map((e, i) => {
              const open = e.end.slice(0, 10) >= from // seen in the last 30 days = still open, same rule as the certificate
              const toToday = e.end.slice(0, 10) >= lastDay
              return (
                <li key={i}>
                  <span className={`pill ${open ? 'pill-warn' : 'pill-ok'}`}>{open ? 'Open' : 'Resolved'}</span>
                  <div>
                    <strong>{e.label}: {checkName(e.check)}</strong>
                    <p className="faint num">{longDate(e.start)} to {toToday ? 'today' : longDate(e.end)}, {Math.round(e.days)} days</p>
                  </div>
                </li>
              )
            })}
          </ul>
        </section>
      </div>

      <footer className="pp-foot">
        <p className="faint">
          Shared by the building owner. Data from VILPE Sense monitoring, mold index from the VTT mold growth model.
          Updated {longDate(lastDay)}.
        </p>
        {!role && <Link to="/login" className="faint">Owner sign in</Link>}
      </footer>
    </div>
  )
}
