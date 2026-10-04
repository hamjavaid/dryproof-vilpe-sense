import { ROOF_VIEWBOX, ROOF_SHAPES, FAN_POSITIONS } from '../roof.js'

const { lowRoof, flatRoof, greenRoof } = ROOF_SHAPES

// Small roof plan that shows a technician which fan to go to. Other fans are grey dots.
export default function RoofLocator({ name, tone = 'warn' }) {
  const target = FAN_POSITIONS[name]
  return (
    <svg className={`locator locator-${tone}`} viewBox={ROOF_VIEWBOX} role="img"
         aria-label={target ? `${target.label} on the roof plan` : 'Roof plan'}>
      <rect className="loc-roof" x={lowRoof.x} y={lowRoof.y} width={lowRoof.w} height={lowRoof.h} />
      <rect className="loc-roof" x={flatRoof.x} y={flatRoof.y} width={flatRoof.w} height={flatRoof.h} />
      <polygon className="loc-roof loc-green" points={greenRoof.points} />
      {Object.entries(FAN_POSITIONS).map(([key, f]) => key !== name && <circle key={key} cx={f.x} cy={f.y} r="7" className="loc-other" />)}
      {target && (
        <g transform={`translate(${target.x} ${target.y})`}>
          <circle r="14" className="loc-pulse" />
          <circle r="11" className="loc-target" />
          <text x={target.x > 440 ? -20 : 20} y="7" textAnchor={target.x > 440 ? 'end' : 'start'} className="loc-label">{target.label}</text>
        </g>
      )}
    </svg>
  )
}
