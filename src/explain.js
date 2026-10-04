// Plain-language text, so owners, insurers and technicians understand the numbers without training.

// Shown behind the small "?" buttons
export const GLOSSARY = {
  score: {
    title: 'Health score',
    text: 'One number from 0 to 100. Mold risk counts for 40 points, time spent humid 20, how well the fan dries the structure 20, and working equipment 20. 85 or more is certified dry.',
  },
  mold: {
    title: 'Mold index',
    text: 'A 0 to 6 scale from the VTT mold growth model, the same model behind VILPE’s own index. Below 1 nothing grows. At 1 the first microscopic growth starts. VILPE alarms at 2.5.',
  },
  certified: {
    title: 'Certified dry',
    text: 'For 30 days in a row the score stayed at 85 or more, the mold index stayed below 1, and the fan and sensors worked.',
  },
  oldAlarm: {
    title: 'Old alarm',
    text: 'VILPE Sense default setting: humidity inside the structure above 90 % for about 24 hours. Humid air alone does not grow mold, so these alarms fire on healthy structures.',
  },
  smartAlert: {
    title: 'DryProof alert',
    text: 'Fires only when the mold index really rises: Watch at +0.1 within 7 days, Warning at 1.0, Critical at 2.5.',
  },
  watchdog: {
    title: 'Watchdog',
    text: 'Checks the equipment, not the structure: a fan stuck at 0 rpm, a sensor that went silent, an outdoor sensor heated by sun, or indoor and outdoor sensors that look swapped.',
  },
  uptime: {
    title: 'Equipment uptime',
    text: 'Share of time the fan ran when it should have and both sensors were sending data.',
  },
  riskGrade: {
    title: 'Risk grade',
    text: 'A: average health score 80 or more and no structure at risk. B: average 65 or more. C: below that. Premium changes are indicative and would be agreed in a pilot.',
  },
}

// 'Outdoor sensor reads too warm (sun or heat)' -> 'Outdoor sensor reads too warm'
export const checkName = check => check.replace(' (sun or heat)', '')

// What VILPE service should do for each kind of finding
const ACTIONS = {
  'Fan stopped': 'Inspect the fan motor, power supply and control voltage. Check the MCU-2 settings.',
  'Indoor sensor silent': 'Check the sensor battery and radio range to the control unit.',
  'Outdoor sensor silent': 'Check the sensor battery and radio range to the control unit.',
  'Outdoor sensor reads too warm (sun or heat)': 'Move the outdoor sensor to a shaded spot, away from direct sun and warm exhaust air (guidebook placement rules).',
  'Sensors likely swapped': 'Swap the indoor and outdoor sensor roles in the Sense cloud, then confirm the readings.',
}
export const actionFor = check => ACTIONS[check] ?? 'Inspect on site.'

// One sentence that tells the owner what a structure's state means and what to do
export function verdict(s) {
  if (s.score == null) return { tone: 'muted', text: 'No readings yet on this date.' }
  const open = s.issues.filter(i => i.open).map(i => i.check)
  if (open.includes('Fan stopped')) {
    return { tone: 'bad', text: 'The fan keeps stopping, so the structure cannot dry out when the weather allows. Book a service visit.' }
  }
  if (open.some(c => c.endsWith('silent'))) {
    return { tone: 'bad', text: 'A sensor stopped sending data, so this structure is partly unmonitored. Check the sensor battery.' }
  }
  if (open.includes('Sensors likely swapped')) {
    return { tone: 'warn', text: 'The indoor and outdoor sensors look swapped. Until that is checked, read this score with care.' }
  }
  if (open.some(c => c.startsWith('Outdoor sensor reads too warm'))) {
    return { tone: 'warn', text: 'The outdoor sensor reads too warm in daytime, likely from direct sun. Move it to a shaded spot so drying decisions use the right air.' }
  }
  return {
    'Certified dry': { tone: 'ok', text: 'Dry and healthy. No action needed.' },
    Good: { tone: 'info', text: 'Healthy. Humid spells dry out on their own, and mold growth is far away.' },
    Attention: { tone: 'warn', text: 'Needs attention. Look at the parts of the score that lost the most points.' },
    'At risk': { tone: 'bad', text: 'At risk. Inspect the structure soon.' },
  }[s.grade]
}
