# Self-audit — app3-form (WCAG-EM structured)
Date: 2026-07-11 · Auditor: scripted walkthrough (tools/audit_walkthrough.mjs) + author
App state: seeds/app3-form/dist at time of run · Browser: Playwright Chromium (VERSIONS.md)

## 1. Scope
All pages/routes of serve.json; scripted keyboard route + pattern operations below.
AT matrix: scripted checks (this file) + human screen-reader pass (section 6).

## 2. Landmarks & headings
- [x] single main landmark (found: 1)
- [x] nav labeled: (no navs)
- [x] skip link present, target resolves (#main)
- heading outline: h1 "Your details"

## 3. Inter-widget focus flow — scripted tab route (5 stops)
 1. a "Skip to main content"
 2. input #full-name "Full name"
 3. input #email "Email address"
 4. input #phone "Phone number (optional)"
 5. button #next-btn "Continue"

Note: roving-tabindex composites (tabs/toolbar) intentionally expose one stop.

## 4–5. Titles, route transitions, keyboard operation of every widget
- [x] invalid submit: focus moves to error summary  — active=div #error-summary [role=alert] "There is a problem\n      Full name — nee"
- [x] error summary lists per-field links  — 2 links
- [x] summary link moves focus to its field  — active=input #full-name "Full name"
- [x] field error associated via aria-describedby
- [x] step 2: heading receives focus on transition  — active=h1 #h-step-2 "Your address"
- [x] step 2: title updated  — title="Service signup — Step 2 of 3"
- [x] step 3: heading receives focus  — active=h1 #h-step-3 "Check your answers"

All scripted checks pass.

## 6. Screen-reader pass (HUMAN — performed 2026-10-24)
- [x] VoiceOver full pass: announcements on dialog open, live regions, route changes — all behaviors passed; no findings, no quirks recorded (author-reported)
- [x] AT + browser versions: 2026-10-24; macOS 26.7.1 (25G241); VoiceOver 10 (build 993); Chrome 155.0.8059.81 (Official Build, arm64)
## 7. Residual items & dispositions
Tool-battery findings dispositioned in seeds/manifest.yaml (baseline frozen 2026-07-11).
