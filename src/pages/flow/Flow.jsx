import { useData } from '../../data.jsx'
import { useWorkflow, ROUTING, FAN_ORDER, STAGES } from '../../workflow.jsx'
import AppShell from '../../components/AppShell.jsx'
import Icon from '../../components/Icon.jsx'
import './flow.css'

const ROLES = [
  { key: 'owner', label: 'Property owner' },
  { key: 'service', label: 'VILPE service' },
  { key: 'insurer', label: 'Insurer' },
  { key: 'passport', label: 'Passport (buyers)' },
]

// Who pays for what. A proposal, to be tested in the pilot.
const REVENUE = [
  { who: 'Property owner', what: 'DryProof subscription', price: '€19 per structure per month', gets: 'Watchdog, health score, smart alerts, certificate and passport' },
  { who: 'Insurer', what: 'Verified risk data', price: '€250 per insured building per year', gets: 'Portfolio risk grades, certificate checks, prevention tasks' },
  { who: 'VILPE service', what: 'Service visits', price: 'Normal service rates', gets: 'Every watchdog finding becomes a planned, billable work order' },
]

const PILOT = [
  { step: 'Month 1', title: 'Run the watchdog on existing installations', kpi: 'Silent faults found per 100 Sense units' },
  { step: 'Month 2', title: 'Issue certificates for 3 to 5 commercial roofs', kpi: 'Owners willing to pay, and at what price' },
  { step: 'Month 3', title: 'Test the portfolio view with one insurer', kpi: 'Premium terms offered for certified buildings' },
]

