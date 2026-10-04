import { createContext, useContext, useEffect, useMemo, useState } from 'react'
import { useData } from './data.jsx'
import { buildOrders } from './orders.js'
import { certifyBuilding } from './certification.js'
import { checkName } from './explain.js'

// The workflow that links the three roles. One shared state for work orders, saved in the browser,
// so a technician assigned in the VILPE service view shows up in the owner and insurer views too
// (also live across two browser windows side by side).

export const STAGES = ['Alert', 'Assigned', 'In progress', 'Resolved']

// Demo service team (not real VILPE staff). Skills decide who is suggested for which fault.
export const TEAM = [
  { id: 'mv', name: 'Matti V.', skill: 'Fans and electrical', off: false },
  { id: 'ak', name: 'Aino K.', skill: 'Sensors and cloud', off: false },
  { id: 'jl', name: 'Juha L.', skill: 'Roofing and installation', off: false },
  { id: 'sp', name: 'Sanna P.', skill: 'Sensors and cloud', off: true },
]
const SKILL_FOR = {
  'Fan stopped': 'Fans and electrical',
  'Outdoor sensor reads too warm (sun or heat)': 'Roofing and installation',
}

// Demo starting point: the critical fan order is already being worked on, so every stage is visible
export const FAN_ORDER = 'viherkatto-2-Fan stopped'
const SEED = { stages: { [FAN_ORDER]: 'In progress' }, assigned: { [FAN_ORDER]: 'mv' }, log: [], seen: {} }
const KEY = 'structura-workflow-v1'

// Who gets what. This table drives the notifications and is shown on the "How it works" page.
export const ROUTING = [
  { trigger: 'Equipment fault: fan stopped or sensor silent', from: 'Watchdog', owner: 'Alert, score drops', service: 'High priority work order', insurer: 'Prevention task, certificate on hold', passport: 'Logged as open' },
  { trigger: 'Data trust issue: sensor in sun, sensors swapped', from: 'Watchdog', owner: 'Notice', service: 'Medium priority work order', insurer: null, passport: 'Logged as open' },
  { trigger: 'Mold index up 0.1 within 7 days (Watch)', from: 'Mold model', owner: 'Dashboard note', service: null, insurer: null, passport: null },
  { trigger: 'Mold index reaches 1.0 (Warning)', from: 'Mold model', owner: 'Alert', service: 'Inspection work order', insurer: null, passport: 'Logged' },
  { trigger: 'Mold index reaches 2.5 (Critical)', from: 'Mold model', owner: 'Urgent alert', service: 'Urgent visit', insurer: 'Informed', passport: 'Logged' },
  { trigger: 'Technician assigned or on site', from: 'VILPE service', owner: 'Status update', service: null, insurer: 'Task status', passport: null },
  { trigger: 'Work order resolved', from: 'VILPE service', owner: 'Fixed, re-certify after 30 clean days', service: null, insurer: 'Prevention task closed', passport: 'Logged as resolved' },
  { trigger: '30 clean days in a row', from: 'Certificate rules', owner: 'Certificate renewed', service: null, insurer: 'Verifiable certificate, better terms', passport: 'Updated, QR valid' },
  { trigger: 'Humid air above 90 % for 24 h (old alarm)', from: 'Old Sense default', owner: null, service: null, insurer: null, passport: null, note: 'No alert: humid air alone grows no mold' },
]

function load() {
  try { return { ...SEED, ...JSON.parse(localStorage.getItem(KEY)) } } catch { return SEED }
}

const Ctx = createContext(null)

