# Breathe-Easy Scheduler v2

Scheduler-first prototype for office booking. This is a **new repository** and is not the live ops viewer.

- Live viewer (do not change): https://github.com/MyDomsHurt/breathe-easy-scheduler
- This prototype: https://github.com/MyDomsHurt/breathe-easy-scheduler-v2

## What this is for

Answer “When can we do your ACs?” in a few seconds, then book it.

The home view is a **week availability board**, not a job list.

- Columns are days, rows are operational slots: morning, late morning, afternoon, late afternoon.
- Each cell shows team load as colour bars (Josh / Matthew / Tiago / Nick / Alun / Iggi).
- Cell colour is remaining capacity: green = open, amber = tight, slate = full.
- Returns are hatched amber. Influencer jobs are dashed violet. Neither fills normal cleaning capacity.
- Click a cell or **Book here** to open a booking form pre-filled with that date, slot, and a suggested team.
- **+ New booking** opens the same form from anywhere.

## Seed data (real week)

The board is seeded from a real operational week taken from the Schedule Master:

- **17–22 August 2026** (105 jobs)
- Dates, team leads, time slots, AC counts, job types, amounts and payment status are **real**
- Client names, mobiles and street addresses are **anonymised**
- Source files: `data/day-2026-08-17.json` … `data/day-2026-08-22.json`

This makes capacity behaviour realistic (some slots genuinely full / over the 6-unit model).

> If the day JSON files are missing or incomplete after a pull, copy them from the project artifacts folder into `data/` and commit.

## Run locally

Serve the folder over HTTP (ES modules and `fetch` will not work from `file://`):

```bash
cd breathe-easy-scheduler-v2
python3 -m http.server 8080
```

Open http://localhost:8080

## Prototype notes

- Job shape matches the live viewer (`date`, `time`, `team_lead`, `client_name`, `mobile`, `address`, `district`, `acs`, `amount`, `payment`, `is_return`, plus `job_type`).
- New bookings persist in `localStorage`. Use **Reset demo data** to go back to the real-week seed.
- No Google auth in this pass — the goal is the board + booking UX.
- Stack is vanilla HTML / CSS / JS. No build step.

## Capacity rules (this pass)

- 6 countable AC units per team per slot.
- Cleaning jobs consume units (`2S` = 2, `5B` = 5).
- Returns and influencer jobs are visible but do not consume cleaning capacity.
- Team suggestion prefers remaining space, then same-day district clustering, then each team’s home area.
- Real week data often exceeds 6 units in busy cells — those cells correctly show as full.

## Next

- Shared backend instead of localStorage
- Import additional weeks / rolling live feed
- Edit / move jobs with live capacity feedback
- Auth and technician day view
