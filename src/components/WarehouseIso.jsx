// Isometric line drawing of the warehouse with its 7 Sense roof fans.
// x runs along the building (up to the right), y across it (down to the right), z up.
const S = 30, OX = 40, OY = 262
const L = 10, W = 4.6, H = 2.1, R = 3.3        // length, width, wall height, ridge height

const P = (x, y, z) => [OX + (x + y) * 0.866 * S, OY + (y - x) * 0.5 * S - z * S]
const roofZ = y => R - (Math.abs(y - W / 2) / (W / 2)) * (R - H)
const line = (...pts) => pts.map((p, i) => `${i ? 'L' : 'M'}${p[0].toFixed(1)} ${p[1].toFixed(1)}`).join(' ')

// 7 fans: 4 on the near roof slope, 3 on the far slope
const FANS = [[2.4, 3.5], [4.8, 3.5], [7.2, 3.5], [9.2, 3.7], [3.6, 1.2], [6.0, 1.2], [8.4, 1.2]]

function Fan({ x, y }) {
  const [cx, cy] = P(x, y, roofZ(y))
  return (
    <g>
      <path d={`M${cx - 7} ${cy} V${cy - 4} M${cx + 7} ${cy} V${cy - 4}`} />
      <path d={`M${cx - 7} ${cy} Q${cx} ${cy + 4.5} ${cx + 7} ${cy}`} />
      <ellipse cx={cx} cy={cy - 4} rx="7" ry="3.8" />
      <ellipse cx={cx} cy={cy - 4} rx="3.6" ry="1.9" opacity="0.7" />
      <path d={`M${cx - 5} ${cy - 1.5} V${cy + 1.6} M${cx} ${cy - 0.2} V${cy + 2.4} M${cx + 5} ${cy - 1.5} V${cy + 1.6}`} opacity="0.6" />
    </g>
  )
}

export default function WarehouseIso() {
  const f = (x, y) => P(x, y, 0)
  const t = (x, y) => P(x, y, H)
  const rA = P(0, W / 2, R), rB = P(L, W / 2, R)
  return (
    <svg className="warehouse-iso" viewBox="0 0 460 340" role="img" aria-label="Line drawing of the VILPE warehouse with seven Sense roof fans">
      <g fill="none" stroke="currentColor" strokeWidth="1.1" strokeLinejoin="round" strokeLinecap="round">
        {/* plinth */}
        <path d={line(P(-0.12, -0.12, 0), P(-0.12, W + 0.12, 0), P(L + 0.12, W + 0.12, 0))} opacity="0.55" />
        <path d={line(P(-0.12, W + 0.12, 0), P(-0.12, W + 0.12, -0.18))} opacity="0.55" />
        {/* near end (gable with door) */}
        <path d={line(f(0, 0), f(0, W), f(L, W))} />
        <path d={line(f(0, 0), t(0, 0))} />
        <path d={line(f(0, W), t(0, W))} />
        <path d={line(f(L, W), t(L, W))} />
        <path d={line(t(0, 0), rA, t(0, W))} />
        <path d={line(f(0, 1.6), P(0, 1.6, 1.35), P(0, 2.9, 1.35), f(0, 2.9))} />
        <path d={line(f(0, 0.7), t(0, 0.7))} opacity="0.5" />
        <path d={line(f(0, 3.9), t(0, 3.9))} opacity="0.5" />
        {/* long wall facing us, with panel lines */}
        <path d={line(t(0, W), t(L, W))} />
        {[2, 4, 6, 8].map(x => <path key={x} d={line(f(x, W), t(x, W))} opacity="0.6" />)}
        <path d={line(f(0, W), f(L, W))} />
        {/* roof */}
        <path d={line(rA, rB)} />
        <path d={line(t(0, 0), t(L, 0), rB, t(L, W))} />
        {/* fans */}
        {FANS.map(([x, y], i) => <Fan key={i} x={x} y={y} />)}
      </g>
    </svg>
  )
}