# DryProof by VILPE Sense: Project Guide

Everything about the project in one place: the problem, the solution, how the app works, how it answers the challenge, and the answers to judges' likely questions.

---

## 1. In one sentence

**DryProof by VILPE Sense turns VILPE Sense data into proof that a building is dry. It replaces noisy alarms with real alerts, catches broken equipment nobody noticed, and links the property owner, VILPE service and the insurer in one flow.**

---

## 2. What VILPE asked for, and where we answer it

The brief ("Unlocking the Value of Building Data"): *develop new service concepts or business models that create value from VILPE Sense and/or its data, for existing or new customers.*

| VILPE asked for | Our answer | Where to show it |
|---|---|---|
| A target customer and a concrete, unmet need | Commercial property owners need **proof** that their structures are dry, and they need **faults caught early**. Today they get 180 false alarms and miss broken equipment. | Story chapters 2 and 3, Owner roof map |
| A service concept or business model, and its value proposition | DryProof: a subscription that gives owners a health score, smart alerts, a watchdog, a Dry Structure Certificate and a public building passport. Insurers and VILPE service join through the same flow. | Story, *How it works* |
| How VILPE Sense data contributes | Every number comes from Sense data: indoor and outdoor temperature and humidity, plus fan speed. Our engine turns it into a mold index, watchdog findings, a score and a certificate. | Every screen. *How it works*, section 1 |
| How it works in practice and creates value | A trigger goes automatically to the right role (see the routing table). The Value page puts euros on it. Three revenue lines. | *How it works*, sections 2 to 4. *Value* page |
| A working prototype, mock-up, dashboard or demo | A full web app with 3 roles, a public passport and a pitch "Story" mode, running on the real data. | The app |
| How VILPE can test and develop it after the hackathon | A 90-day pilot on data VILPE already has, with a measure for each month. | *How it works*, section 5. Story chapter 7 |

**Verdict: all six required items are covered.** Each one is backed by real data or clearly marked as a proposal.

### Evaluation criteria

| Criterion | Why we score well |
|---|---|
| **Customer value** | Solves real, provable pain: 180 false alarms, a fan stopped for 379 days without anyone noticing, and no proof of dryness for buyers or insurers. |
| **Innovation** | Moves Sense from "an alarm box" to "a trust product": certificate, passport, insurer portfolio and automatic work orders. Smart alerts use the mold model instead of a humidity threshold. |
| **Business potential** | Three revenue lines (owner subscription, insurer data, service visits). Scales to every Sense installation without new hardware (fleet map). |
| **Feasibility** | Built on what VILPE already has: Sense data, the REST API (already integrated with Schneider Electric), and owner-shared links for property sales. Our engine has 19 passing tests. |

---

## 3. The problem we tackle (proven with VILPE's own data)

