# Self-audit — app1-apg-composition (WCAG-EM structured)
Date: 2026-07-11 · Auditor: scripted walkthrough (tools/audit_walkthrough.mjs) + author
App state: seeds/app1-apg-composition/dist at time of run · Browser: Playwright Chromium (VERSIONS.md)

## 1. Scope
All pages/routes of serve.json; scripted keyboard route + pattern operations below.
AT matrix: scripted checks (this file) + human screen-reader pass (section 6).

## 2. Landmarks & headings
- [x] single main landmark (found: 1)
- [x] nav labeled: Primary
- [x] skip link present, target resolves (#main)
- heading outline: h1 "Welcome to Acme Tasks" · h2 "Project overview" · h2 "Frequently asked questions" · h3 "How do I create a task?" · h3 "Can I export my data?" · h2 "Preferences" · h2 "Settings"

## 3. Inter-widget focus flow — scripted tab route (13 stops)
 1. a "Skip to main content"
 2. a "Home"
 3. a "Contact form"
 4. a "Dashboard"
 5. a #report-link "Read the quarterly accessibility report"
 6. button #tab-1 [role=tab] "Summary"
 7. div #panel-1 [role=tabpanel] "Three projects are on track this quarter"
 8. button #acc-1-btn "How do I create a task?"
 9. button #acc-2-btn "Can I export my data?"
10. button #open-settings "Open settings"
11. button #like-btn "Like this app"
12. button #term "WCAG"
13. button #ticker-pause "Pause tips"

Note: roving-tabindex composites (tabs/toolbar) intentionally expose one stop.

## 4–5. Titles, route transitions, keyboard operation of every widget
- [x] dialog: focus moves inside on open  — active=select #theme "Theme"
- [x] dialog: Tab stays contained (12 presses)  — button #dlg-save "Save settings"; button #dlg-close "Close settings"; select #theme "Theme"
- [x] dialog: Escape closes, focus returns to trigger  — active=button #open-settings "Open settings"
- [x] tabs: ArrowRight moves focus to tab-2, aria-selected updates  — active=button #tab-2 [role=tab] "Timeline" sel=true
- [x] accordion: Enter expands, aria-expanded=true
- [x] like: Space toggles aria-pressed
- [x] ticker: pause control toggles aria-pressed
- [x] hover card: shown on focus, dismissed by Escape
- [x] route #/form: title updated
- [x] form: focus moves to first invalid field on submit  — active=input #name "Full name *"
- [x] form: error text visible and aria-describedby links it
- [x] dash: async load announces via role=status  — status="3 projects loaded."

All scripted checks pass.

## 6. Screen-reader pass (HUMAN — performed 2026-10-24)
- [x] VoiceOver full pass: announcements on dialog open, live regions, route changes — all behaviors passed; no findings, no quirks recorded (author-reported)
- [x] AT + browser versions: 2026-10-24; macOS 26.7.1 (25G241); VoiceOver 10 (build 993); Chrome 155.0.8059.81 (Official Build, arm64)
- [x] M3.4 check (open modal, `inert` removed in the M3.4 mutant only): mutant's background confirmed reachable in VoiceOver browse mode (author-reported 2026-10-24) — supports the M3.4 `accept` ruling (coding.csv, rubric amendment 2026-10-24). Clean seed's background confirmed unreachable in VoiceOver browse mode (author-reported 2026-10-24).
## 7. Residual items & dispositions
Tool-battery findings dispositioned in seeds/manifest.yaml (baseline frozen 2026-07-11).