function Body() {
  const { data } = useData()
  const { orders, stageOf, personOf } = useWorkflow()
  const fan = orders.open.find(o => o.id === FAN_ORDER)
  const stage = fan ? stageOf(fan) : null
  const person = fan ? personOf(fan) : null
  const at = stage ? STAGES.indexOf(stage) : -1

  // One trigger, followed through every role. Step index 0 to 4.
  const lanes = [
    { role: 'DryProof', cells: ['Watchdog: 0 rpm for 48 h while it is above -7 °C outside', null, null, null, '30 clean days: certificate renewed'] },
    { role: 'VILPE service', cells: ['High priority work order created', `Technician assigned${person ? `: ${person.name}` : ''}`, 'On site, fixes the fan', 'Marks the order resolved', null] },
    { role: 'Property owner', cells: ['Alert: fan stopped, score drops', 'Sees who is coming', 'Sees technician on site', 'Notified: fixed', 'New certificate to share'] },
    { role: 'Insurer', cells: ['Certificate on hold, prevention task', 'Sees the task started', null, 'Prevention task closed', 'Verifies certificate, better terms'] },
    { role: 'Passport', cells: ['Logged as open', null, null, 'Logged as resolved', 'Updated, QR stays valid'] },
  ]
  const steps = ['Fault found', 'Assigned', 'On site', 'Resolved', '30 days later']
  const live = [0, at >= 1 ? 1 : -1, at >= 2 ? 2 : -1, at >= 3 ? 3 : -1].filter(i => i >= 0)

  return (
    <div className="flow">
      <div className="page-head">
        <div>
          <h1>How it works</h1>
          <p className="muted">From a sensor reading to the right person. Every trigger has an owner, and every step is visible to the people who need it.</p>
        </div>
      </div>

      {/* 1. The pipeline */}
      <section className="flow-sec">
        <h2><span className="flow-n">1</span>The flow</h2>
        <div className="pipe">
          <div className="pipe-col">
            <p className="pipe-k">Data in</p>
            <div className="pipe-card"><Icon name="fan" /><strong>VILPE Sense</strong><span>{data.summary.structures} roof fans with indoor and outdoor sensors. Temperature, humidity, fan speed every 2 hours.</span></div>
            <p className="pipe-foot num">{data.building.readings.toLocaleString('en')} readings so far</p>
          </div>
          <div className="pipe-col">
            <p className="pipe-k">DryProof engine</p>
            <div className="pipe-card"><Icon name="drop" /><strong>Mold index</strong><span>VTT mold growth model, daily</span></div>
            <div className="pipe-card"><Icon name="wrench" /><strong>Watchdog</strong><span>Stopped fans, silent or misplaced sensors</span></div>
            <div className="pipe-card"><Icon name="shield" /><strong>Score and certificate</strong><span>0 to 100, certified after 30 clean days</span></div>
          </div>
          <div className="pipe-col">
            <p className="pipe-k">Triggers</p>
            {['Equipment fault', 'Data trust issue', 'Mold index rising', 'Work order resolved', '30 clean days'].map(t => <div key={t} className="pipe-chip">{t}</div>)}
          </div>
          <div className="pipe-col">
            <p className="pipe-k">Who acts</p>
            <div className="pipe-card who"><strong>Property owner</strong><span>Roof map, value, certificate</span></div>
            <div className="pipe-card who"><strong>VILPE service</strong><span>Work orders, fleet map</span></div>
            <div className="pipe-card who"><strong>Insurer</strong><span>Portfolio, certificate check</span></div>
            <div className="pipe-card who"><strong>Buyers and tenants</strong><span>Public passport by QR code</span></div>
          </div>
        </div>
      </section>

      {/* 2. One trigger end to end */}
      <section className="flow-sec">
        <h2><span className="flow-n">2</span>One trigger, end to end: Green roof 2 fan stopped</h2>
        <p className="muted flow-note">
          Real finding from the data. {fan ? <>Live demo status: <strong>{stage}</strong>{person ? ` (${person.name})` : ''}. Change it in the VILPE service view and every row below follows.</> : null}
        </p>
        <div className="lanes-wrap">
          <table className="lanes">
            <thead>
              <tr><th scope="col" />{steps.map((s, i) => <th key={s} scope="col" className={live.includes(i) ? 'is-live' : ''}>{i + 1}. {s}</th>)}</tr>
            </thead>
            <tbody>
              {lanes.map(l => (
                <tr key={l.role}>
                  <th scope="row">{l.role}</th>
                  {l.cells.map((c, i) => <td key={i} className={c ? (live.includes(i) ? 'has is-live' : 'has') : ''}>{c && <span>{c}</span>}</td>)}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* 3. Routing table */}
      <section className="flow-sec">
        <h2><span className="flow-n">3</span>Who gets what</h2>
        <div className="route-wrap card">
          <table className="route">
            <thead>
              <tr><th scope="col">Trigger</th>{ROLES.map(r => <th key={r.key} scope="col">{r.label}</th>)}</tr>
            </thead>
            <tbody>
              {ROUTING.map(r => (
                <tr key={r.trigger} className={r.note ? 'is-muted' : ''}>
                  <th scope="row">{r.trigger}<small>{r.note ?? `From: ${r.from}`}</small></th>
                  {ROLES.map(x => <td key={x.key}>{r[x.key] ? <span className={`route-cell route-${x.key}`}>{r[x.key]}</span> : <span className="route-none">-</span>}</td>)}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <div className="flow-two">
        {/* 4. Business model */}
        <section className="flow-sec">
          <h2><span className="flow-n">4</span>Who pays for what</h2>
          <ul className="money">
            {REVENUE.map(r => (
              <li key={r.who} className="card">
                <p className="faint">{r.who}</p>
                <strong>{r.what}</strong>
                <span className="money-price num">{r.price}</span>
                <span className="muted">{r.gets}</span>
              </li>
            ))}
          </ul>
          <p className="faint">Prices are a proposal to test in the pilot. No new hardware: it runs on the Sense data and REST API VILPE already has.</p>
        </section>

        {/* 5. Pilot */}
        <section className="flow-sec">
          <h2><span className="flow-n">5</span>How VILPE can test it</h2>
          <ol className="pilot">
            {PILOT.map(p => (
              <li key={p.step}>
                <span className="pilot-step">{p.step}</span>
                <div><strong>{p.title}</strong><span>Measure: {p.kpi}</span></div>
              </li>
            ))}
          </ol>
        </section>
      </div>
    </div>
  )
}

export default function Flow() {
  return <AppShell><Body /></AppShell>
}
