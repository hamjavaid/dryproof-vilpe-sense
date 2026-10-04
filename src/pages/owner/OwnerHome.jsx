import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { useData, GRADE } from '../../data.jsx'
import { useReplay } from '../../replay.js'
import { labelOf } from '../../roof.js'
import { monthYear, shortDate } from '../../format.js'
import { checkName, verdict } from '../../explain.js'
import AppShell from '../../components/AppShell.jsx'
import RoofMap from '../../components/RoofMap.jsx'
import ReplayBar from '../../components/ReplayBar.jsx'
import InfoTip from '../../components/InfoTip.jsx'
import ScoreRing from '../../components/ScoreRing.jsx'
import Icon from '../../components/Icon.jsx'
import ServiceStatus from '../../components/ServiceStatus.jsx'
import './owner.css'

const PARTS = [
  { key: 'mold', label: 'Mold risk', max: 40 },
  { key: 'risk_zone', label: 'Time in risk zone', max: 20 },
  { key: 'drying', label: 'Drying performance', max: 20 },
  { key: 'system', label: 'System health', max: 20 },
]
const barColor = f => (f >= 0.8 ? 'var(--moss)' : f >= 0.5 ? 'var(--amber)' : 'var(--brick)')
const gradeOf = score => (score >= 85 ? 'Certified dry' : score >= 70 ? 'Good' : score >= 50 ? 'Attention' : 'At risk')

// Every event in 16 months, oldest first: watchdog findings starting and ending, and each old alarm
function buildActivity(data) {
  const out = []
  const last = data.building.period.to
  for (const s of data.structures) {
    const label = labelOf(s)
    const moldOn = new Map(s.daily.map(r => [r.date, r.mold_index]))
    for (const w of s.watchdog) {
      out.push({ at: w.start, tone: w.kind === 'Equipment' ? 'bad' : 'warn', title: `${label}: ${checkName(w.check).toLowerCase()}`, sub: 'Found by the watchdog' })
      if (w.end.slice(0, 10) < last) out.push({ at: w.end, tone: 'ok', title: `${label}: back to normal`, sub: `${checkName(w.check)} ended after ${Math.round(w.days)} days` })
    }
    for (const a of s.old_alarms) {
      const mold = moldOn.get(a.alarm_fired.slice(0, 10))
      out.push({ at: a.alarm_fired, tone: 'muted', title: `${label}: old alarm fired`, sub: `Humidity up to ${a.max_RH} %, mold index ${mold == null ? 'n/a' : mold.toFixed(2)}. No real risk.` })
    }
  }
  return out.sort((a, b) => a.at.localeCompare(b.at))
}

function Stat({ value, label, tone, term, ring, children }) {
  return (
    <div className={`stat${ring ? ' stat-ring' : ''}`}>
      <span className="stat-value num" style={tone ? { color: tone } : undefined}>{value}</span>
      <span className="stat-label">{label}{term && <InfoTip term={term} />}</span>
      {children}
    </div>
  )
}

function StructurePanel({ s }) {
  const say = verdict(s)
  if (s.score == null) {
    return (
      <section className="card panel" aria-live="polite">
        <p className="faint">{s.type}</p>
        <h2>{s.label}</h2>
        <p className={`say say-${say.tone}`} style={{ marginTop: 14 }}>{say.text}</p>
      </section>
    )
  }
  const g = GRADE[s.grade]
  return (
    <section className="card panel" aria-live="polite">
      <p className="faint">{s.type}</p>
      <div className="panel-title">
        <h2>{s.label}</h2>
        <span className={`pill ${g.pill}`}>{s.grade}</span>
      </div>
      <p className="panel-score num" style={{ color: g.color }}>{s.score.toFixed(1)}<span> / 100</span><InfoTip term="score" /></p>

      <div className="parts">
        {PARTS.map(p => {
          const v = s.parts[p.key]
          return (
            <div key={p.key}>
              <div className="part-row"><span>{p.label}</span><span className="num">{v.toFixed(1)} / {p.max}</span></div>
              <div className="bar"><div style={{ width: `${(v / p.max) * 100}%`, background: barColor(v / p.max) }} /></div>
            </div>
          )
        })}
      </div>

      <p className={`say say-${say.tone}`}><Icon name="info" size={16} />{say.text}</p>

      <div className="panel-block">
        <p className="panel-sub">What the watchdog found<InfoTip term="watchdog" /></p>
        {s.issues.length === 0
          ? <p className="muted">No issues so far.</p>
          : (
            <ul className="issues">
              {s.issues.map(i => (
                <li key={i.check}>
                  <span>{checkName(i.check)}{i.ongoing && <span className="pill pill-warn">ongoing</span>}</span>
                  <span className="num">{i.days} days</span>
                </li>
              ))}
            </ul>
          )}
      </div>

      <ServiceStatus structureId={s.id} compact />

      <div className="panel-block readings">
        <div><span className="faint">Temp inside</span><strong className="num">{s.indoorTemp == null ? 'n/a' : `${s.indoorTemp.toFixed(1)} °C`}</strong></div>
        <div><span className="faint">Humidity inside</span><strong className="num">{s.indoorRh == null ? 'n/a' : `${s.indoorRh.toFixed(0)} %`}</strong></div>
        <div><span className="faint">Fan speed</span><strong className="num" style={s.fanRpm === 0 ? { color: 'var(--brick)' } : undefined}>{s.fanRpm == null ? 'n/a' : `${Math.round(s.fanRpm)} rpm`}</strong></div>
      </div>

      <Link className="btn btn-outline btn-pill btn-block" to={`/owner/structure/${s.id}`}>Open details</Link>
    </section>
  )
}

