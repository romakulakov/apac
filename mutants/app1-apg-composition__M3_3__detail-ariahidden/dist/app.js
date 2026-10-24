/* Acme Tasks — benchmark seed. Vanilla JS, APG-conformant behavior.
 *
 * Lines tagged `// @mut:<OPERATOR>:<site>` are MUTATION SITES: the generator
 * deletes exactly the tagged line(s) to produce the mutant ("the developer
 * forgot this line"). Tags are an addressing mechanism only — the unmutated
 * app is fully functional and conformant with the tags present.
 */
"use strict";

const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];

/* ---------------- live-region announcer ---------------- */
function announce(regionId, msg) {
  const r = $("#" + regionId);
  if (r) { r.textContent = ""; setTimeout(() => (r.textContent = msg), 30); }
}

/* ---------------- hash router (SPA route change) ---------------- */
const VIEWS = { "": "view-home", "form": "view-form", "dash": "view-dash" };
function route() {
  const key = location.hash.replace(/^#\//, "").replace(/^#$/, "");
  const id = VIEWS[key] ?? "view-home";
  $$(".view").forEach(v => (v.hidden = v.id !== id));
  const view = $("#" + id);
  document.title = view.dataset.title;                    // @mut:M6.2:router-title
  $("#main").focus();                                     // @mut:M6.2:router-focus
}
window.addEventListener("hashchange", route);
route();

/* ---------------- modal dialog (APG Dialog-Modal) ---------------- */
const overlay = $("#overlay"), dialog = $("#settings-dialog");
const openBtn = $("#open-settings"), closeBtn = $("#dlg-close"), saveBtn = $("#dlg-save");
let lastFocused = null;

function focusablesIn(el) {
  return $$('button, select, input, a[href], [tabindex]:not([tabindex="-1"])', el)
    .filter(e => !e.hidden && e.offsetParent !== null);
}
function setBackgroundInert(on) {
  ["header", "main", "footer"].forEach(sel => {
    const el = $(sel);
    if (!on) { el.removeAttribute("inert"); return; }     // close: restore background
    el.setAttribute("inert", "");                         // @mut:M3.4:settings-dlg
  });
}
function openDialog() {
  lastFocused = document.activeElement;
  overlay.hidden = false;
  setBackgroundInert(true);
  focusablesIn(dialog)[0].focus();                        // @mut:M4.2:settings-dlg
  document.addEventListener("keydown", onDialogKeydown);
}
function closeDialog() {
  overlay.hidden = true;
  setBackgroundInert(false);
  document.removeEventListener("keydown", onDialogKeydown);
  lastFocused && lastFocused.focus();                     // @mut:M4.5:settings-dlg
}
function onDialogKeydown(e) {
  if (e.key === "Escape") { e.preventDefault(); closeDialog(); } // @mut:M4.4:settings-dlg
  if (e.key === "Tab") trapFocus(e);                      // @mut:M4.3:settings-dlg
}
function trapFocus(e) {
  const f = focusablesIn(dialog);
  const first = f[0], last = f[f.length - 1];
  if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
  else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
}
openBtn.addEventListener("click", openDialog);
closeBtn.addEventListener("click", closeDialog);
saveBtn.addEventListener("click", closeDialog);

/* ---------------- tabs (APG Tabs, roving tabindex) ---------------- */
const tablist = $('#tabs [role="tablist"]');
const tabs = $$('#tabs [role="tab"]');
function selectTab(tab) {
  tabs.forEach(t => {
    const sel = t === tab;
    t.tabIndex = sel ? 0 : -1;                 // visuals key off tabindex
    $("#" + t.getAttribute("aria-controls")).hidden = !sel;
    t.setAttribute("aria-selected", String(sel));         // @mut:M3.2:tabs-selected
  });
  tab.focus();
}
tabs.forEach(t => t.addEventListener("click", () => selectTab(t)));
tablist.addEventListener("keydown", e => {
  const i = tabs.indexOf(document.activeElement);
  if (i < 0) return;
  if (e.key === "ArrowRight") selectTab(tabs[(i + 1) % tabs.length]);          // @mut:M4.8:tabs-arrows
  if (e.key === "ArrowLeft") selectTab(tabs[(i - 1 + tabs.length) % tabs.length]); // @mut:M4.8:tabs-arrows
  if (e.key === "Home") selectTab(tabs[0]);
  if (e.key === "End") selectTab(tabs[tabs.length - 1]);
});

/* ---------------- accordion (disclosure) ---------------- */
$$(".acc-trigger").forEach(btn => {
  btn.addEventListener("click", () => {
    const panel = $("#" + btn.getAttribute("aria-controls"));
    const open = !panel.hidden;                 // state source: visibility
    panel.hidden = open;
    btn.setAttribute("aria-expanded", String(!open));     // @mut:M3.1:faq-expanded
  });
});

/* ---------------- like button (keyboard-operable custom control) ------- */
const like = $("#like-btn");
function toggleLike() {
  like.setAttribute("aria-pressed", String(like.getAttribute("aria-pressed") !== "true"));
}
like.addEventListener("click", toggleLike);
like.addEventListener("keydown", e => {                   // @mut:M4.1:like-key
  if (e.key === "Enter" || e.key === " ") { e.preventDefault(); toggleLike(); } // @mut:M4.1:like-key
});                                                       // @mut:M4.1:like-key

/* ---------------- hover/focus card (SC 1.4.13) ---------------- */
const term = $("#term"), card = $("#hovercard");
function showCard() { card.hidden = false; }
function hideCard() { card.hidden = true; }
term.addEventListener("mouseenter", showCard);
term.addEventListener("focus", showCard);
term.addEventListener("mouseleave", () => { if (!card.matches(":hover")) hideCard(); });
card.addEventListener("mouseleave", hideCard);            // hoverable content
term.addEventListener("blur", hideCard);
document.addEventListener("keydown", e => {
  if (e.key === "Escape" && !card.hidden) hideCard();     // @mut:M6.4:hovercard-esc
});

/* ---------------- auto-updating ticker (SC 2.2.2) ---------------- */
const TIPS = ["Tip 1 of 3: use landmarks.", "Tip 2 of 3: label your inputs.",
              "Tip 3 of 3: manage focus on route change."];
let tipIdx = 0, tickerTimer = setInterval(nextTip, 5000);
function nextTip() { tipIdx = (tipIdx + 1) % TIPS.length; $("#ticker").textContent = TIPS[tipIdx]; }
$("#ticker-pause").addEventListener("click", e => {
  const b = e.currentTarget, paused = b.getAttribute("aria-pressed") === "true";
  if (paused) { tickerTimer = setInterval(nextTip, 5000); } // resume
  if (!paused) clearInterval(tickerTimer);                // @mut:M6.3:ticker-pause
  b.setAttribute("aria-pressed", String(!paused));
  b.textContent = paused ? "Pause tips" : "Resume tips";
});

/* ---------------- contact form (validation + error recovery) ---------- */
const form = $("#contact");
function setInvalid(input, on) {
  input.setAttribute("aria-invalid", String(on));
  $("#" + input.id + "-err").hidden = !on;
  input.classList.toggle("invalid", on);
}
form.addEventListener("submit", e => {
  e.preventDefault();
  const name = $("#name"), email = $("#email");
  const bad = [];
  setInvalid(name, !name.value.trim()); if (!name.value.trim()) bad.push(name);
  const okEmail = /.+@.+\..+/.test(email.value);
  setInvalid(email, !okEmail); if (!okEmail) bad.push(email);
  if (bad.length) {
    announce("form-status", `${bad.length} field(s) need attention.`);
    bad[0].focus();                                       // @mut:M7.4:form-first-invalid
  } else {
    form.reset();
    $("#form-status").textContent = "Message sent. We will reply within two days.";
  }
});

/* ---------------- dashboard: async load + status (SC 4.1.3) ----------- */
$("#load-btn").addEventListener("click", () => {
  $("#load-result").textContent = "Loading…";
  setTimeout(() => {
    $("#load-result").textContent = "3 projects loaded.";
    announce("dash-status", "3 projects loaded.");        // @mut:M6.1:load-announce
  }, 400);
});

/* ---------------- custom checkbox (state sync, SC 4.1.2) -------------- */
const notif = $("#notif-toggle");
function toggleNotif() {
  const on = notif.classList.contains("on");  // state source: class
  notif.classList.toggle("on", !on);
  notif.setAttribute("aria-checked", String(!on));        // @mut:M3.2:notif-checked
}
notif.addEventListener("click", toggleNotif);
notif.addEventListener("keydown", e => {
  if (e.key === " " || e.key === "Enter") { e.preventDefault(); toggleNotif(); }
});

/* ---------------- reveal panel (stale aria-hidden host) --------------- */
$("#reveal-btn").addEventListener("click", e => {
  const btn = e.currentTarget, panel = $("#detail-panel");
  const open = btn.getAttribute("aria-expanded") === "true";
  btn.setAttribute("aria-expanded", String(!open));
  panel.hidden = open;
});
