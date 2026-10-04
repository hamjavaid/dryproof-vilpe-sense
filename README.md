# DryProof by VILPE Sense

**Proof your roof is dry.** DryProof turns VILPE Sense data into certified dry buildings, smart alerts and automatic service work orders, linking property owners, VILPE service and insurers in one flow.

Built for the **VILPE x Vaasa Hackathon 2026**, challenge *Unlocking the Value of Building Data*.

---

## The problem (from VILPE's own data)

40,060 readings from 7 Sense units at VILPE's warehouse in Vantaa, May 2025 to Sep 2026:

- **180 false alarms.** The recommended setting (humidity above 90 % for 24 h) fired 180 times, while the highest mold index was 0.39 (growth starts at 1.0, VILPE alarms at 2.5).
- **7 of 7 units had a silent fault.** One fan showed 0 rpm for 379 days, two indoor sensors were silent for 36 days, three outdoor sensors read too warm in the sun, and the crawl space sensors look swapped.
- **No proof of dryness** for buyers, tenants or insurers.

## What DryProof does

| Role | What they get |
|---|---|
| Property owner | Roof map with health scores and a 16-month replay, plain-language advice, value calculator, Dry Structure Certificate with QR code, public building passport |
| VILPE service | Automatic work orders with diagnosis, roof location, directions and technician assignment. Fleet map of all sites |
| Insurer | Portfolio risk grades, certificate checks, prevention tasks with live status |
| Buyers and tenants | Public building passport opened by QR code |

Every trigger is routed automatically. A stopped fan becomes a work order for VILPE service, an alert for the owner and a prevention task for the insurer. When it is resolved, everyone is notified, and after 30 clean days the certificate is renewed.

## How it works

```
VILPE Sense data  ->  Python engine  ->  data.json  ->  React web app
(workbook export)     (6 steps, 19 tests)               (no server needed)
```

### Engine (`engine/`, Python)

| Step | Script | What it does |
|---|---|---|
| A | `step_a_clean.py` | Cleans the workbook. Nothing is deleted, issues are flagged |
| B | `step_b_old_alarm.py` | Reproduces VILPE's default alarm (180 alarms) |
| C | `step_c_mold_index.py` | VTT mold growth model. Matches VILPE's own index without tuning |
| D | `step_d_watchdog.py` | Stopped fans, silent sensors, sun-heated or swapped sensors |
| E | `step_e_health_score.py` | Daily health score 0 to 100 (mold 40, humid time 20, drying 20, system 20) |
| F | `step_f_export.py` | Writes `engine/output/data.json` and `public/data.json` |

Tests: `tests/test_engine.py` (19 tests).

### Web app (`src/`, React + Vite)

| File | Role |
|---|---|
| `src/data.jsx` | Loads `data.json`, remembers the signed-in role |
| `src/workflow.jsx` | Shared workflow, routing table and notifications that link the roles |
| `src/orders.js` | Builds work orders from watchdog findings |
| `src/certification.js` | Dry Structure Certificate rules |
| `src/replay.js` | 16-month replay |
| `src/explain.js` | Plain-language explanations |
| `src/pages/` | One folder per role, plus `flow/` (How it works) and `story/` (pitch mode) |

## Run it

```bash
npm install
npm run dev        # http://localhost:5173
npm run build      # static site in dist/, works on any static host
```

Engine (needs VILPE's data, see below):

```bash
pip install -r engine/requirements.txt
python engine/step_a_clean.py   # then steps b to f
pytest tests
```

## Data note

VILPE's raw workbooks are **not included** in this repository (they belong to VILPE). Place them in `data/raw/` to re-run the engine. The derived results the app needs are included in `public/data.json` and `engine/output/`.

All findings come from the provided data. Example sites, prices and premium changes are labelled as examples or proposals in the app.

## Business model and pilot

- Owners: subscription per structure (proposal €19 a month)
- Insurers: verified risk data per building (proposal €250 a year)
- VILPE service: every finding becomes a planned, billable visit

90-day pilot on existing Sense installations: count silent faults, certify 3 to 5 commercial roofs, test the portfolio view with one insurer. No new hardware needed.
