import { useId } from 'react'
import { ROOF_SHAPES, FAN_POSITIONS } from '../roof.js'
import { GRADE } from '../data.jsx'

// Isometric 3D drawing of the real building, extruded from the roof plan traced from VILPE's site drawing.
// Plan x runs up to the right, plan y down to the right, z is up.
const K = 0.82
const P = (x, y, z = 0) => [(x + y) * 0.866 * K, (y - x) * 0.5 * K - z * K]
const rectPts = r => [[r.x, r.y], [r.x + r.w, r.y], [r.x + r.w, r.y + r.h], [r.x, r.y + r.h]]
const polyPts = s => s.split(' ').map(p => p.split(',').map(Number))
const path = pts => pts.map((p, i) => `${i ? 'L' : 'M'}${p[0].toFixed(1)} ${p[1].toFixed(1)}`).join('') + 'Z'

const H_MAIN = 26
const H_LOW = 16
// Drawn far to near, so nearer blocks cover the ones behind them
const BLOCKS = [
  { key: 'green', pts: polyPts(ROOF_SHAPES.greenRoof.points), h: H_MAIN },
  { key: 'flat', pts: rectPts(ROOF_SHAPES.flatRoof), h: H_MAIN },
  { key: 'low', pts: rectPts(ROOF_SHAPES.lowRoof), h: H_LOW },
]

// Where each fan's label sits relative to the fan, so labels never overlap
const LABEL = {
  'Hallin alapohja': { dx: -16, dy: -30, anchor: 'end' },
  'Katto 1': { dx: 0, dy: -30, anchor: 'middle' },
  'Katto 2': { dx: 14, dy: -34, anchor: 'start' },
  'Katto 3': { dx: 0, dy: -30, anchor: 'middle' },
  'Katto 4': { dx: 0, dy: -32, anchor: 'middle' },
  'Viherkatto 1': { dx: 0, dy: -32, anchor: 'middle' },
  'Viherkatto 2': { dx: 22, dy: -12, anchor: 'start' },
}

// Wall faces that look towards the viewer, ordered far to near
function visibleWalls(pts, h) {
  const cx = pts.reduce((n, p) => n + p[0], 0) / pts.length
  const cy = pts.reduce((n, p) => n + p[1], 0) / pts.length
  const faces = []
  pts.forEach((a, i) => {
    const b = pts[(i + 1) % pts.length]
    let nx = b[1] - a[1], ny = a[0] - b[0]
    if (nx * ((a[0] + b[0]) / 2 - cx) + ny * ((a[1] + b[1]) / 2 - cy) < 0) { nx = -nx; ny = -ny }
    if (ny - nx > 0) faces.push({ a, b, depth: (a[1] + b[1]) / 2 - (a[0] + b[0]) / 2 })
  })
  return faces.sort((p, q) => p.depth - q.depth).map(({ a, b }) => ({
    quad: [P(...a, 0), P(...b, 0), P(...b, h), P(...a, h)],
    // vertical cladding lines
    lines: [0.2, 0.4, 0.6, 0.8].map(t => {
      const x = a[0] + (b[0] - a[0]) * t, y = a[1] + (b[1] - a[1]) * t
      return [P(x, y, 0), P(x, y, h)]
    }),
  }))
}

const heightAt = x => (x < ROOF_SHAPES.flatRoof.x ? H_LOW : H_MAIN)

export default function BuildingIso({ structures = [], tone = 'light', showLabels = true }) {
  const id = useId().replace(/:/g, '')
  const byName = Object.fromEntries(structures.map(s => [s.name, s]))

  // Fit the view box around everything that is drawn
  const all = BLOCKS.flatMap(b => b.pts.flatMap(p => [P(...p, 0), P(...p, b.h)]))
  const xs = all.map(p => p[0]), ys = all.map(p => p[1])
  const vb = [Math.min(...xs) - 60, Math.min(...ys) - 64, Math.max(...xs) - Math.min(...xs) + 120, Math.max(...ys) - Math.min(...ys) + 84]

  return (
    <svg className={`biso biso-${tone}`} viewBox={vb.map(v => v.toFixed(0)).join(' ')} role="img"
         aria-label="3D drawing of the warehouse with each Sense fan coloured by its status">
      <defs>
        <pattern id={`${id}g`} width="6" height="6" patternUnits="userSpaceOnUse" patternTransform="rotate(30)">
          <rect width="6" height="6" className="biso-green-bg" />
          <line x1="0" y1="0" x2="0" y2="6" className="biso-green-line" />
        </pattern>
      </defs>

      {/* soft ground shadow */}
      {BLOCKS.map(b => <path key={b.key} d={path(b.pts.map(p => P(...p, 0)))} transform="translate(6 7)" className="biso-shadow" />)}

      {BLOCKS.map(b => (
        <g key={b.key}>
          {visibleWalls(b.pts, b.h).map((f, i) => (
            <g key={i}>
              <path d={path(f.quad)} className="biso-wall" />
              {f.lines.map((l, k) => <path key={k} d={`M${l[0][0].toFixed(1)} ${l[0][1].toFixed(1)}L${l[1][0].toFixed(1)} ${l[1][1].toFixed(1)}`} className="biso-clad" />)}
            </g>
          ))}
          <path d={path(b.pts.map(p => P(...p, b.h)))} className={b.key === 'green' ? 'biso-roof' : 'biso-roof biso-roof-flat'}
                fill={b.key === 'green' ? `url(#${id}g)` : undefined} />
        </g>
      ))}

      {Object.entries(FAN_POSITIONS).map(([name, f]) => {
        const s = byName[name]
        const [sx, sy] = P(f.x, f.y, heightAt(f.x))
        const color = s ? GRADE[s.grade]?.color ?? 'var(--ink-3)' : 'currentColor'
        const lab = LABEL[name]
        const lx = sx + lab.dx, ly = sy + lab.dy
        return (
          <g key={name}>
            {/* fan: iso disc on the roof with a small vent cylinder */}
            <ellipse cx={sx} cy={sy} rx="8" ry="4.6" fill={color} opacity="0.28" />
            <path d={`M${sx - 3.6} ${sy} V${sy - 6} M${sx + 3.6} ${sy} V${sy - 6}`} className="biso-vent" />
            <ellipse cx={sx} cy={sy - 6} rx="3.6" ry="2" fill={color} className="biso-vent-top" />
            {showLabels && (
              <g>
                <path d={`M${sx} ${sy - 8} L${lx} ${ly + 4}`} className="biso-leader" />
                <text x={lx} y={ly - 9} textAnchor={lab.anchor} className="biso-name">{f.label}</text>
                {s && (
                  <text x={lx} y={ly + 2} textAnchor={lab.anchor} className="biso-status">
                    <tspan fill={color}>{'●'} </tspan>{s.grade}
                  </text>
                )}
              </g>
            )}
          </g>
        )
      })}
    </svg>
  )
}
