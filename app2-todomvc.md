# Self-audit — app2-todomvc (WCAG-EM structured)
Date: 2026-07-11 · Auditor: scripted walkthrough (tools/audit_walkthrough.mjs) + author
App state: seeds/app2-todomvc/dist at time of run · Browser: Playwright Chromium (VERSIONS.md)

## 1. Scope
All pages/routes of serve.json; scripted keyboard route + pattern operations below.
AT matrix: scripted checks (this file) + human screen-reader pass (section 6).

## 2. Landmarks & headings
- [x] single main landmark (found: 1)
- [x] nav labeled: Filter tasks
- [x] skip link present, target resolves (#main)
- heading outline: h1 "Todos" · h2 "Task list"

## 3. Inter-widget focus flow — scripted tab route (14 stops)
 1. a "Skip to main content"
 2. input #new-todo "What needs to be done?"
 3. button #add-btn "Add task"
 4. span #toggle-all [role=checkbox] ""
 5. input #cb-1 "Review pull request"
 6. button "Edit"
 7. button "Delete task"
 8. input #cb-2 "Write status report"
 9. button "Edit"
10. button "Delete task"
11. a "All"
12. a "Active"
13. a "Completed"
14. button #clear-completed "Clear completed"

Note: roving-tabindex composites (tabs/toolbar) intentionally expose one stop.

## 4–5. Titles, route transitions, keyboard operation of every widget
- [x] add: Enter adds task, live region announces  — status="Added task: Audit walkthrough task."
- [x] toggle-all: Space operates, aria-checked updates
- [x] edit: focus moves into edit field  — active=input "Edit task title"
- [x] edit: commit returns focus to Edit button  — active=button "Edit"
- [x] delete: announced via live region  — status="Deleted task: Review pull request (edited)."
- [x] filter route: document title reflects filter  — title="Todos — Active"

All scripted checks pass.

## 6. Screen-reader pass (HUMAN — performed 2026-10-24)
- [x] VoiceOver full pass: announcements on dialog open, live regions, route changes — all behaviors passed; no findings, no quirks recorded (author-reported)
- [x] AT + browser versions: 2026-10-24; macOS 26.7.1 (25G241); VoiceOver 10 (build 993); Chrome 155.0.8059.81 (Official Build, arm64)
## 7. Residual items & dispositions
Tool-battery findings dispositioned in seeds/manifest.yaml (baseline frozen 2026-07-11).
