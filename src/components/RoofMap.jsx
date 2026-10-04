import { ROOF_VIEWBOX, ROOF_SHAPES, FAN_POSITIONS } from '../roof.js'
import { GRADE } from '../data.jsx'
import { useIsPhone } from '../hooks.js'

const { lowRoof, flatRoof, greenRoof } = ROOF_SHAPES

// The three roof parts, drawn several times: fill, outer wall line, inner wall line (gives a double wall)
function Shapes({ className }) {
  return (
    <g className={className}>
      <rect className="rm-low" x={lowRoof.x} y={lowRoof.y} width={lowRoof.w} height={lowRoof.h} />
      <rect className="rm-flat" x={flatRoof.x} y={flatRoof.y} width={flatRoof.w} height={flatRoof.h} />
      <polygon className="rm-green" points={greenRoof.points} />
    </g>
  )
}

// Name and score of the selected fan in a small label box, above the dot (or beside it near the top edge)
function Callout({ pos, s, color }) {
  const name = pos.label
  const score = s.score == null ? 'no data' : s.score.toFixed(0)
  const w = Math.max(name.length, 6) * 6.4 + 22
  const h = 34
  const above = pos.y >= 52
  const bx = above ? pos.x - w / 2 : pos.x - 24 - w
  const by = above ? pos.y - 24 - h : pos.y - h / 2
  return (
    <g className="rm-callout" pointerEvents="none">
      <rect x={bx} y={by} width={w} height={h} rx="6" />
      {above
        ? <path d={`M${pos.x - 5} ${by + h} L${pos.x} ${by + h + 6} L${pos.x + 5} ${by + h}`} />
        : <path d={`M${bx + w} ${pos.y - 5} L${bx + w + 6} ${pos.y} L${bx + w} ${pos.y + 5}`} />}
      <text x={bx + 10} y={by + 14} className="rm-callout-name">{name}</text>
      <text x={bx + 10} y={by + 27} className="rm-callout-score" fill={color}>{score}</text>
    </g>
  )
}

// Interactive roof map: each Sense fan is a dot coloured by its grade, with the score inside.
// A fan with an open equipment fault pulses. Tap a fan to select it.
export default function RoofMap({ structures, selectedId, onSelect }) {
  const phone = useIsPhone()
  const selected = structures.find(s => s.id === selectedId)
  const colorOf = s => GRADE[s.grade]?.color ?? 'var(--ink-3)'

  return (
    <svg className={`roof-map${phone ? ' is-phone' : ''}`} viewBox={phone ? '132 2 472 224' : ROOF_VIEWBOX}
         role="img" aria-label="Roof map with each Sense fan coloured by its health score">
      <defs>
        <pattern id="rm-hatch" width="7" height="7" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
          <rect width="7" height="7" fill="#dde8d2" />
          <line x1="0" y1="0" x2="0" y2="7" stroke="#c7d7b6" strokeWidth="2" />
        </pattern>
        <filter id="rm-shadow" x="-20%" y="-20%" width="140%" height="160%">
          <feDropShadow dx="0" dy="1.5" stdDeviation="2" floodColor="#1e2a2b" floodOpacity="0.16" />
        </filter>
      </defs>

      <Shapes className="rm-fill" />
      <Shapes className="rm-wall" />
      <Shapes className="rm-wall-in" />
      <text className="rm-zone" x={lowRoof.x + lowRoof.w / 2} y={lowRoof.y + lowRoof.h / 2 + 4} textAnchor="middle">{lowRoof.label}</text>
      <text className="rm-zone" x={255} y={104} textAnchor="middle">{flatRoof.label}</text>
      <text className="rm-zone" x={500} y={150} textAnchor="middle">{greenRoof.label}</text>

      {structures.map(s => {
        const pos = FAN_POSITIONS[s.name]
        if (!pos) return null
        const color = colorOf(s)
        const isSel = s.id === selectedId
        const alert = s.issues.some(i => i.open && i.kind === 'Equipment')
        const labelLeft = pos.x > 300 && pos.x < 365
        return (
          <g key={s.id} className="rm-fan" transform={`translate(${pos.x} ${pos.y})`} onClick={() => onSelect(s.id)}
             role="button" tabIndex="0" aria-pressed={isSel}
             aria-label={s.score == null ? `${pos.label}, no data yet` : `${pos.label}, score ${s.score.toFixed(0)}, ${s.grade}${alert ? ', equipment fault' : ''}`}
             onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onSelect(s.id) } }}>
            <circle r="20" fill="transparent" />
            {alert && <circle className="rm-pulse" r="11" stroke={color} />}
            {isSel && <circle r="19" fill={color} opacity="0.16" />}
            {isSel && <circle r="15" fill="none" stroke={color} strokeWidth="1.5" />}
            <circle className="rm-dot" r="11" fill={color} />
            {s.score != null && <text className="rm-dot-score" y="3.6" textAnchor="middle">{s.score.toFixed(0)}</text>}
            {!isSel && (
              <text className="rm-label" x={labelLeft ? -17 : 17} y="4" textAnchor={labelLeft ? 'end' : 'start'}>{pos.label}</text>
            )}
          </g>
        )
      })}

      {selected && FAN_POSITIONS[selected.name] && (
        <Callout pos={FAN_POSITIONS[selected.name]} s={selected} color={colorOf(selected)} />
      )}
    </svg>
  )
}
