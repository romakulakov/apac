/* Service signup — multi-step form seed (GOV.UK/USWDS pattern style).
 * State of truth: `step` variable and hidden attributes; ARIA/titles are
 * separate, taggable updates. Tags `// @mut:<OP>:<site>` = mutation sites. */
"use strict";
const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];

let step = 1;
const STEPS = 3;
const data = {};

function announce(msg) {
  const r = $("#form-status");
  r.textContent = ""; setTimeout(() => (r.textContent = msg), 30);
}

/* ---------------- step navigation (SPA-like view change) -------------- */
function showStep(n) {
  step = n;
  $$(".step").forEach(fs => (fs.hidden = fs.id !== `step-${n}`));
  $("#step-num").textContent = String(n);
  $("#back-btn").hidden = n === 1;
  $("#next-btn").textContent = n === STEPS ? "Submit application" : "Continue";
  hideErrors();
  const fs = $(`#step-${n}`);
  $(`#h-step-${n}`).focus();                              // @mut:M6.2:step-focus
  if (n === 3) buildReview();
}

/* ---------------- validation ---------------- */
const VALIDATORS = {
  1: [["full-name", v => v.trim() !== ""],
      ["email", v => /.+@.+\..+/.test(v)],
      ["phone", v => v === "" || /^[\d\s+()-]{6,}$/.test(v)]],
  2: [["street", v => v.trim() !== ""],
      ["city", v => v.trim() !== ""],
      ["postal", v => v.trim() !== ""]],
  3: [["consent", (_, el) => el.checked]],
};

function hideErrors() {
  $("#error-summary").hidden = true;
  $$(".error").forEach(e => (e.hidden = true));
  $$("input").forEach(i => i.removeAttribute("aria-invalid"));
}

function validateStep(n) {
  const bad = [];
  for (const [id, ok] of VALIDATORS[n]) {
    const el = $("#" + id);
    const valid = ok(el.value, el);
    el.setAttribute("aria-invalid", String(!valid));
    $("#" + id + "-err").hidden = valid;
    if (!valid) bad.push(el);
  }
  return bad;
}

function showErrorSummary(bad) {
  const list = $("#err-list");
  list.textContent = "";
  for (const el of bad) {
    const li = document.createElement("li");
    const a = document.createElement("a");
    a.href = "#" + el.id;
    a.textContent = $(`label[for="${el.id}"]`).textContent + " — needs attention";
    a.addEventListener("click", ev => { ev.preventDefault(); el.focus(); }); // @mut:M7.4:summary-links
    li.append(a); list.append(li);
  }
  $("#error-summary").hidden = false;
  $("#error-summary").focus();                            // @mut:M7.4:summary-focus
  announce(`${bad.length} field${bad.length === 1 ? "" : "s"} need attention.`);
}

/* ---------------- review + submit ---------------- */
function buildReview() {
  const dl = $("#review");
  dl.textContent = "";
  const LABELS = { "full-name": "Full name", email: "Email", phone: "Phone",
                   street: "Street address", city: "City", postal: "Postal code" };
  for (const [k, label] of Object.entries(LABELS)) {
    const dt = document.createElement("dt"); dt.textContent = label;
    const dd = document.createElement("dd"); dd.textContent = data[k] || "—";
    dl.append(dt, dd);
  }
}

function collectStep(n) {
  for (const [id] of VALIDATORS[n]) data[id] = $("#" + id).value;
}

$("#wizard").addEventListener("submit", e => {
  e.preventDefault();
  const bad = validateStep(step);
  if (bad.length) { showErrorSummary(bad); return; }
  collectStep(step);
  if (step < STEPS) {
    showStep(step + 1);
    announce(`Step ${step} of ${STEPS}.`);                // @mut:M6.1:step-announce
  } else {
    $("#wizard").hidden = true;
    $("#progress").hidden = true;
    document.title = "Service signup — Application sent";
    const done = document.createElement("h1");
    done.id = "done-heading"; done.tabIndex = -1;
    done.textContent = "Application sent";
    $("#main").append(done);
    done.focus();
    announce("Application sent. We will email you within two days.");
  }
});
$("#back-btn").addEventListener("click", () => showStep(step - 1));
showStep(1);