export function WorkflowProvider({ children }) {
  const { data } = useData()
  const [state, setState] = useState(load)

  useEffect(() => { try { localStorage.setItem(KEY, JSON.stringify(state)) } catch { /* ignore */ } }, [state])
  // Another window changed the workflow: pick it up
  useEffect(() => {
    const on = e => { if (e.key === KEY) setState(load()) }
    window.addEventListener('storage', on)
    return () => window.removeEventListener('storage', on)
  }, [])

  const orders = useMemo(() => (data ? buildOrders(data) : { open: [], earlier: [] }), [data])
  const cert = useMemo(() => (data ? certifyBuilding(data) : null), [data])

  const stageOf = o => state.stages[o.id] ?? 'Alert'
  const personOf = o => TEAM.find(t => t.id === state.assigned[o.id])
  const busyWith = {}
  for (const o of orders.open) {
    const t = state.assigned[o.id]
    if (t && stageOf(o) !== 'Resolved') busyWith[t] = o
  }
  const free = TEAM.filter(t => !t.off && !busyWith[t.id])
  const suggest = o => (free.find(t => t.skill === (SKILL_FOR[o.check] ?? 'Sensors and cloud')) ?? free[0])?.id

  const record = (s, entry) => ({ ...s, log: [...s.log, { ...entry, at: Date.now() }] })
  const assign = (o, tech) => setState(s => {
    const next = { ...s, assigned: { ...s.assigned, [o.id]: tech } }
    if ((s.stages[o.id] ?? 'Alert') === 'Alert') next.stages = { ...s.stages, [o.id]: 'Assigned' }
    return record(next, { type: 'assigned', order: o.id, tech })
  })
  const advance = o => setState(s => {
    const stage = STAGES[Math.min(STAGES.indexOf(s.stages[o.id] ?? 'Alert') + 1, 3)]
    return record({ ...s, stages: { ...s.stages, [o.id]: stage } }, { type: stage === 'Resolved' ? 'resolved' : 'started', order: o.id, tech: s.assigned[o.id] })
  })
  const reset = () => setState(s => ({ ...SEED, seen: s.seen }))
  const touched = JSON.stringify([state.stages, state.assigned]) !== JSON.stringify([SEED.stages, SEED.assigned])

  // Notifications for one role, newest first, following the ROUTING table
  const notificationsFor = role => {
    if (!data) return []
    const out = []
    const byId = Object.fromEntries(orders.open.map(o => [o.id, o]))
    for (const e of [...state.log].reverse()) {
      const o = byId[e.order]
      const who = TEAM.find(t => t.id === e.tech)?.name ?? 'A technician'
      if (!o) continue
      const id = `${e.type}-${e.order}-${e.at}`
      if (e.type === 'assigned') {
        if (role === 'owner') out.push({ id, tone: 'info', title: `${who} assigned to ${o.label}`, text: `${o.no}: ${checkName(o.check)}`, to: `/owner/structure/${o.s.id}` })
        if (role === 'insurer' && o.kind === 'Equipment') out.push({ id, tone: 'info', title: `Prevention task started: ${o.label}`, text: `${who} assigned by VILPE service`, to: '/insurer' })
      }
      if (e.type === 'started' && role === 'owner') out.push({ id, tone: 'info', title: `Technician on site: ${o.label}`, text: `${who} is working on ${checkName(o.check).toLowerCase()}`, to: `/owner/structure/${o.s.id}` })
      if (e.type === 'resolved') {
        if (role === 'owner') out.push({ id, tone: 'ok', title: `${o.label} fixed`, text: 'Re-certification after 30 clean days', to: `/owner/structure/${o.s.id}` })
        if (role === 'insurer' && o.kind === 'Equipment') out.push({ id, tone: 'ok', title: `Prevention task closed: ${o.label}`, text: `${checkName(o.check)} resolved by VILPE service`, to: '/insurer' })
      }
    }
    // Findings from the data (the watchdog found them before any action was taken)
    for (const o of orders.open) {
      const high = o.kind === 'Equipment'
      const id = `found-${o.id}`
      if (role === 'service') out.push({ id, tone: high ? 'bad' : 'warn', title: `New work order ${o.no}: ${o.label}`, text: `${checkName(o.check)}, ${high ? 'high' : 'medium'} priority`, to: '/service' })
      if (role === 'owner') out.push({ id, tone: high ? 'bad' : 'warn', title: `${checkName(o.check)} on ${o.label}`, text: 'VILPE service notified automatically', to: `/owner/structure/${o.s.id}` })
      if (role === 'insurer' && high) out.push({ id, tone: 'bad', title: `Certificate on hold: ${o.label}`, text: `${checkName(o.check)}. Prevention task sent to VILPE service`, to: '/insurer' })
    }
    if (cert && (role === 'owner' || role === 'insurer')) {
      out.push({ id: `cert-${cert.certId}`, tone: 'ok', title: `Certificate ${cert.certId} issued`, text: `${cert.certified.length} of ${cert.rows.length} structures certified dry`, to: role === 'owner' ? '/owner/certificate' : '/insurer' })
    }
    const seen = new Set(state.seen[role] ?? [])
    return out.map(n => ({ ...n, unread: !seen.has(n.id) }))
  }
  const markSeen = role => setState(s => ({ ...s, seen: { ...s.seen, [role]: notificationsFor(role).map(n => n.id) } }))

  // Work orders for one structure, so owner and insurer can show their status
  const ordersFor = structureId => orders.open.filter(o => o.s.id === structureId).map(o => ({ o, stage: stageOf(o), person: personOf(o) }))

  const value = { orders, stageOf, personOf, busyWith, free, suggest, assign, advance, reset, touched, notificationsFor, markSeen, ordersFor }
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>
}

export function useWorkflow() {
  return useContext(Ctx)
}
