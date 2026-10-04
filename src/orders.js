import { labelOf } from './roof.js'
import { WINDOW_DAYS } from './certification.js'
import { addDays } from './format.js'

// Work orders, built from the watchdog findings in data.json.
// One order per structure and check that was seen in the last 30 days. Older findings count as resolved earlier.

const mean = xs => (xs.length ? xs.reduce((a, b) => a + b, 0) / xs.length : null)

// Indoor humidity around the latest occurrence of a finding: 30 days before it started vs while it ran
function humidityAround(s, latest, lastDay) {
  const start = latest.start.slice(0, 10)
  const end = latest.end.slice(0, 10) < lastDay ? latest.end.slice(0, 10) : lastDay
  const rh = (from, to) => s.daily.filter(r => r.date >= from && r.date <= to && r.indoor_rh != null).map(r => r.indoor_rh)
  const before = mean(rh(addDays(start, -30), addDays(start, -1)))
  const during = mean(rh(start > addDays(end, -29) ? start : addDays(end, -29), end))
  const from = addDays(start, before == null ? 0 : -30)
  const to = addDays(start, 45) < lastDay ? addDays(start, 45) : lastDay
  const window = s.daily.filter(r => r.date >= from && r.date <= to)
  // 7-day average, so the small chart shows the trend instead of daily noise
  const raw = window.map(r => r.indoor_rh)
  const values = raw.map((_, i) => mean(raw.slice(Math.max(0, i - 6), i + 1).filter(v => v != null)))
  return { before, during, values, marker: before == null ? -1 : window.findIndex(r => r.date >= start) }
}

export function buildOrders(data) {
  const lastDay = data.building.period.to
  const since = addDays(lastDay, -(WINDOW_DAYS - 1))
  const open = []
  const earlier = []
  for (const s of data.structures) {
    const groups = {}
    for (const w of s.watchdog) {
      const g = (groups[w.check] ??= { id: `${s.id}-${w.check}`, s, label: labelOf(s), check: w.check, kind: w.kind, first: w.start, last: w.end, days: 0, count: 0, evidence: w.evidence, longest: 0, latest: w })
      g.last = w.end > g.last ? w.end : g.last
      g.days += w.days; g.count += 1
      if (w.days > g.longest) { g.longest = w.days; g.evidence = w.evidence }
      if (w.start > g.latest.start) g.latest = w
    }
    for (const g of Object.values(groups)) (g.last.slice(0, 10) >= since ? open : earlier).push(g)
  }
  open.sort((a, b) => (a.kind === b.kind ? b.days - a.days : a.kind === 'Equipment' ? -1 : 1))
  open.forEach((o, i) => { o.no = `WO-2026-${String(i + 1).padStart(3, '0')}`; o.h = humidityAround(o.s, o.latest, lastDay) })
  earlier.sort((a, b) => b.last.localeCompare(a.last))
  return { open, earlier }
}
