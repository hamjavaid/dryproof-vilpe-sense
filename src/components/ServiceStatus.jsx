import { useWorkflow } from '../workflow.jsx'
import { checkName } from '../explain.js'
import TechAvatar from './TechAvatar.jsx'

const TONE = { Alert: 'warn', Assigned: 'info', 'In progress': 'warn', Resolved: 'ok' }
const SAY = {
  Alert: 'VILPE service notified, waiting for a technician',
  Assigned: 'Technician assigned',
  'In progress': 'Technician on site',
  Resolved: 'Fixed. Re-certify after 30 clean days',
}

// Status of VILPE service work orders for one structure, as the owner or insurer sees it.
// onlyEquipment: the insurer only follows equipment faults (prevention tasks).
export default function ServiceStatus({ structureId, onlyEquipment = false, compact = false }) {
  const { ordersFor } = useWorkflow()
  const items = ordersFor(structureId).filter(x => !onlyEquipment || x.o.kind === 'Equipment')
  if (items.length === 0) return null
  return (
    <ul className={`svc-status${compact ? ' is-compact' : ''}`}>
      {items.map(({ o, stage, person }) => (
        <li key={o.id} className={`tone-${TONE[stage]}`}>
          {person ? <TechAvatar id={person.id} size={compact ? 26 : 30} title={person.name} /> : <span className="svc-status-dot" />}
          <span>
            <strong>{o.no} · {checkName(o.check)}</strong>
            <span>{SAY[stage]}{person && stage !== 'Alert' ? `: ${person.name}` : ''}</span>
          </span>
          <span className={`pill pill-${TONE[stage]}`}>{stage}</span>
        </li>
      ))}
    </ul>
  )
}
