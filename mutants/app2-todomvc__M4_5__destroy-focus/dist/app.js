/* Todos — remediated TodoMVC-class seed. State of truth: the `todos` array
 * and DOM classes; ARIA is set separately so M3-class mutants freeze ARIA
 * without breaking behavior. Tags `// @mut:<OP>:<site>` = mutation sites. */
"use strict";
const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];

let todos = [
  { id: 1, title: "Review pull request", done: false },
  { id: 2, title: "Write status report", done: true },
];
let nextId = 3, filter = "all";

function announce(msg) {
  const r = $("#todo-status");
  r.textContent = ""; setTimeout(() => (r.textContent = msg), 30);
}

/* ---------------- render ---------------- */
function render() {
  const list = $("#todo-list");
  list.textContent = "";
  const visible = todos.filter(t =>
    filter === "all" ? true : filter === "active" ? !t.done : t.done);
  for (const t of visible) {
    const li = $("#todo-item").content.cloneNode(true).firstElementChild;
    li.dataset.id = t.id;
    const cb = $(".toggle", li), label = $(".title", li);
    cb.id = "cb-" + t.id;
    cb.checked = t.done;
    label.htmlFor = cb.id;                                // @mut:M2.1:todo-label
    label.textContent = t.title;
    li.classList.toggle("done", t.done);
    list.append(li);
  }
  const left = todos.filter(t => !t.done).length;
  $("#count").textContent = `${left} item${left === 1 ? "" : "s"} left`;
  const allDone = todos.length > 0 && todos.every(t => t.done);
  $("#toggle-all").classList.toggle("on", allDone);
  $("#toggle-all").setAttribute("aria-checked", String(allDone)); // @mut:M3.2:toggleall-checked
}
render();

/* ---------------- add ---------------- */
function addTodo() {
  const input = $("#new-todo");
  const title = input.value.trim();
  if (!title) return;
  todos.push({ id: nextId++, title, done: false });
  input.value = "";
  render();
  announce(`Added task: ${title}.`);                      // @mut:M6.1:todo-add-announce
}
$("#add-btn").addEventListener("click", addTodo);
$("#new-todo").addEventListener("keydown", e => { if (e.key === "Enter") addTodo(); });

/* ---------------- toggle / toggle-all ---------------- */
$("#todo-list").addEventListener("change", e => {
  if (!e.target.matches(".toggle")) return;
  const t = todos.find(x => x.id === +e.target.closest("li").dataset.id);
  t.done = e.target.checked;
  render();
  announce(t.done ? `Completed: ${t.title}.` : `Reopened: ${t.title}.`);
});
const toggleAll = $("#toggle-all");
function doToggleAll() {
  const target = !todos.every(t => t.done);
  todos.forEach(t => (t.done = target));
  render();
  announce(target ? "All tasks marked complete." : "All tasks reopened.");
}
toggleAll.addEventListener("click", doToggleAll);
toggleAll.addEventListener("keydown", e => {                                    // @mut:M4.1:toggle-key
  if (e.key === " " || e.key === "Enter") { e.preventDefault(); doToggleAll(); } // @mut:M4.1:toggle-key
});                                                                              // @mut:M4.1:toggle-key

/* ---------------- edit (keyboard-operable) ---------------- */
$("#todo-list").addEventListener("click", e => {
  if (e.target.matches(".edit-btn")) startEdit(e.target.closest("li"));
  if (e.target.matches(".destroy")) destroy(e.target.closest("li"));
});
$("#todo-list").addEventListener("dblclick", e => {
  if (e.target.matches(".title")) startEdit(e.target.closest("li"));
});
function startEdit(li) {
  const t = todos.find(x => x.id === +li.dataset.id);
  const field = $(".edit-field", li);
  field.value = t.title;
  field.hidden = false;
  $(".title", li).hidden = true;
  $(".toggle", li).hidden = true;  // its label is the hidden .title — hide together
  field.focus();                                          // @mut:M4.2:edit-focus
  field.addEventListener("keydown", function onKey(e) {   // @mut:M4.1:edit-commit
    if (e.key === "Enter") commit(); if (e.key === "Escape") cancel(); // @mut:M4.1:edit-commit
  });                                                     // @mut:M4.1:edit-commit
  field.addEventListener("blur", commit, { once: true });
  let closed = false;  // re-entrancy guard: keydown + blur must not both fire
  function close() {
    render();
    // defer past the current keydown so Enter/Escape can't retarget onto the
    // refocused Edit button and re-open edit (keyup would re-fire click)
    requestAnimationFrame(() => $(`li[data-id="${t.id}"] .edit-btn`)?.focus());
  }
  function commit() {
    if (closed) return; closed = true;
    field.removeEventListener("blur", commit);
    t.title = field.value.trim() || t.title;
    close();
  }
  function cancel() {
    if (closed) return; closed = true;
    field.removeEventListener("blur", commit);
    close();
  }
}

/* ---------------- destroy with managed focus ---------------- */
function destroy(li) {
  const id = +li.dataset.id;
  const idx = todos.findIndex(x => x.id === id);
  const title = todos[idx].title;
  const next = li.nextElementSibling ?? li.previousElementSibling;
  todos.splice(idx, 1);
  render();
  announce(`Deleted task: ${title}.`);
  const target = next ? $(`li[data-id="${next.dataset.id}"] .destroy`) : $("#new-todo");
}

/* ---------------- clear completed ---------------- */
$("#clear-completed").addEventListener("click", () => {
  const n = todos.filter(t => t.done).length;
  todos = todos.filter(t => !t.done);
  render();
  announce(`Cleared ${n} completed task${n === 1 ? "" : "s"}.`);
  $("#new-todo").focus();
});

/* ---------------- filters (hash router-lite) ---------------- */
window.addEventListener("hashchange", applyFilter);
function applyFilter() {
  filter = { "#/active": "active", "#/completed": "completed" }[location.hash] ?? "all";
  $$("#main nav a").forEach(a =>
    a.dataset.filter === filter
      ? a.setAttribute("aria-current", "true")
      : a.removeAttribute("aria-current"));
  document.title = `Todos — ${filter[0].toUpperCase()}${filter.slice(1)}`; // @mut:M6.2:filter-title
  render();
}
applyFilter();
