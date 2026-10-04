import { Link, useParams } from 'react-router-dom'
import { useData, GRADE } from '../../data.jsx'
import { FAN_POSITIONS, labelOf } from '../../roof.js'
import { addDays, shortDate } from '../../format.js'
import { actionFor, checkName, verdict } from '../../explain.js'
import AppShell from '../../components/AppShell.jsx'
import LineChart from '../../components/LineChart.jsx'
import InfoTip from '../../components/InfoTip.jsx'
import Icon from '../../components/Icon.jsx'
import ServiceStatus from '../../components/ServiceStatus.jsx'
import './detail.css'

function ChartCard({ title, term, note, children }) {
  return (
    <section className="card chart-card">
      <h2>{title}{term && <InfoTip term={term} />}</h2>
      {note && <p className="card-note">{note}</p>}
      {children}
    </section>
  )
}

function Body() {
  const { structureId } = useParams()
  const { data } = useData()
  const s = data.structures.find(x => x.id === structureId)
  if (!s) {
    return (
      <>
        <p>This structure doesn't exist.</p>
        <Link className="btn" to="/owner" style={{ marginTop: 12 }}>Back to all structures</Link>
      </>
    )
  }

  const label = labelOf(s)
  const g = GRADE[s.latest.grade]
  const dates = s.daily.map(r => r.date)
  const alarmDays = s.old_alarms.map(a => a.alarm_fired.slice(0, 10))
  const peakMold = Math.max(...s.daily.map(r => r.mold_index))
  // Building outdoor temperature per day = median of all 7 outdoor sensors (one sensor alone can be wrong)
  const temps = {}
  for (const x of data.structures) for (const r of x.daily) if (r.outdoor_temp != null) (temps[r.date] ??= []).push(r.outdoor_temp)
  const median = a => { const b = [...a].sort((p, q) => p - q); const m = b.length >> 1; return b.length % 2 ? b[m] : (b[m - 1] + b[m]) / 2 }
  const fanStoppedWarm = s.daily.filter(r => r.fan_rpm === 0 && temps[r.date] && median(temps[r.date]) > 0).length

  // Same plain-language verdict as the roof map, for today
  const openSince = addDays(data.building.period.to, -29)
  const say = verdict({
    score: s.latest.score, grade: s.latest.grade,
    issues: s.watchdog.map(w => ({ check: w.check, open: w.end.slice(0, 10) >= openSince })),
  })

  // Group watchdog events by check, so 9 short fan stops read as one finding
  const groups = Object.values(s.watchdog.reduce((acc, w) => {
    const grp = acc[w.check] ?? { check: w.check, kind: w.kind, events: [], days: 0 }
    grp.events.push(w); grp.days += w.days
    acc[w.check] = grp
    return acc
  }, {}))

  return (
    <div className="detail">
      <Link className="back" to="/owner"><Icon name="arrowLeft" size={16} />All structures</Link>

      <header className="detail-head">
        <div>
          <p className="faint">{s.type} · Control unit {FAN_POSITIONS[s.name]?.serial ?? s.serial} · {s.material}</p>
          <h1>{label}</h1>
        </div>
        <div className="detail-score">
          <span className={`pill ${g.pill}`}>{s.latest.grade}</span>
          <span className="num big" style={{ color: g.color }}>{s.latest.score.toFixed(1)}<small> / 100</small></span>
        </div>
      </header>

      <p className={`say say-${say.tone} detail-say`}><Icon name="info" size={16} />{say.text}</p>
      <div className="detail-svc"><ServiceStatus structureId={s.id} /></div>

      <div className="stats">
        <div className="stat"><span className="stat-value num">{s.old_alarms.length}</span><span className="stat-label">Old alarms in 16 months<InfoTip term="oldAlarm" /></span></div>
        <div className="stat"><span className="stat-value num">{peakMold.toFixed(2)}</span><span className="stat-label">Highest mold index. Growth starts at 1.0<InfoTip term="mold" /></span></div>
        <div className="stat"><span className="stat-value num" style={s.equipment_uptime_pct < 90 ? { color: 'var(--brick)' } : undefined}>{s.equipment_uptime_pct}%</span><span className="stat-label">Equipment uptime<InfoTip term="uptime" /></span></div>
        <div className="stat"><span className="stat-value num" style={fanStoppedWarm > 0 ? { color: 'var(--brick)' } : undefined}>{fanStoppedWarm}</span><span className="stat-label">Days fan stopped above 0 °C outside</span></div>
      </div>

      <div className="charts">
        <ChartCard title="Health score" term="score" note="Daily score. Above the green line counts as certified dry. Hover the line to see any day.">
          <LineChart label="Health score over time" dates={dates} values={s.daily.map(r => r.score)} min={0} max={100} area
            refs={[{ value: 85, label: 'Certified dry 85', color: 'var(--moss)' }, { value: 50, label: 'At risk below 50', color: 'var(--brick)' }]} />
        </ChartCard>

        <ChartCard title="Mold index" term="mold"
          note={`Our engine with the VTT mold growth model. Today ours reads ${s.latest.mold_index_ours.toFixed(4)}, VILPE's own index ${s.latest.mold_index_vilpe.toFixed(4)}.`}>
          <LineChart label="Mold index over time" dates={dates} values={s.daily.map(r => r.mold_index)} min={0} max={3} digits={3}
            color="var(--moss)" area
            refs={[{ value: 2.5, label: 'VILPE alarm 2.5', color: 'var(--brick)' }, { value: 1, label: 'First growth 1.0', color: 'var(--amber)' }]} />
        </ChartCard>

        <ChartCard title="Humidity inside the structure" term="oldAlarm"
          note={`Daily average. Red dots are the ${s.old_alarms.length} days the old alarm fired (above 90 % for about 24 hours).`}>
          <LineChart label="Indoor humidity over time" dates={dates} values={s.daily.map(r => r.indoor_rh)} min={40} max={100} unit="%"
            marks={alarmDays} refs={[{ value: 90, label: 'Old alarm 90%', color: 'var(--brick)' }]} />
        </ChartCard>

        <ChartCard title="Fan speed, rpm" note="Daily average. With default settings the fan runs whenever it is warmer than -7 °C outside.">
          <LineChart label="Fan speed over time" dates={dates} values={s.daily.map(r => r.fan_rpm)} min={0} digits={0} unit=" rpm" axisUnit="" color="var(--ink-2)" />
        </ChartCard>
      </div>

      <section className="card">
        <h2>What the watchdog found<InfoTip term="watchdog" /></h2>
        {groups.length === 0 ? <p className="muted">No issues.</p> : (
          <ul className="events">
            {groups.map(grp => (
              <li key={grp.check}>
                <details className="event-group">
                  <summary>
                    <div className="event-head">
                      <strong>{checkName(grp.check)}</strong>
                      <span className={`pill ${grp.kind === 'Equipment' ? 'pill-bad' : 'pill-warn'}`}>{grp.kind}</span>
                    </div>
                    <p className="muted">{grp.events.reduce((a, b) => (b.days > a.days ? b : a)).evidence}</p>
                    <p className="faint num">
                      {grp.events.length === 1 ? 'Once' : `${grp.events.length} times`}, {Math.round(grp.days)} days in total,{' '}
                      {shortDate(grp.events[0].start)} to {shortDate(grp.events[grp.events.length - 1].end)}.
                    </p>
                    <p className="action"><Icon name="wrench" size={15} /><span><strong>What to do:</strong> {actionFor(grp.check)}</span></p>
                  </summary>
                  <ul className="event-sub">
                    {grp.events.map((w, i) => (
                      <li key={i} className="num">{shortDate(w.start)} to {shortDate(w.end)}, {Math.round(w.days)} days. {w.evidence}</li>
                    ))}
                  </ul>
                </details>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  )
}

export default function StructureDetail() {
  return <AppShell><Body /></AppShell>
}
