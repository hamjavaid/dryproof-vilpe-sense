import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { useData } from '../../data.jsx'
import { FAN_POSITIONS } from '../../roof.js'
import { LIVE_SITE, mapsUrl } from '../../sites.js'
import { useWorkflow, STAGES, TEAM } from '../../workflow.jsx'
import { WINDOW_DAYS } from '../../certification.js'
import { shortDate } from '../../format.js'
import { actionFor, checkName } from '../../explain.js'
import AppShell from '../../components/AppShell.jsx'
import TechAvatar from '../../components/TechAvatar.jsx'
import Icon from '../../components/Icon.jsx'
import RoofLocator from '../../components/RoofLocator.jsx'
import './service.css'

const NEXT_LABEL = { Assigned: 'Start work on site', 'In progress': 'Mark resolved' }

const TABS = [
  { id: 'open', label: 'All open' },
  { id: 'unassigned', label: 'Unassigned' },
  { id: 'critical', label: 'Critical' },
  { id: 'resolved', label: 'Resolved' },
]

// Humidity line with the alert start marked. Used small in the row and large when the row is open.
function RhChart({ h, big }) {
  const W = big ? 400 : 150, H = big ? 96 : 36, lo = 40, hi = 100
  const n = h.values.length
  const x = i => (i / Math.max(n - 1, 1)) * W
  const y = v => 3 + (1 - (Math.min(Math.max(v, lo), hi) - lo) / (hi - lo)) * (H - 6)
  const segs = []
  let cur = null
  h.values.forEach((v, i) => { if (v == null) { cur = null; return } if (!cur) segs.push(cur = []); cur.push([x(i), y(v)]) })
  const pt = p => `${p[0].toFixed(1)} ${p[1].toFixed(1)}`
  const line = segs.map(s => 'M' + s.map(pt).join('L')).join(' ')
  const area = segs.map(s => `M${s[0][0].toFixed(1)} ${H}L${s.map(pt).join('L')}L${s[s.length - 1][0].toFixed(1)} ${H}Z`).join(' ')
  return (
    <svg className={`rh-chart${big ? ' is-big' : ''}`} viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none"
         role="img" aria-label="Indoor relative humidity around the alert">
      {big && <line x1="0" x2={W} y1={y(90)} y2={y(90)} className="rh-ref" />}
      <path d={area} className="rh-area" />
      <path d={line} className="rh-line" vectorEffect="non-scaling-stroke" />
      {h.marker >= 0 && <line x1={x(h.marker)} x2={x(h.marker)} y1="0" y2={H} className="rh-marker" vectorEffect="non-scaling-stroke" />}
    </svg>
  )
}

// Four bars: done (green), current (amber), to do (grey)
function StageBars({ stage }) {
  const at = STAGES.indexOf(stage)
  const resolved = stage === 'Resolved'
  return (
    <div className="stage">
      <div className="stage-bars" aria-hidden="true">
        {STAGES.map((s, i) => <i key={s} className={i < at || resolved ? 'done' : i === at ? 'now' : ''} />)}
      </div>
      <span className="stage-text"><strong>{stage}</strong> · {at + 1} of 4</span>
    </div>
  )
}

// Vertical timeline inside an open row
function Progress({ o, stage, person }) {
  const at = STAGES.indexOf(stage)
  const resolved = stage === 'Resolved'
  const sub = [
    `First seen ${shortDate(o.first)}`,
    person ? `${person.name}, ${person.skill.toLowerCase()}` : 'Pending',
    at >= 2 ? 'Technician on site' : 'Pending',
    resolved ? 'Re-certify after 30 clean days' : 'Pending',
  ]
  return (
    <ol className="progress">
      {STAGES.map((s, i) => (
        <li key={s} className={i < at || resolved ? 'done' : i === at ? 'now' : ''}>
          <span className="progress-dot">{(i < at || resolved) && <Icon name="check" size={12} strokeWidth={3} />}</span>
          <div><strong>{s}</strong><span>{sub[i]}</span></div>
        </li>
      ))}
    </ol>
  )
}

