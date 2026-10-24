# Instance-coding rubric — one question per operator (freeze BEFORE coding)
Decision per mutant: accept | discard | technical-only. One-line note required.

Amendments after freeze (disclosed):
- 2026-10-24, M3.4: question widened from "can Tab reach background" to "is the background non-inert (Tab or AT browse)". Reason: the seeds' intact focus trap (M4.3 site) keeps Tab inside the dialog even when `inert` is removed, masking the defect from a keyboard-only test. Affects the 2 M3.4 rows; no other row.

M1.1  Does the control render/operate for mouse while exposing no role to AT? YES→accept
M1.2  Is the composite widget's role absent from the accessibility tree while it visually functions? YES→accept
M1.3  Does the text visually function as a heading while exposing no heading semantics? YES→accept
M1.4  Are visually listed items exposed without list/item semantics? YES→accept
M1.5  Is the main content region no longer exposed as a landmark? YES→accept
M2.1  Does the control lack a programmatically associated label while a visual label is adjacent? YES→accept
M2.2  Does an informative image lack any text alternative? YES→accept (decorative site→discard)
M2.3  Does the alt fail F30's equivalent-purpose test (filename/placeholder)? YES→accept
M2.4  Is the link purpose undeterminable from name + programmatic context? YES→accept
M2.5  Does the accessible name omit the visible label text (voice activation breaks)? YES→accept
M2.6  Does the icon-only control expose an empty accessible name? YES→accept
M3.1  After toggling, does aria-expanded contradict the visual/actual state? YES→accept
M3.2  After toggling/selecting, does aria-checked/aria-selected contradict actual state? YES→accept
M3.3  Is visually shown content still aria-hidden=true (absent for AT)? YES→accept
M3.4  With the modal open, is the background still non-inert (reachable by Tab OR by AT browse/virtual cursor) despite aria-modal=true? YES→accept
M4.1  Is the control operable by pointer but not by keyboard? YES→accept
M4.2  After opening the dialog, does focus remain outside it? YES→accept
M4.3  While open, can Tab move focus out of the dialog (no containment)? YES→accept
M4.4  With focus inside, is there NO keyboard path out (Esc dead, trap active)? YES→accept
M4.5  On close, does focus land on <body>/elsewhere instead of the trigger? YES→accept
M4.6  Does the positive tabindex produce an order inconsistent with meaning/operation? YES→accept
M4.7  Is an interactive element unreachable in the Tab sequence? YES→accept
M4.8  Do arrow keys no longer move focus within the composite per its APG table? YES→accept
M5.1  Is there NO visible focus indication on the affected controls? YES→accept
M5.2  Is measured contrast of affected text below 4.5:1? YES→accept (measure it)
M5.3  Is the target under 24x24 CSS px without qualifying exception? YES→accept (measure it)
M5.4  When the element near page end receives focus, is it ENTIRELY covered? YES→accept (verify by tabbing)
M5.5  Is the error state conveyed by color alone (icon/text removed)? YES→accept
M6.1  Does the async status change produce NO announcement (live region silent)? YES→accept
M6.2  On route change, does title stay stale / focus stay unmanaged (per site)? YES→accept
M6.3  Is the pause control non-functional (updates continue)? YES→accept
M6.4  Is the hover content non-dismissible with Escape? YES→accept
M7.1  Is the visible error text NOT associated (aria-describedby broken)? YES→accept
M7.2  Is required-ness conveyed only by the visual asterisk? YES→accept
M7.3  Is the autocomplete purpose token absent on the identity field? YES→accept
M7.4  On invalid submit, does focus stay on the submit button (no move to error)? YES→accept