Data: **VILPE Express Store, Vantaa** (VILPE's own warehouse). **40,060 readings** from **7 Sense control units** (6 on the roof, 1 in the crawl space), **13 May 2025 to 11 Sep 2026** (16 months).

### Problem 1: the alarm cries wolf
- VILPE's recommended alarm setting (indoor humidity above 90 % for 12 readings, about 24 h; Sense guidebook p.25) fired **180 times**.
- Over the same period, the **highest mold index of any structure was 0.39**. Mold growth starts at **1.0**, and VILPE's own alarm level is **2.5**.
- So **every one of those 180 alarms was on a healthy structure**. Humid air alone does not grow mold; time, temperature and humidity together do.
- Roof 2 had the most alarms (37) and a mold index of almost zero.

### Problem 2: broken equipment nobody noticed
Our watchdog found an issue on **7 of 7 units**, and **none of them raised an alarm**:
- **Green roof 2**: the fan showed **0 rpm for 379 days** (May 2025 to May 2026), then kept stopping until Sep 2026. Equipment uptime: **6.7 %**.
- **Roof 1 and Green roof 1**: the indoor sensors were **silent for 36 days** after installation.
- **Roofs 2, 3 and 4**: the outdoor sensors read **3 to 9 °C too warm in daytime** for months, most likely direct sun. The fan control uses outdoor air to decide when to dry, so this matters.
- **Crawl space**: the indoor and outdoor sensors **look swapped**. The "outdoor" sensor tracks the other outdoor sensors at only 0.74, while the "indoor" sensor tracks them at 0.97.

> Careful wording (important when presenting): "the data shows 0 rpm for 379 days; whether the fan stopped or the signal was lost, nothing flagged it." The swapped sensors are "likely", not confirmed by VILPE.

### Problem 3: no proof of dryness
Owners cannot easily show a buyer, tenant or insurer that their roof is dry. In Finland, **moisture and mold are the most common cause of property sale disputes**, and court costs can reach about €30,000 per party.

---

## 4. Who the customers are

| Role | What they need | What DryProof gives them |
|---|---|---|
| **Property owner** (primary customer) | Know the structures are fine, without false alarms. Prove it when selling, letting or insuring. | Roof map, health score, plain-language advice, value calculator, certificate, passport |
| **VILPE service** | Find faults before they become damage. Plan visits. | Automatic work orders with diagnosis, roof location, directions and technician assignment. Fleet map of all sites |
| **Insurer** (LocalTapiola as proposed partner) | Verified risk data instead of self-reported answers. Fewer water damage claims. | Portfolio risk grades, certificate check, prevention tasks with live status |
| **Buyers and tenants** | Trust the building's history | Public building passport opened by QR code |

**Pitch tip:** lead with the **property owner** as the main customer. Present the insurer and VILPE service as the way the business grows.

---

## 5. How the data becomes decisions (the engine)

The engine is in `vilpe-structura/engine/` (Python). It runs once and writes `data.json`, which the web app reads.

| Step | Script | What it does |
|---|---|---|
| A | `step_a_clean.py` | Cleans the workbook (40,077 rows in and out, nothing deleted, issues flagged) |
| B | `step_b_old_alarm.py` | Reproduces VILPE's default alarm: **180 alarms** |
| C | `step_c_mold_index.py` | **VTT mold growth model** (Hukka & Viitanen 1999, Ojanen et al. 2010), "very sensitive" class. It matches VILPE's own index without tuning: Roof 1 0.0013 vs 0.00125, Green roof 2 0.0316 vs 0.0310, Green roof 1 0 vs 0 |
| D | `step_d_watchdog.py` | Equipment checks (rules below) |
| E | `step_e_health_score.py` | Daily 0 to 100 health score |
| F | `step_f_export.py` | Exports everything to `data.json` |

Tests: `vilpe-structura/tests/test_engine.py`, **19 tests, all passing** (checked 4 Oct 2026).

### Watchdog rules
- **Fan stopped:** 0 rpm for 48 h while outdoor air is above -7 °C (the fan should be running).
- **Sensor silent:** no values for 24 h while the unit is online.
- **Outdoor sensor too warm:** daytime average more than 3 °C above the other outdoor sensors, per week.
- **Sensors likely swapped:** the outdoor sensor does not follow the other outdoor sensors, but the indoor sensor does.

### Smart alerts (instead of the 90 % humidity alarm)
- **Watch:** mold index rises 0.1 or more within 7 days (dashboard only).
- **Warning:** mold index reaches 1.0 (first microscopic growth).
- **Critical:** mold index reaches 2.5 (VILPE's alarm level).
- Result for this building: **0 alerts**, because there was no real risk.

### Health score (0 to 100)
| Part | Points | Meaning |
|---|---|---|
| Mold risk | 40 | How far the mold index is from growth |
| Time in risk zone | 20 | How long the structure stayed humid |
| Drying performance | 20 | Did the fan run when outside air could dry the structure? |
| System health | 20 | Is the equipment working (from the watchdog)? |

Grades: **Certified dry** 85+, **Good** 70 to 84, **Attention** 50 to 69, **At risk** below 50.

### Dry Structure Certificate
A structure is certified when, for the **last 30 days**:
1. the score never dropped below 85,
2. the mold index stayed below 1.0, and
3. there was no open equipment fault.

Today: **2 of 7 certified** (Roof 1, Green roof 1). Certificate **VS-2026-09-11-9472**, valid until 11 Oct 2026. Every "not yet" comes with what to fix, which creates work for VILPE service.

### Conditional scenario (mention carefully)
If the crawl space sensors really are swapped, swapping them back gives a mold index of **4.5** (Warning in Aug 2025, Critical in Oct 2025). This is not confirmed by VILPE. It shows why the watchdog matters.

---

## 6. The web app, screen by screen

Open it, sign in with a demo role (no password needed), or press **Watch the story**.

### Property owner
| Screen | What it shows | Why it matters |
|---|---|---|
| **Roof map** | Real roof plan from VILPE's site drawing, each fan coloured by grade with its score. Faulty fans pulse. Alert banner, 5 key figures, plain-language advice per structure, live service status, and a **16-month replay** with an activity feed | The owner understands everything in seconds |
| **Structure detail** | Charts for score, mold index, humidity (old alarms as red dots) and fan speed. Hover shows any day. Watchdog findings with "what to do" | The proof behind the score |
| **Value** | Real findings turned into euros, with the owner's own numbers (editable) | Measurable value |
| **Certificate** | Dry Structure Certificate with QR code and print or PDF | The product owners pay for |
| **Passport** | Public page: verified badge, 3D model of the real building, history charts, structures, full maintenance log | Shared with buyers, tenants and insurers |

### VILPE service
| Screen | What it shows |
|---|---|
| **Work orders** | One order per finding. Filter tabs (All open, Unassigned, Critical, Resolved). Each row shows the site, the issue, a stage bar, humidity before and during the fault, and the assignee. An opened row shows the diagnosis, the recommended action, **where to go on the roof**, the control unit serial, **directions**, and the progress steps |
| **Fleet map** | All sites on a map of Finland, coloured by the most urgent open order. 1 live site and 5 example sites |

### Insurer
| Screen | What it shows |
|---|---|
| **Portfolio** | Risk grade (A, B or C) with an indicative premium change, a building risk table, open faults with **live prevention task status**, a certificate checker and claims evidence |

### For everyone
- **How it works:**
  1. The flow chart
  2. One trigger followed end to end, with live status
  3. The routing table
  4. Who pays for what
  5. The pilot plan
- **Notification bell:** shows what was routed to the signed-in role.
- **"?" buttons:** explain each technical term in plain words.
- **Story:** a 7-chapter pitch mode that opens the live screens.

---

## 7. How the roles are linked (the flow logic)

One shared workflow connects all roles. When VILPE service changes a work order, the owner's and insurer's screens and bells update. It also works live across two browser windows.

```
VILPE Sense data  ->  DryProof engine  ->  Trigger  ->  Routed to the right roles
(temp, humidity,      (mold index,          (fault,       (owner, VILPE service,
 fan speed)            watchdog, score,      alert,        insurer, passport)
                       certificate)          resolved)
```

### Who gets what
| Trigger | Owner | VILPE service | Insurer | Passport |
|---|---|---|---|---|
| Equipment fault (fan stopped, sensor silent) | Alert, score drops | High-priority work order | Prevention task, certificate on hold | Logged as open |
| Data trust issue (sensor in sun, swapped) | Notice | Medium-priority work order | - | Logged as open |
| Mold index +0.1 in 7 days (Watch) | Dashboard note | - | - | - |
| Mold index reaches 1.0 (Warning) | Alert | Inspection work order | - | Logged |
| Mold index reaches 2.5 (Critical) | Urgent alert | Urgent visit | Informed | Logged |
| Technician assigned or on site | Status update | - | Task status | - |
| Work order resolved | Fixed, re-certify after 30 clean days | - | Prevention task closed | Logged as resolved |
| 30 clean days | Certificate renewed | - | Verifiable certificate, better terms | Updated, QR valid |
| Humid air above 90 % for 24 h (old alarm) | **Nobody**, because humid air alone grows no mold | | | |

### Example: Green roof 2 fan stopped
1. **Fault found:** the watchdog sees 0 rpm while it is warm enough to run. VILPE service gets work order WO-2026-001 (high priority). The owner gets an alert. The insurer sees "certificate on hold".
2. **Assigned:** a technician is assigned (Matti V., fans and electrical). The owner sees who is coming, and the insurer sees the task started.
3. **On site:** the owner sees "technician on site".
4. **Resolved:** the owner hears "fixed", and the insurer's prevention task closes.
5. **30 clean days later:** the certificate is renewed, and the passport and QR code update.

---

## 8. Business model

| Who pays | For what | Proposed price |
|---|---|---|
| Property owner | DryProof subscription: watchdog, score, smart alerts, certificate, passport | €19 per structure per month |
| Insurer | Verified risk data: portfolio grades, certificate checks, prevention tasks | €250 per insured building per year |
| VILPE service | Planned, billable visits created by watchdog findings | Normal service rates |

Prices are a **proposal to test in the pilot**. The model needs **no new hardware**: it runs on existing Sense installations and the existing REST API.

### Value for the owner (Value page, example numbers)
| Line | Calculation | Per year |
|---|---|---|
| False alarms no longer chased | 135 alarms a year × €60 per check | €8,100 |
| Lower insurance premium | 8 % of €10,000 | €800 |
| Faults fixed early | Owner's estimate | €5,000 |
| **Value** | | **€13,900** |
| Cost | 7 structures × €19 × 12 | €1,596 |
| **Net value** | | **€12,304 (8.7 × the cost)** |

The euro inputs are **examples the owner replaces with their own numbers**. The facts (180 alarms, 7 of 7 faults, 379 days, mold index 0.39) come from the data.

---

## 9. Why it is feasible for VILPE

From VILPE's own Sense brochure (p.22 to 23):
- Sense data (temperature, humidity, absolute humidity, mold index, fan speed) is already in VILPE's cloud.
- A **REST API** already exists and has been integrated with Schneider Electric's building management system.
- The **building owner owns the data** and can already **share a public link, "for example in property sales"**. Our passport builds on that.

Market signals:
- From 29 May 2026, EU countries must introduce **Building Renovation Passports**, linked to digital building logbooks. A moisture passport fits this trend.
- Insurers already give **3 to 10 % discounts** for leak sensors, and LähiTapiola has run a smart-sensor home insurance product.

---

## 10. Pilot plan (after the hackathon)

| When | What | What to measure |
|---|---|---|
| Month 1 | Run the watchdog on existing Sense installations | Silent faults found per 100 Sense units |
| Month 2 | Certify 3 to 5 commercial roofs | How many owners would pay, and how much |
| Month 3 | Test the portfolio view with one insurer | Premium terms offered for certified buildings |

---

## 11. Honesty notes: what is real and what is not

| Real, from the data | Example or proposal (labelled in the app) |
|---|---|
| All readings, scores, mold index, alarms, watchdog findings, work orders, humidity values, certificate status | 5 example sites on the fleet map and 3 example buildings in the insurer table (marked "Example") |
| Roof plan and fan positions (from VILPE's site drawing) | Prices (marked "proposal") and premium changes (marked "indicative") |
| 19 engine tests | Euro inputs on the Value page (the owner's own numbers) |
| | Service team names, and work order stages and assignments (demo workflow) |
| | Vantaa map pin at city level (the exact address is not in the data) |

---

## 12. Technology and how to run it

- **Engine:** Python (pandas), in `vilpe-structura/engine/`, with tests in `vilpe-structura/tests/`.
- **Web app:** React 18 + Vite + React Router, in `Prototype_Building/Frontend/frontend/`. There is no backend: the app reads `public/data.json`. Charts and the 3D drawing are hand-made SVG. Leaflet with OpenStreetMap draws the fleet map, and `qrcode.react` draws the QR codes.
- **Shared workflow state:** kept in the browser's local storage, so it survives sign-out and syncs between windows. **Reset demo** on Work orders restores the starting state.

```
cd "F:\Vaasa junction hackthon\Prototype_Building\Frontend\frontend"
npm install        (first time only)
npm run dev        -> http://localhost:5173
npm run build      -> dist/ folder, works from any static host
npm run preview    -> serves the built version
```

Internet is needed only for the fonts and the map tiles. Everything else works offline.

### Main source files
| File | Role |
|---|---|
| `src/data.jsx` | Loads `data.json`, remembers the signed-in role |
| `src/workflow.jsx` | Shared workflow, routing table, notifications |
| `src/orders.js` | Builds work orders from watchdog findings |
| `src/certification.js` | Certificate rules and IDs |
| `src/replay.js` | 16-month replay |
| `src/explain.js` | Plain-language texts, "?" explanations, actions |
| `src/pages/...` | One folder per role, plus `flow/` and `story/` |

---

## 13. Demo script (about 3 minutes)

1. **Story, chapters 1 to 3:** VILPE's warehouse, 180 false alarms, and 7 of 7 silent faults.
2. **"Open Green roof 2"** (owner detail): fan speed flat at 0, red alarm dots on healthy humidity, mold index far below 1.
3. **Roof map:** press **Replay 16 months** and watch the scores and activity feed move.
4. **VILPE service, Work orders:** open WO-001 (where to go, directions), then **Mark resolved**.
5. **Owner bell:** "Green roof 2 fixed". **Insurer:** prevention task closed. *Tip: two browser windows side by side.*
6. **Certificate**, then **scan the QR code** with a phone to open the **Passport**.
7. **Value page:** €12,304 net per year with example numbers.
8. **How it works:** the routing table, who pays, and the pilot. End with: *"No new hardware. VILPE can start on Monday."*

---

## 14. Likely judge questions and answers

**Why should anyone trust your mold index?**
It is the published VTT mold growth model, and it matches VILPE's own index on three structures without tuning (for example Roof 1: 0.0013 vs 0.00125).

**Are the 180 alarms really false?**
They fired on structures whose mold index never went above 0.39. Mold growth starts at 1.0. Humid air for a day is normal on a roof; mold needs humidity over time at the right temperature.

**Did the Green roof 2 fan really stop?**
The data shows 0 rpm for 379 days while it was warm enough to run. Whether the fan stopped or the signal was lost, nothing flagged it. Either way, it needs a visit.

**Is this just a dashboard?**
No. It is a service with a workflow: a finding becomes a work order, the owner and insurer are informed, and a fix leads to a renewed certificate. Each step is something a customer pays for.

**Why would an insurer pay?**
Verified, continuous data instead of self-reported answers, and prevention before a claim. Insurers already discount leak sensors by 3 to 10 %.

**How does it scale?**
It runs on any existing Sense installation through the REST API. The fleet map shows many sites. No new hardware is needed.

**What would VILPE need to build?**
The engine (already working, 19 tests), a connection to the Sense API instead of the Excel export, accounts, and an insurer pilot agreement.

**What about privacy?**
The owner owns the data, as Sense already works today. Nothing is shared with an insurer or buyer unless the owner shares the certificate or passport.

**What do the leak sensors (RHT-2) do in your concept?**
The site has about 45, but we only received the control unit data. In a next version, their readings feed the same watchdog and roof map.

---

## 15. Open items for tomorrow morning

- [ ] Decide the main customer line for the pitch (recommended: the commercial property owner).
- [ ] Optional: make the owner home calmer (3 key figures instead of 5).
- [ ] Add the exact street address of the warehouse, if known (one line in `src/sites.js`).
- [ ] Fix the login text "40,060 unique readings" to "40,060 sensor readings".
- [ ] Commit the code to git as a safe point (nothing is committed yet).
- [ ] Make the pitch deck and a backup screen recording in case the venue Wi-Fi fails.
- [ ] Rehearse the 3-minute demo with two browser windows.
