/* Acme Metrics — dashboard seed. State of truth: JS data + hidden/tabindex;
 * ARIA and title updates are separate taggable lines (M3-class discipline).
 * Tags `// @mut:<OP>:<site>` mark mutation sites. */
"use strict";
const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];

function announce(msg) {
  const r = $("#app-status");
  r.textContent = ""; setTimeout(() => (r.textContent = msg), 30);
}

/* ---------------- hash router ---------------- */
const VIEWS = { "": "view-overview", "projects": "view-projects", "settings": "view-settings" };
function route() {
  const key = location.hash.replace(/^#\//, "").replace(/^#$/, "");
  const id = VIEWS[key] ?? "view-overview";
  $$(".view").forEach(v => (v.hidden = v.id !== id));
  const view = $("#" + id);
  document.title = view.dataset.title;                    // @mut:M6.2:dash-title
}
window.addEventListener("hashchange", route);
route();

/* ---------------- async refresh (SC 4.1.3 host) ---------------- */
$("#refresh-btn").addEventListener("click", () => {
  $("#refresh-result").textContent = "Refreshing…";
  setTimeout(() => {
    $('[data-kpi="users"]').textContent = (1200 + Math.floor(Math.random() * 20)).toLocaleString();
    $("#refresh-result").textContent = "Metrics updated.";
    announce("Metrics updated.");                         // @mut:M6.1:refresh-announce
  }, 400);
});

/* ---------------- live metric with pause (SC 2.2.2) ---------------- */
let reqPerMin = 312;
let liveTimer = setInterval(tickMetric, 4000);
function tickMetric() {
  reqPerMin += Math.floor(Math.random() * 21) - 10;
  $("#live-metric").textContent = `Requests/min: ${reqPerMin}`;
}
$("#metric-pause").addEventListener("click", e => {
  const b = e.currentTarget, paused = b.getAttribute("aria-pressed") === "true";
  if (paused) { liveTimer = setInterval(tickMetric, 4000); } // resume
  if (!paused) clearInterval(liveTimer);                  // @mut:M6.3:metric-pause
  b.setAttribute("aria-pressed", String(!paused));
  b.textContent = paused ? "Pause live metric" : "Resume live metric";
});

/* ---------------- hover card (SC 1.4.13 host) ---------------- */
const slaTerm = $("#sla-term"), slaCard = $("#sla-card");
const showSla = () => (slaCard.hidden = false);
const hideSla = () => (slaCard.hidden = true);
slaTerm.addEventListener("mouseenter", showSla);
slaTerm.addEventListener("focus", showSla);
slaTerm.addEventListener("mouseleave", () => { if (!slaCard.matches(":hover")) hideSla(); });
slaCard.addEventListener("mouseleave", hideSla);
slaTerm.addEventListener("blur", hideSla);
document.addEventListener("keydown", e => {
  if (e.key === "Escape" && !slaCard.hidden) hideSla();   // @mut:M6.4:sla-esc
});

/* ---------------- sortable table (aria-sort sync host) ---------------- */
let projects = [
  { name: "Website relaunch", owner: "Dana", tasks: 12 },
  { name: "Mobile application", owner: "Priya", tasks: 8 },
  { name: "Design system", owner: "Leo", tasks: 17 },
];
let sortKey = "tasks", sortDir = "descending";

function renderTable() {
  const body = $("#proj-body");
  body.textContent = "";
  const rows = [...projects].sort((a, b) => {
    const va = a[sortKey], vb = b[sortKey];
    const cmp = typeof va === "number" ? va - vb : String(va).localeCompare(String(vb));
    return sortDir === "ascending" ? cmp : -cmp;
  });
  for (const p of rows) {
    const tr = document.createElement("tr");
    tr.innerHTML = `<th scope="row">${p.name}</th><td>${p.owner}</td><td>${p.tasks}</td>`;
    body.append(tr);
  }
  $$("#proj-table th[scope='col']").forEach(th => {
    const key = $(".sort", th).dataset.key;
    const val = key === sortKey ? sortDir : "none";
    th.setAttribute("aria-sort", val);                    // @mut:M3.2:table-ariasort
  });
}
renderTable();
$$("#proj-table .sort").forEach(btn => btn.addEventListener("click", () => {
  const key = btn.dataset.key;
  sortDir = key === sortKey && sortDir === "ascending" ? "descending" : "ascending";
  sortKey = key;
  renderTable();
  announce(`Table sorted by ${btn.textContent}, ${sortDir}.`);
}));

/* ---------------- roving-tabindex toolbar (APG Toolbar) ---------------- */
const toolbar = $("#proj-toolbar");
const tbButtons = $$("button", toolbar);
toolbar.addEventListener("keydown", e => {
  const i = tbButtons.indexOf(document.activeElement);
  if (i < 0) return;
  let j = null;
  if (e.key === "ArrowRight") j = (i + 1) % tbButtons.length;            // @mut:M4.8:toolbar-arrows
  if (e.key === "ArrowLeft") j = (i - 1 + tbButtons.length) % tbButtons.length; // @mut:M4.8:toolbar-arrows
  if (e.key === "Home") j = 0;
  if (e.key === "End") j = tbButtons.length - 1;
  if (j !== null) {
    e.preventDefault();
    tbButtons.forEach((b, k) => (b.tabIndex = k === j ? 0 : -1));
    tbButtons[j].focus();
  }
});

/* ---------------- confirm dialog (APG Dialog-Modal, 2nd instance) ------ */
const overlay = $("#confirm-overlay"), dialog = $("#confirm-dialog");
const resetBtn = $("#reset-btn");
let lastFocused = null;

function focusablesIn(el) {
  return $$('button, select, input, a[href], [tabindex]:not([tabindex="-1"])', el)
    .filter(e => !e.hidden);
}
function setInert(on) {
  ["header", "main", "footer"].forEach(sel => {
    const el = $(sel);
    if (!on) { el.removeAttribute("inert"); return; }     // close: restore background
    el.setAttribute("inert", "");                         // @mut:M3.4:confirm-dlg
  });
}
function openConfirm() {
  lastFocused = document.activeElement;
  overlay.hidden = false;
  setInert(true);
  focusablesIn(dialog)[0].focus();                        // @mut:M4.2:confirm-dlg
  document.addEventListener("keydown", onConfirmKeydown);
}
function closeConfirm() {
  overlay.hidden = true;
  setInert(false);
  document.removeEventListener("keydown", onConfirmKeydown);
  lastFocused && lastFocused.focus();                     // @mut:M4.5:confirm-dlg
}
function onConfirmKeydown(e) {
  if (e.key === "Escape") { e.preventDefault(); closeConfirm(); } // @mut:M4.4:confirm-dlg
  if (e.key === "Tab") {                                  // @mut:M4.3:confirm-dlg
    const f = focusablesIn(dialog), first = f[0], last = f[f.length - 1]; // @mut:M4.3:confirm-dlg
    if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); } // @mut:M4.3:confirm-dlg
    else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); } // @mut:M4.3:confirm-dlg
  }                                                       // @mut:M4.3:confirm-dlg
}
resetBtn.addEventListener("click", openConfirm);
$("#confirm-no").addEventListener("click", closeConfirm);
$("#confirm-yes").addEventListener("click", () => {
  closeConfirm();
  announce("All data deleted.");
});

/* ---------------- reveal panel (stale aria-hidden host) --------------- */
$("#adv-btn").addEventListener("click", e => {
  const btn = e.currentTarget, panel = $("#adv-panel");
  const open = !panel.hidden;
  panel.hidden = open;
  btn.setAttribute("aria-expanded", String(!open));       // @mut:M3.1:adv-expanded
  panel.setAttribute("aria-hidden", String(open));        // @mut:M3.3:adv-ariahidden
});
