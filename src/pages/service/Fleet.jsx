import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import { useData } from '../../data.jsx'
import { useWorkflow } from '../../workflow.jsx'
import { LIVE_SITE, mapsUrl } from '../../sites.js'
import AppShell from '../../components/AppShell.jsx'
import Icon from '../../components/Icon.jsx'
import './fleet.css'

// Example customer sites that show how the fleet view scales. Not real installations, marked on screen.
const EXAMPLES = [
  { id: 'ex-tampere', name: 'Logistics hub', customer: 'Example customer A', city: 'Tampere', lat: 61.4978, lng: 23.761, units: 12, open: 3, critical: 1 },
  { id: 'ex-espoo', name: 'Office building', customer: 'Example customer B', city: 'Espoo', lat: 60.2055, lng: 24.6559, units: 6, open: 1, critical: 0 },
  { id: 'ex-turku', name: 'Production hall', customer: 'Example customer C', city: 'Turku', lat: 60.4518, lng: 22.2666, units: 9, open: 0, critical: 0 },
  { id: 'ex-vaasa', name: 'School', customer: 'Example customer D', city: 'Vaasa', lat: 63.0951, lng: 21.6165, units: 4, open: 2, critical: 0 },
  { id: 'ex-oulu', name: 'Row houses, crawl spaces', customer: 'Example customer E', city: 'Oulu', lat: 65.0121, lng: 25.4651, units: 8, open: 1, critical: 1 },
]
const toneOf = s => (s.critical > 0 ? 'bad' : s.open > 0 ? 'warn' : 'ok')
const COLOR = { bad: '#b0412e', warn: '#cc8a2c', ok: '#4f7a3a' }

function Body() {
  const { data } = useData()
  const { orders, stageOf } = useWorkflow()
  const mapEl = useRef(null)
  const map = useRef(null)
  const markers = useRef({})
  const [selected, setSelected] = useState(data.building.id)

  // The real building, with live work order counts from the workflow
  const open = orders.open.filter(o => stageOf(o) !== 'Resolved')
  const live = {
    id: data.building.id, name: data.building.name, customer: LIVE_SITE.customer, city: data.building.city,
    lat: LIVE_SITE.lat, lng: LIVE_SITE.lng, units: data.structures.length, open: open.length,
    critical: open.filter(o => o.kind === 'Equipment').length, live: true,
  }
  const sites = [live, ...EXAMPLES]
  const totals = sites.reduce((t, s) => ({ units: t.units + s.units, open: t.open + s.open, critical: t.critical + s.critical }), { units: 0, open: 0, critical: 0 })

  useEffect(() => {
    map.current = L.map(mapEl.current, { scrollWheelZoom: false, zoomControl: true }).setView([62.4, 24.2], 5)
    L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; OpenStreetMap contributors', maxZoom: 18,
    }).addTo(map.current)
    return () => { map.current.remove(); map.current = null; markers.current = {} }
  }, [])

  // Draw or refresh the site markers
  useEffect(() => {
    if (!map.current) return
    for (const m of Object.values(markers.current)) m.remove()
    markers.current = {}
    for (const s of sites) {
      const tone = toneOf(s)
      const m = L.circleMarker([s.lat, s.lng], {
        radius: s.id === selected ? 13 : 9, color: '#fff', weight: 3, fillColor: COLOR[tone], fillOpacity: 1,
      }).addTo(map.current)
      m.bindTooltip(`${s.name}, ${s.city}${s.live ? '' : ' (example)'}: ${s.open} open`, { direction: 'top', offset: [0, -8] })
      m.on('click', () => setSelected(s.id))
      markers.current[s.id] = m
    }
  })

  const pick = s => {
    setSelected(s.id)
    map.current?.flyTo([s.lat, s.lng], s.live ? 9 : 7, { duration: 0.6 })
  }
  const sel = sites.find(s => s.id === selected) ?? live

  return (
    <div className="fleet">
      <div className="page-head">
        <div>
          <p className="wo-kicker">Service · All sites</p>
          <h1>Fleet map</h1>
          <p className="muted">Every Sense installation VILPE service looks after, coloured by its most urgent open work order.</p>
        </div>
      </div>

      <div className="stats">
        <div className="stat"><span className="stat-value num">{sites.length}</span><span className="stat-label">Sites, 1 live and {EXAMPLES.length} examples</span></div>
        <div className="stat"><span className="stat-value num">{totals.units}</span><span className="stat-label">Sense units monitored</span></div>
        <div className="stat"><span className="stat-value num">{totals.open}</span><span className="stat-label">Open work orders</span></div>
        <div className="stat"><span className="stat-value num" style={{ color: 'var(--brick)' }}>{totals.critical}</span><span className="stat-label">Critical, equipment faults</span></div>
      </div>

      <div className="fleet-grid">
        <section className="card fleet-map-card">
          <div ref={mapEl} className="fleet-map" role="region" aria-label="Map of sites in Finland" />
          <div className="legend fleet-legend">
            <span><i style={{ background: COLOR.bad }} />Critical open</span>
            <span><i style={{ background: COLOR.warn }} />Open</span>
            <span><i style={{ background: COLOR.ok }} />All clear</span>
          </div>
        </section>

        <section className="card fleet-list">
          <h2>Sites</h2>
          <ul>
            {sites.map(s => (
              <li key={s.id}>
                <button className={s.id === selected ? 'on' : ''} onClick={() => pick(s)}>
                  <i style={{ background: COLOR[toneOf(s)] }} />
                  <span className="fl-name">
                    <strong>{s.name}</strong>
                    <span>{s.city} · {s.customer}</span>
                  </span>
                  {s.live ? <span className="pill pill-ok">Live data</span> : <span className="pill pill-muted">Example</span>}
                  <span className="fl-open num">{s.open}<small>open</small></span>
                </button>
              </li>
            ))}
          </ul>
          <div className="fleet-sel">
            <p className="faint">{sel.live ? 'Selected site' : 'Selected example site'}</p>
            <strong>{sel.name}, {sel.city}</strong>
            <span className="muted num">{sel.units} Sense units · {sel.open} open · {sel.critical} critical</span>
            {sel.live
              ? (
                <div className="fleet-sel-actions">
                  <Link className="btn btn-primary btn-sm" to="/service">Open work orders <Icon name="arrowRight" size={15} /></Link>
                  <a className="btn btn-sm" href={mapsUrl(sel.name, sel.city)} target="_blank" rel="noreferrer"><Icon name="pin" size={15} />Directions</a>
                </div>
              )
              : <p className="faint">Example data only. In production each site opens its own work orders.</p>}
          </div>
        </section>
      </div>
      <p className="faint">The Vantaa pin is placed at city level. Example sites show how the view scales to many customers.</p>
    </div>
  )
}

export default function Fleet() {
  return <AppShell><Body /></AppShell>
}
