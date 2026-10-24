# Self-audit — app4-dashboard (WCAG-EM structured)
Date: 2026-07-11 · Auditor: scripted walkthrough (tools/audit_walkthrough.mjs) + author
App state: seeds/app4-dashboard/dist at time of run · Browser: Playwright Chromium (VERSIONS.md)

## 1. Scope
All pages/routes of serve.json; scripted keyboard route + pattern operations below.
AT matrix: scripted checks (this file) + human screen-reader pass (section 6).

## 2. Landmarks & headings
- [x] single main landmark (found: 1)
- [x] nav labeled: Primary
- [x] skip link present, target resolves (#main)
- heading outline: h1 "Overview" · h2 "Key numbers" · h2 "Reset all data?"

## 3. Inter-widget focus flow — scripted tab route (7 stops)
 1. a "Skip to main content"
 2. a "Overview"
 3. a "Projects"
 4. a "Settings"
 5. button #refresh-btn "Refresh metrics"
 6. button #metric-pause "Pause live metric"
 7. button #sla-term "SLA"

Note: roving-tabindex composites (tabs/toolbar) intentionally expose one stop.

## 4–5. Titles, route transitions, keyboard operation of every widget
- [x] refresh: announced via role=status  — status="Metrics updated."
- [x] live metric: pause toggles aria-pressed
- [x] SLA card: shown on focus, Escape dismisses
- [x] route #/projects: title updated  — title="Metrics — Projects"
- [x] toolbar: ArrowRight roves focus  — active=button "Import"
- [x] table: sort click updates aria-sort  — aria-sort=ascending
- [x] confirm dialog: focus moves inside on open  — active=button #confirm-yes "Delete all data"
- [x] confirm dialog: Escape closes, focus returns to trigger  — active=button #reset-btn "Reset all data"
- [x] disclosure: aria-expanded updates

All scripted checks pass.

## 6. Screen-reader pass (HUMAN — performed 2026-10-24)
- [x] VoiceOver full pass: announcements on dialog open, live regions, route changes — all behaviors passed; no findings, no quirks recorded (author-reported)
- [x] AT + browser versions: 2026-10-24; macOS 26.7.1 (25G241); VoiceOver 10 (build 993); Chrome 155.0.8059.81 (Official Build, arm64)
- [x] M3.4 check (open modal, `inert` removed in the M3.4 mutant only): mutant's background confirmed reachable in VoiceOver browse mode (author-reported 2026-10-24) — supports the M3.4 `accept` ruling (coding.csv, rubric amendment 2026-10-24). Clean seed's background confirmed unreachable in VoiceOver browse mode (author-reported 2026-10-24).
## 7. Residual items & dispositions
Tool-battery findings dispositioned in seeds/manifest.yaml (baseline frozen 2026-07-11).
