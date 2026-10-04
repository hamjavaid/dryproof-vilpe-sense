import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useData } from '../../data.jsx'
import { labelOf } from '../../roof.js'
import BuildingIso from '../../components/BuildingIso.jsx'
import Wordmark from '../../components/Wordmark.jsx'
import './story.css'

const WORDS = ['No', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven']

// Facts for chapter 3, computed from the data so the text can never drift from the numbers
function silentFaults(data) {
  const stops = data.structures.flatMap(s => s.watchdog.filter(w => w.check === 'Fan stopped').map(w => ({ s, days: w.days })))
  const longest = stops.reduce((a, b) => (b.days > a.days ? b : a), { days: 0 })
  const warmDays = s => s.watchdog.filter(w => w.check.startsWith('Outdoor sensor reads too warm')).reduce((n, w) => n + w.days, 0)
  const sunny = data.structures.filter(s => warmDays(s) > 100).length
  return { fanUnit: longest.s ? labelOf(longest.s) : null, fanDays: Math.round(longest.days), sunny }
}

// Pitch mode: one chapter per screen, each with one big number and a button that opens the live screen.
export default function Story() {
  const { data, setRole } = useData()
  const navigate = useNavigate()
  const [i, setI] = useState(0)

  const live = (role, path) => { setRole(role); navigate(path) }

  const s = data?.summary
  const f = data ? silentFaults(data) : null
  const chapters = !data ? [] : [
    {
      step: 'The building',
      title: 'VILPE’s own warehouse in Vantaa.',
      big: data.building.readings.toLocaleString('en'), unit: `sensor readings from ${s.structures} Sense fans in 16 months`,
      text: 'Real VILPE data. No value altered, and every number in this demo is checked by 19 automated tests.',
      extra: <div className="story-art"><BuildingIso tone="dark" structures={data.structures.map(x => ({ name: x.name, grade: x.latest.grade }))} /></div>,
    },
    {
      step: 'The problem',
      title: 'Today’s alarm cries wolf.',
      big: s.old_alarms_total, unit: 'alarms from VILPE’s recommended setting',
      text: `Every one of them on a healthy structure. The highest mold index in 16 months was ${s.highest_mold_index_ours.toFixed(2)}, far below the alarm level of 2.5. DryProof alerts in the same period: ${s.smart_alerts_total}.`,
      action: ['Watch the replay', () => live('owner', '/owner')],
    },
    {
      step: 'What nobody noticed',
      title: 'Every unit had a silent fault.',
      big: `${s.structures_with_watchdog_issue} of ${s.structures}`, unit: 'units with an equipment or sensor issue',
      text: `${f.fanUnit}’s fan showed 0 rpm for ${f.fanDays} days. ${WORDS[f.sunny] ?? f.sunny} outdoor sensors read too warm in daytime for months. The crawl space sensors look swapped. None of it raised an alarm.`,
      action: ['Open Green roof 2', () => live('owner', '/owner/structure/viherkatto-2')],
    },
    {
      step: 'One number',
      title: 'A health score anyone understands.',
      big: '0 to 100', unit: 'mold risk, time in risk zone, drying, system health',
      text: 'Calculated every day with the VTT mold growth model, the same model behind VILPE’s own mold index. Our engine matches VILPE’s index on three structures without tuning.',
      action: ['See the scores', () => live('owner', '/owner')],
    },
    {
      step: 'Proof that pays',
      title: 'A certificate and a passport, one scan away.',
      big: `${s.certified_dry_now.length} of ${s.structures}`, unit: 'structures certified dry today',
      text: 'Owners show it to buyers and insurers. Every "not yet" comes with what to fix, so the certificate creates demand for VILPE service.',
      action: ['Open the certificate', () => live('owner', '/owner/certificate')],
    },
    {
      step: 'The business',
      title: 'One trigger, three paying customers.',
      big: '3', unit: 'revenue lines for VILPE',
      text: 'Owners subscribe per structure (proposal €19 a month). Insurers pay for verified risk data (LocalTapiola as proposed partner). Every watchdog finding becomes a billable VILPE service visit. Each trigger is routed to the right person automatically.',
      action: ['See how it works', () => navigate('/how-it-works')],
    },
    {
      step: 'After the hackathon',
      title: 'A 90-day pilot on data VILPE already has.',
      big: '0', unit: 'new hardware needed',
      text: 'Month 1: run the watchdog on existing Sense installations and count silent faults. Month 2: certify 3 to 5 commercial roofs and test what owners pay. Month 3: test the portfolio view with one insurer on premium terms. It runs on the existing Sense REST API.',
      action: ['See the value for an owner', () => live('owner', '/owner/value')],
    },
  ]

  useEffect(() => {
    const onKey = e => {
      if (e.key === 'ArrowRight') setI(n => Math.min(n + 1, chapters.length - 1))
      if (e.key === 'ArrowLeft') setI(n => Math.max(n - 1, 0))
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [chapters.length])

  if (!data) return <div className="story"><p className="story-loading">Loading</p></div>
  const c = chapters[i]

  return (
    <div className="story">
      <div className="story-top">
        <Wordmark size="lg" tone="dark" />
        <button className="btn" onClick={() => navigate('/login')}>Exit story</button>
      </div>
      <main className="story-body" aria-live="polite" key={i}>
        <p className="story-step">{i + 1} of {chapters.length}. {c.step}</p>
        <h1>{c.title}</h1>
        <p className="story-big num">{c.big}<small>{c.unit}</small></p>
        <p className="story-text">{c.text}</p>
        {c.extra}
        {c.action && <button className="btn story-live" onClick={c.action[1]}>{c.action[0]}</button>}
      </main>
      <nav className="story-nav" aria-label="Chapters">
        <button className="btn" onClick={() => setI(n => Math.max(n - 1, 0))} disabled={i === 0}>Back</button>
        <div className="story-dots">
          {chapters.map((ch, k) => (
            <button key={k} className={k === i ? 'on' : ''} onClick={() => setI(k)} aria-label={`Chapter ${k + 1}: ${ch.step}`} aria-current={k === i} />
          ))}
        </div>
        <button className="btn" onClick={() => setI(n => Math.min(n + 1, chapters.length - 1))} disabled={i === chapters.length - 1}>Next</button>
      </nav>
    </div>
  )
}