function Body() {
  const { data } = useData()
  const replay = useReplay(data)
  const [selectedId, setSelectedId] = useState('viherkatto-2')
  const activity = useMemo(() => buildActivity(data), [data])
  if (!replay.date) return null

  const { structures, date, isToday } = replay
  const selected = structures.find(s => s.id === selectedId) ?? structures[0]
  const sorted = [...structures].sort((a, b) => (a.score ?? 999) - (b.score ?? 999))
  const { summary, building } = data
  const n = structures.length

  // Headline numbers for the date being shown
  const oldAlarms = structures.reduce((k, s) => k + s.oldAlarms, 0)
  const withIssue = structures.filter(s => s.issues.length > 0).length
  const certified = structures.filter(s => s.grade === 'Certified dry').length
  const scored = structures.filter(s => s.score != null)
  const avg = scored.length ? scored.reduce((k, s) => k + s.score, 0) / scored.length : null
  const faults = structures.flatMap(s => s.issues.filter(i => i.open && i.kind === 'Equipment').map(i => ({ s, i })))
  const recent = activity.filter(e => e.at.slice(0, 10) <= date).slice(-6).reverse()

  return (
    <>
      <div className="page-head">
        <div>
          <h1>{building.name}</h1>
          <p className="muted">{building.city}. {n} Sense fans, {monthYear(building.period.from)} to {monthYear(building.period.to)}.</p>
        </div>
      </div>

      {faults.length > 0
        ? (
          <div className="alert-bar" role="status">
            <Icon name="alert" size={20} />
            <span><strong>{checkName(faults[0].i.check)} on {faults[0].s.label}</strong>, {faults[0].i.days} days in total{faults[0].i.ongoing ? ', ongoing' : ', seen in the last 30 days'}. Old alarms never showed it.{faults.length > 1 ? ` Plus ${faults.length - 1} more.` : ''}</span>
            <button className="btn btn-sm" onClick={() => setSelectedId(faults[0].s.id)}>Show</button>
          </div>
        )
        : <div className="alert-bar ok" role="status"><Icon name="check" size={20} /><span>No equipment fault in the 30 days up to this date.</span></div>}

      <div className="stats five">
        <Stat value={oldAlarms} label="Old alarms fired, all on healthy structures" tone="var(--brick)" term="oldAlarm" />
        <Stat value={summary.smart_alerts_total} label="DryProof alerts, because there was no real risk" tone="var(--moss)" term="smartAlert" />
        <Stat value={`${withIssue} of ${n}`} label="Units with a silent equipment or sensor issue" term="watchdog" />
        <Stat value={`${certified} of ${n}`} label={isToday ? 'Certified dry today' : 'Certified dry on this date'} term="certified" />
        <Stat value={avg == null ? 'n/a' : avg.toFixed(0)} label="Building health score, out of 100" term="score" ring>
          {avg != null && <span className="stat-icon"><ScoreRing value={avg} size={42} stroke={5} color={GRADE[gradeOf(avg)].color} /></span>}
        </Stat>
      </div>

      <div className="owner-grid">
        <section className="card map-card">
          <div className="card-head">
            <h2>Roof map</h2>
            <span className="faint">Tap a fan to see its structure</span>
          </div>
          <div className="map-wrap">
            <RoofMap structures={structures} selectedId={selected.id} onSelect={setSelectedId} />
          </div>
          <div className="legend">
            {Object.entries(GRADE).map(([name, g]) => <span key={name}><i style={{ background: g.color }} />{name}</span>)}
            <span><i className="legend-pulse" />Equipment fault</span>
          </div>
          <ReplayBar replay={replay} />
        </section>
        <StructurePanel s={selected} />
      </div>

      <div className="owner-grid lower">
        <section className="card">
          <h2>All structures <span className="faint num">on {shortDate(date)}</span></h2>
          <ul className="slist">
            {sorted.map(s => (
              <li key={s.id}>
                <button className="srow" aria-pressed={s.id === selected.id} onClick={() => setSelectedId(s.id)}>
                  <i style={{ background: GRADE[s.grade]?.color ?? 'var(--line)' }} />
                  <span className="srow-name">{s.label}<small>{s.type}</small></span>
                  <span className="srow-issues">{s.issues.length ? s.issues.map(i => checkName(i.check)).join(', ') : 'No issues so far'}</span>
                  <span className="srow-score num">{s.score == null ? '' : s.score.toFixed(0)}</span>
                </button>
              </li>
            ))}
          </ul>
        </section>
        <section className="card">
          <h2>Recent activity</h2>
          <p className="card-note">Follows the replay. Grey are old alarms, red and amber are real findings.</p>
          <ul className="feed">
            {recent.map((e, k) => (
              <li key={e.at + e.title} className={k === 0 ? 'is-new' : ''}>
                <i className={`dot-${e.tone}`} />
                <div>
                  <strong>{e.title}</strong>
                  <span className="faint num">{shortDate(e.at)}. {e.sub}</span>
                </div>
              </li>
            ))}
          </ul>
        </section>
      </div>
    </>
  )
}

export default function OwnerHome() {
  return <AppShell><Body /></AppShell>
}