// Assignee cell: shows who has the order, and opens a menu to pick a technician
function Assignee({ o, person, suggested, busyWith, onPick }) {
  const [open, setOpen] = useState(false)
  const box = useRef(null)
  useEffect(() => {
    if (!open) return
    const outside = e => { if (!box.current?.contains(e.target)) setOpen(false) }
    const esc = e => { if (e.key === 'Escape') setOpen(false) }
    document.addEventListener('pointerdown', outside)
    document.addEventListener('keydown', esc)
    return () => { document.removeEventListener('pointerdown', outside); document.removeEventListener('keydown', esc) }
  }, [open])
  const suggestedName = TEAM.find(t => t.id === suggested)?.name

  return (
    <div className="assignee" ref={box} onClick={e => e.stopPropagation()}>
      <button type="button" className={`assignee-btn${person ? '' : ' is-empty'}`} aria-haspopup="listbox" aria-expanded={open}
              onClick={() => setOpen(v => !v)}>
        {person
          ? <TechAvatar id={person.id} size={34} title={person.name} />
          : <span className="assignee-plus">+</span>}
        <span className="assignee-text">
          <strong>{person ? person.name : 'Assign'}</strong>
          <span>{person ? person.skill : suggestedName ? `Suggested: ${suggestedName}` : 'Everyone is busy'}</span>
        </span>
        <svg className="assignee-chev" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true"><path d="M6 9l6 6 6-6" /></svg>
      </button>
      {open && (
        <ul className="assignee-menu" role="listbox" aria-label={`Technician for ${o.no}`}>
          {TEAM.map(t => {
            const job = busyWith[t.id]
            const taken = t.off || (job && job.id !== o.id)
            return (
              <li key={t.id}>
                <button type="button" role="option" aria-selected={person?.id === t.id} disabled={taken}
                        onClick={() => { onPick(t.id); setOpen(false) }}>
                  <TechAvatar id={t.id} size={30} title={t.name} />
                  <span className="assignee-text">
                    <strong>{t.name}{t.id === suggested && <em>Suggested</em>}</strong>
                    <span>{t.off ? 'Off today' : job && job.id !== o.id ? `On ${job.no}` : t.skill}</span>
                  </span>
                </button>
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}

function Body() {
  const { data } = useData()
  const { building } = data
  const directions = mapsUrl(building.name, building.city)
  const { orders: all, stageOf, personOf, busyWith, suggest, assign, advance, reset, touched } = useWorkflow()
  const [tab, setTab] = useState('open')
  const [expanded, setExpanded] = useState(null)
  const orders = all.open
  const earlier = all.earlier
  const pick = (o, t) => assign(o, t)
  const assigned = Object.fromEntries(orders.map(o => [o.id, personOf(o)?.id]))

  const open = orders.filter(o => stageOf(o) !== 'Resolved')
  const lists = {
    open,
    unassigned: open.filter(o => !assigned[o.id]),
    critical: open.filter(o => o.kind === 'Equipment'),
    resolved: orders.filter(o => stageOf(o) === 'Resolved'),
  }
  const counts = { ...Object.fromEntries(Object.entries(lists).map(([k, v]) => [k, v.length])), resolved: lists.resolved.length + earlier.length }
  const shown = lists[tab]
  const onDuty = TEAM.filter(t => !t.off)

  return (
    <div className="wo-page">
      <div className="wo-head">
        <div>
          <p className="wo-kicker">Service · Moisture alerts</p>
          <h1>Work orders</h1>
          <p className="muted wo-intro">Faults the old alarms never showed. Click a row to see the diagnosis.</p>
        </div>
        <div className="duty">
          <div>
            <span className="duty-shift"><i />Demo team today</span>
            <strong>{onDuty.length} technicians on duty</strong>
          </div>
          <div className="duty-faces">
            {TEAM.map(t => <span key={t.id} className={t.off ? 'is-off' : ''} title={`${t.name}${t.off ? ', off today' : busyWith[t.id] ? `, on ${busyWith[t.id].no}` : ', free'}`}><TechAvatar id={t.id} size={34} title={t.name} /></span>)}
          </div>
        </div>
      </div>

      <div className="wo-tabs" role="tablist" aria-label="Filter work orders">
        {TABS.map(t => (
          <button key={t.id} role="tab" aria-selected={tab === t.id} className={tab === t.id ? 'on' : ''} onClick={() => setTab(t.id)}>
            {t.label}<span className="num">{counts[t.id]}</span>
          </button>
        ))}
        {touched && <button className="btn btn-sm wo-reset" onClick={() => { reset(); setExpanded(null) }}>Reset demo</button>}
      </div>

      <div className="wo-cols" aria-hidden="true">
        <span>Location and issue</span><span>Stage</span><span>Humidity inside</span><span>Assignee</span>
      </div>

      {shown.length === 0 && tab !== 'resolved' && (
        <p className="wo-empty"><Icon name="check" size={18} />Nothing here. {tab === 'critical' ? 'All critical work orders are resolved.' : 'Every open work order has a technician.'}</p>
      )}

      {shown.length > 0 && (
        <div className="wo-site">
          <span className="wo-site-pin"><Icon name="pin" size={18} /></span>
          <div className="wo-site-text">
            <strong>{building.name}, {building.city}</strong>
            <span>{LIVE_SITE.customer} · {data.structures.length} Sense units · {shown.length} {shown.length === 1 ? 'order' : 'orders'} in this list</span>
          </div>
          <a className="btn btn-sm" href={directions} target="_blank" rel="noreferrer"><Icon name="pin" size={15} />Directions</a>
          <Link className="btn btn-sm" to="/service/fleet">All sites</Link>
        </div>
      )}

      <ul className="wo-rows">
        {shown.map(o => {
          const stage = stageOf(o)
          const person = personOf(o)
          const critical = o.kind === 'Equipment'
          const isOpen = expanded === o.id
          const isNew = stage === 'Alert' && !person
          const pct = v => `${v.toFixed(0)}%`
          return (
            <li key={o.id} className={`wo-row ${critical ? 'is-critical' : 'is-medium'}${isOpen ? ' is-open' : ''}${stage === 'Resolved' ? ' is-done' : ''}`}>
              <div className="wo-line" onClick={() => setExpanded(isOpen ? null : o.id)}>
                <div className="wo-where">
                  <p className="wo-no"><span>{o.no}</span>{isNew && <em>New</em>}<span className="wo-loc"><Icon name="pin" size={13} />{building.name}, {building.city}</span></p>
                  <h3>
                    <button type="button" aria-expanded={isOpen} onClick={e => { e.stopPropagation(); setExpanded(isOpen ? null : o.id) }}>
                      {o.label} · {o.s.type}
                    </button>
                  </h3>
                  <p className="wo-meta">
                    <span className="wo-issue"><i />{checkName(o.check)}</span>
                    <span className="num">{Math.round(o.days)} days in total</span>
                  </p>
                </div>
                <StageBars stage={stage} />
                <div className="wo-rh">
                  {o.h.before == null
                    ? <span className="faint">No prior reading</span>
                    : <>
                        <RhChart h={o.h} />
                        <span className="wo-rh-vals num">{pct(o.h.before)} <span aria-label="to">{'→'}</span> <strong>{pct(o.h.during)}</strong> RH</span>
                      </>}
                </div>
                <Assignee o={o} person={person} suggested={suggest(o)} busyWith={busyWith} onPick={t => pick(o, t)} />
              </div>

              {isOpen && (
                <div className="wo-detail">
                  <div className="wo-diag">
                    <p className="wo-label">Diagnosis</p>
                    <p className="wo-diag-text">{o.evidence.charAt(0).toUpperCase() + o.evidence.slice(1)}.</p>
                    <div className="wo-action">
                      <p className="wo-label">Recommended action</p>
                      <p>{actionFor(o.check)}</p>
                    </div>
                    <div className="wo-where-roof">
                      <p className="wo-label">Where to go</p>
                      <RoofLocator name={o.s.name} tone={critical ? 'bad' : 'warn'} />
                      <p className="faint num">{o.s.type} · control unit {FAN_POSITIONS[o.s.name]?.serial ?? o.s.serial}</p>
                      <a className="wo-dir" href={directions} target="_blank" rel="noreferrer"><Icon name="pin" size={14} />Directions to {building.name}, {building.city}</a>
                    </div>
                  </div>

                  <div className="wo-rh-big">
                    <p className="wo-label">Humidity inside, 7-day average</p>
                    <RhChart h={o.h} big />
                    <div className="wo-rh-legend num">
                      {o.h.before != null && <div><strong>{pct(o.h.before)}</strong><span>30 days before alert</span></div>}
                      <div className="during"><strong>{o.h.during == null ? 'n/a' : pct(o.h.during)}</strong><span>During alert</span></div>
                    </div>
                  </div>

                  <div className="wo-prog">
                    <p className="wo-label">Progress</p>
                    <Progress o={o} stage={stage} person={person} />
                    {(stage === 'Assigned' || stage === 'In progress') && (
                      <button className="btn btn-primary btn-sm" onClick={() => advance(o)}>{NEXT_LABEL[stage]}</button>
                    )}
                    {stage === 'Alert' && <p className="faint">Assign a technician to start.</p>}
                    <p className="wo-route"><Icon name="arrowRight" size={14} />Each step is sent to the owner{o.kind === 'Equipment' ? ' and the insurer' : ''}.</p>
                  </div>
                </div>
              )}
            </li>
          )
        })}
      </ul>

      {tab === 'resolved' && (
        <section className="wo-earlier">
          <p className="wo-label">Resolved earlier, before the last {WINDOW_DAYS} days</p>
          <ul>
            {earlier.map(o => (
              <li key={o.id}>
                <span className="wo-done-dot"><Icon name="check" size={12} strokeWidth={3} /></span>
                <span><strong>{o.label}</strong> · {checkName(o.check)}</span>
                <span className="faint num">{shortDate(o.first)} to {shortDate(o.last)}, {Math.round(o.days)} days</span>
              </li>
            ))}
          </ul>
        </section>
      )}

      <p className="faint wo-foot">Assignments are for the demo. Diagnosis, dates and humidity come from the Sense data.</p>
    </div>
  )
}

export default function Service() {
  return <AppShell><Body /></AppShell>
}
