export const trackerSolution={
 html:`<main>
  <h1>School tasks</h1>
  <form id="task-form">
    <label>Task title <input id="title" required></label>
    <label>Subject <input id="subject" required></label>
    <label>Due date (optional) <input id="due" type="date"></label>
    <button type="submit">Add task</button>
    <p id="error" role="alert"></p>
  </form>
  <p id="counts" aria-live="polite"></p>
  <div role="group" aria-label="Task filter">
    <button type="button" data-filter="all">All</button>
    <button type="button" data-filter="active">Active</button>
    <button type="button" data-filter="completed">Completed</button>
  </div>
  <p id="empty"></p><ul id="tasks"></ul>
  <button type="button" id="undo" hidden>Undo delete</button>
</main>`,
 css:`body{font:1rem/1.5 system-ui;max-width:48rem;margin:auto;padding:1rem;color:#17212b}
form{display:grid;gap:.8rem}label{display:grid;gap:.25rem}input,button{font:inherit;padding:.55rem}
button{cursor:pointer}button:focus-visible,input:focus-visible{outline:3px solid #2362aa;outline-offset:2px}
li{padding:.65rem;border-bottom:1px solid #bbc}li.done .title{text-decoration:line-through}
li button{margin-left:.4rem}#error{color:#a21c2b}`,
 js:`const key = "school-tasks-v1";
let tasks = [];
try {
  const saved = JSON.parse(localStorage.getItem(key) || "[]");
  if (Array.isArray(saved) && saved.every(t => t && typeof t.id === "string" && typeof t.title === "string" && typeof t.subject === "string" && typeof t.done === "boolean")) tasks = saved;
} catch { tasks = []; }
let filter = "all";
let removed = null;
const form = document.querySelector("#task-form");
const title = document.querySelector("#title");
const subject = document.querySelector("#subject");
const due = document.querySelector("#due");
const list = document.querySelector("#tasks");
const error = document.querySelector("#error");
const undo = document.querySelector("#undo");
function save() {
  try { localStorage.setItem(key, JSON.stringify(tasks)); error.textContent = ""; }
  catch { error.textContent = "Saving failed in this browser. Your current list remains visible."; }
  render();
}
function render() {
  list.replaceChildren();
  const visible = tasks.filter(t => filter === "all" || (filter === "completed" ? t.done : !t.done));
  document.querySelector("#counts").textContent = tasks.length + " total, " + tasks.filter(t => !t.done).length + " unfinished";
  document.querySelector("#empty").textContent = visible.length ? "" : "No tasks in this view yet.";
  for (const task of visible) {
    const li = document.createElement("li");
    if (task.done) li.className = "done";
    const name = document.createElement("span");
    name.className = "title";
    name.textContent = task.title + " (" + task.subject + ")" + (task.due ? " · " + task.due : "");
    const toggle = document.createElement("button");
    toggle.type = "button";
    toggle.textContent = task.done ? "Mark active" : "Complete";
    toggle.setAttribute("aria-label", toggle.textContent + " " + task.title);
    toggle.onclick = () => { task.done = !task.done; save(); };
    const edit = document.createElement("button");
    edit.type = "button"; edit.textContent = "Edit";
    edit.setAttribute("aria-label", "Edit " + task.title);
    edit.onclick = () => {
      title.value = task.title; subject.value = task.subject; due.value = task.due || "";
      form.dataset.editing = task.id; title.focus();
    };
    const del = document.createElement("button");
    del.type = "button"; del.textContent = "Delete";
    del.setAttribute("aria-label", "Delete " + task.title);
    del.onclick = () => {
      const index = tasks.findIndex(t => t.id === task.id);
      removed = { task, index };
      tasks.splice(index, 1); undo.hidden = false; save();
    };
    li.append(name, toggle, edit, del); list.append(li);
  }
}
form.addEventListener("submit", event => {
  event.preventDefault();
  const cleaned = title.value.trim();
  const cleanedSubject = subject.value.trim();
  if (!cleaned) { error.textContent = "Enter a task title."; title.focus(); return; }
  if (!cleanedSubject) { error.textContent = "Enter a subject."; subject.focus(); return; }
  const editing = tasks.find(t => t.id === form.dataset.editing);
  if (editing) { editing.title = cleaned; editing.subject = cleanedSubject; editing.due = due.value; }
  else tasks.push({ id: crypto.randomUUID(), title: cleaned, subject: cleanedSubject, due: due.value, done: false });
  delete form.dataset.editing; form.reset(); save();
});
document.querySelectorAll("[data-filter]").forEach(button => button.addEventListener("click", () => {
  filter = button.dataset.filter; render();
}));
undo.addEventListener("click", () => {
  if (removed) { tasks.splice(removed.index, 0, removed.task); removed = null; undo.hidden = true; save(); }
});
render();`,
 explanation:'The tracker validates fields before changing the list, gives each task a stable ID, restores only well-shaped saved data, and uses textContent for task text. Edit preserves the same ID; Undo restores a deleted task. The exported project stores data only in its own browser.'
};
