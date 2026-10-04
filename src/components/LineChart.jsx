import { useRef, useState } from 'react'
import { useIsPhone } from '../hooks.js'
import { shortDate } from '../format.js'

// Small dependency-free line chart for daily data. Hover or touch shows the value of that day.
// values: array of numbers (null = no data). dates: matching 'YYYY-MM-DD' strings.
// unit is shown in the hover label, axisUnit on the y axis (defaults to unit).
// refs: horizontal reference lines [{ value, label, color }]. marks: dates to highlight with dots.
const PAD = { l: 44, r: 14, t: 14, b: 26 }
const tick = v => (Math.abs(v) >= 10 ? Math.round(v).toLocaleString('en') : Number(v.toFixed(2)).toString())

export default function LineChart({
  dates, values, min, max, refs = [], marks = [], color = 'var(--slate)', area = false, unit = '', axisUnit = unit, digits = 1, label,
}) {
  const phone = useIsPhone()
  const svg = useRef(null)
  const [hover, setHover] = useState(null)
  const W = phone ? 400 : 760
  const H = phone ? 230 : 200
  const every = phone ? 3 : 2
  const present = values.filter(v => v != null)
  const lo = min ?? Math.min(...present)
  const hi = max ?? Math.max(...present)
  const span = hi - lo || 1
  const x = i => PAD.l + (i / Math.max(dates.length - 1, 1)) * (W - PAD.l - PAD.r)
  const y = v => PAD.t + (1 - (Math.min(Math.max(v, lo), hi) - lo) / span) * (H - PAD.t - PAD.b)
  const base = H - PAD.b

  // Line split into segments where values are missing
  const segs = []
  let cur = null
  values.forEach((v, i) => {
    if (v == null) { cur = null; return }
    if (!cur) segs.push(cur = [])
    cur.push([x(i), y(v)])
  })
  const pt = p => `${p[0].toFixed(1)} ${p[1].toFixed(1)}`
  const line = segs.map(s => 'M' + s.map(pt).join('L')).join(' ')
  const fill = area ? segs.map(s => `M${s[0][0].toFixed(1)} ${base}L${s.map(pt).join('L')}L${s[s.length - 1][0].toFixed(1)} ${base}Z`).join(' ') : null

  // One tick per month, labelled every second (desktop) or third (phone) month
  const months = []
  dates.forEach((dt, i) => { if (dt.endsWith('-01')) months.push(i) })
  const monthName = dt => new Date(dt + 'T00:00:00').toLocaleDateString('en-GB', { month: 'short' })
  const markIdx = marks.map(m => dates.indexOf(m)).filter(i => i >= 0)

  const onMove = e => {
    const r = svg.current.getBoundingClientRect()
    const px = ((e.clientX - r.left) / r.width) * W
    const i = Math.round(((px - PAD.l) / (W - PAD.l - PAD.r)) * (dates.length - 1))
    setHover(i >= 0 && i < dates.length ? i : null)
  }

  let tip = null
  if (hover != null) {
    const v = values[hover]
    const text = `${shortDate(dates[hover])}   ${v == null ? 'no data' : v.toFixed(digits) + unit}`
    const w = text.length * 6.3 + 16
    const hx = x(hover)
    const bx = hx + w + 10 > W - PAD.r ? hx - w - 8 : hx + 8
    tip = (
      <g className="chart-hover" pointerEvents="none">
        <line x1={hx} x2={hx} y1={PAD.t} y2={base} />
        {v != null && <circle cx={hx} cy={y(v)} r="4" fill={color} stroke="#fff" strokeWidth="2" />}
        <rect x={bx} y={PAD.t} width={w} height="22" rx="5" />
        <text x={bx + 8} y={PAD.t + 15} xmlSpace="preserve">{text}</text>
      </g>
    )
  }

  return (
    <svg ref={svg} className="chart" viewBox={`0 0 ${W} ${H}`} role="img" aria-label={label}
         onPointerMove={onMove} onPointerDown={onMove} onPointerLeave={() => setHover(null)}>
      {[lo, (lo + hi) / 2, hi].map(v => (
        <g key={v}>
          <line x1={PAD.l} x2={W - PAD.r} y1={y(v)} y2={y(v)} className="chart-grid" />
          <text x={PAD.l - 8} y={y(v) + 4} textAnchor="end" className="chart-axis">{tick(v)}{axisUnit}</text>
        </g>
      ))}
      {months.map((i, k) => (
        <g key={i}>
          <line x1={x(i)} x2={x(i)} y1={base} y2={base + 4} className="chart-grid" />
          {k % every === 0 && <text x={x(i)} y={H - 8} textAnchor="middle" className="chart-axis">{monthName(dates[i])}</text>}
        </g>
      ))}
      {refs.map(r => (
        <g key={r.label}>
          <line x1={PAD.l} x2={W - PAD.r} y1={y(r.value)} y2={y(r.value)} stroke={r.color} strokeDasharray="5 4" strokeWidth="1.2" />
          <text x={W - PAD.r - 4} y={y(r.value) - 5} textAnchor="end" className="chart-ref" fill={r.color}>{r.label}</text>
        </g>
      ))}
      {fill && <path d={fill} fill={color} opacity="0.09" />}
      <path d={line} fill="none" stroke={color} strokeWidth="1.8" strokeLinejoin="round" />
      {markIdx.map(i => values[i] != null && <circle key={i} cx={x(i)} cy={y(values[i])} r="3.2" fill="var(--brick)" />)}
      {tip}
    </svg>
  )
}
