let tasks = [];
let birthdayEvents = [];
let notes = [];
let expenses = [];
let editingNoteId = null;
let currentDate = new Date();

// ✅ Load all data from external JSON files
window.addEventListener('load', () => {
  Promise.all([
    fetch("tasks.json").then(res => res.ok ? res.json() : []),
    fetch("birthdayEvents.json").then(res => res.ok ? res.json() : []),
    fetch("notes.json").then(res => res.ok ? res.json() : []),
    fetch("expenses.json").then(res => res.ok ? res.json() : [])
  ])
    .then(([loadedTasks, loadedBirthdays, loadedNotes, loadedExpenses]) => {
      tasks = loadedTasks || [];
      birthdayEvents = loadedBirthdays || [];
      notes = loadedNotes || [];

      if (!localStorage.getItem("expenses")) {
        localStorage.setItem("expenses", JSON.stringify(loadedExpenses || []));
      }

     const last = localStorage.getItem("lastSection") || "todo";
const btn = document.querySelector(`.menu-btn[onclick*="showSection('${last}'"]`);
if (btn) showSection(last, btn);

    })
    .catch(err => {
      console.error("❌ Error loading JSON files:", err);
    });
});


const form = document.getElementById("taskForm");
const taskList = document.getElementById("taskList");
const searchInput = document.getElementById("searchInput");

form?.addEventListener("submit", saveTask);

function saveTask(e) {
  e.preventDefault();
  const id = document.getElementById("taskId").value || Date.now();
  const title = document.getElementById("taskTitle").value.trim();
  const priority = document.getElementById("taskPriority").value;
  const dueDate = document.getElementById("taskDueDate").value;
  const status = document.getElementById("taskStatus").value;
  const tag = document.getElementById("taskTag").value.trim();

  if (!title || !status) {
    alert("Task Title and Status are required.");
    return;
  }

  const taskData = { id: Number(id), title, priority, dueDate, status, tag };
  const existingIndex = tasks.findIndex(t => t.id === Number(id));
  existingIndex !== -1 ? tasks[existingIndex] = taskData : tasks.push(taskData);

  // ❌ Changes not persisted to file — browser can't write to JSON
  console.warn("Changes saved in memory only — JSON files are read-only in browser.");

  form.reset();
  document.getElementById("taskId").value = "";
  renderTasks?.();
}

function renderTasks() {
  const filter = searchInput.value.toLowerCase();
  taskList.innerHTML = "";

  tasks
    .filter(t => t.title && t.title.toLowerCase().includes(filter))
    .sort((a, b) => {
  if (a.pinned && !b.pinned) return -1; // pinned comes first
  if (!a.pinned && b.pinned) return 1;
  return new Date(a.dueDate || 0) - new Date(b.dueDate || 0);
})

    .forEach(task => {
      const col = document.createElement("div");
      col.className = "col-md-2";

      const card = document.createElement("div");
      const priorityClass = task.priority ? task.priority.toLowerCase() : "";
      card.className = `card task-card border-start border-4 ${priorityClass}`;

      const cardBody = document.createElement("div");
      cardBody.className = "card-body d-flex flex-column align-items-center justify-content-center text-center";

      // ✅ Priority Badge (Top-Left)
      const priority = task.priority
        ? `<div class="priority-badge bg-priority-${priorityClass}">${task.priority}</div>`
        : "";
        const pinned = task.pinned
  ? `<span class="icon-pin text-warning me-1" title="Pinned">📌</span>`
  : "";

      // ✅ Edit/Delete Icons (Top-Right)
      const actions = `
        <div class="task-actions">
        ${pinned}
          <button class="icon-btn text-primary" onclick="editTask(${task.id})" title="Edit">✏️</button>
          <button class="icon-btn text-danger" onclick="deleteTask(${task.id})" title="Delete">🗑️</button>
        </div>`;

       const title = `<h5 class="card-title mb-2">${task.title}</h5>`;


      const status = task.status ? `<span class="badge bg-${getStatusColor(task.status)}">${task.status}</span>` : "";
      const tag = task.tag ? `<span class="badge text-bg-light ms-2">${task.tag}</span>` : "";
      const overdue = task.dueDate && new Date(task.dueDate) < new Date() && task.status !== "Done"
        ? `<span class="badge bg-danger ms-2">Overdue</span>` : "";
      const due = task.dueDate
  ? `<p class="card-subtitle small text-muted mt-1">Due: ${new Date(task.dueDate).toDateString()}</p>`
  : "";

      // 🧱 Compose the card
      cardBody.innerHTML = `
  <div class="d-flex justify-content-between align-items-start w-100 mb-2">
    ${priority}
    ${actions}
  </div>
  ${title}
  <div class="mb-1">${status} ${tag} ${overdue}</div>
  ${due}
`;
      card.appendChild(cardBody);
      col.appendChild(card);
      taskList.appendChild(col);
    });
}


function getStatusColor(status) {
  return { "To Do": "secondary", "In Progress": "warning", "Done": "success" }[status] || "light";
}

function deleteTask(id) {
  if (confirm("Are you sure you want to delete this task?")) {
    tasks = tasks.filter(t => t.id !== id);
    localStorage.setItem("tasks", JSON.stringify(tasks));
    renderTasks();
  }
}

function editTask(id) {
  const task = tasks.find(t => t.id === id);
  if (!task) return;
  document.getElementById("taskId").value = task.id;
  document.getElementById("taskTitle").value = task.title;
  document.getElementById("taskPriority").value = task.priority || "";
  document.getElementById("taskDueDate").value = task.dueDate;
  document.getElementById("taskStatus").value = task.status;
  document.getElementById("taskTag").value = task.tag || "";
  scrollToForm();
}

function scrollToForm() {
  const formSection = document.getElementById("formSection");
  if (formSection) formSection.scrollIntoView({ behavior: "smooth" });
}




// ===================== Notes Section =====================
const noteForm = document.getElementById("noteForm");
const noteList = document.getElementById("noteList");

noteForm?.addEventListener("submit", e => {
  e.preventDefault();
  const title = document.getElementById("noteTitle").value.trim();
const body = document.getElementById("noteBody").value.trim();
const tag = document.getElementById("noteTag").value.trim();
const pinned = document.getElementById("notePin").checked;

// 🔐 New: At least one field must be filled
if (!title && !body) {
  alert("Please enter at least a title or note body.");
  return;
}


  if (editingNoteId) {
    const index = notes.findIndex(n => n.id === editingNoteId);
    if (index !== -1) notes[index] = { ...notes[index], title, body, tag, pinned };
    editingNoteId = null;
  } else {
    notes.push({ id: Date.now(), title, body, tag, pinned });
  }

  localStorage.setItem("notes", JSON.stringify(notes));
  noteForm.reset();
  document.getElementById("noteSubmitBtn").textContent = "➕ Add Note";
  document.getElementById("editBanner").classList.add("d-none");
  renderNotes();
});

function renderNotes() {
  noteList.innerHTML = "";
  const sorted = [...notes].sort((a, b) => b.pinned - a.pinned);

  sorted.forEach(note => {
    const col = document.createElement("div");
    col.className = "col-md-2";

    const card = document.createElement("div");
    card.className = "card note-card border-start border-4 h-100 position-relative";

    const cardBody = document.createElement("div");
    cardBody.className = "card-body d-flex flex-column align-items-center justify-content-center text-center";

    // 🔧 Top-right icon buttons (pin + edit + delete)
    const actions = document.createElement("div");
    actions.className = "position-absolute top-0 end-0 m-2 d-flex align-items-center gap-1";

    // 📌 Top-left Pin Icon
if (note.pinned) {
  const pinIcon = document.createElement("span");
  pinIcon.className = "position-absolute top-0 start-0 m-2 badge bg-warning text-dark";
  pinIcon.title = "Pinned";
  pinIcon.innerText = "📌";
  card.appendChild(pinIcon);
}


    const editBtn = document.createElement("button");
    editBtn.className = "icon-btn text-primary";
    editBtn.title = "Edit";
    editBtn.innerHTML = "✏️";
    editBtn.onclick = () => editNote(note.id);

    const deleteBtn = document.createElement("button");
    deleteBtn.className = "icon-btn text-danger";
    deleteBtn.title = "Delete";
    deleteBtn.innerHTML = "🗑️";
    deleteBtn.onclick = () => deleteNote(note.id);

    actions.appendChild(editBtn);
    actions.appendChild(deleteBtn);
    card.appendChild(actions);

    const title = note.title ? `<h5 class="card-title mb-2">${note.title}</h5>` : "";
    const tag = note.tag ? `<span class="badge text-bg-light">${note.tag}</span>` : "";

    cardBody.innerHTML = title + `<p class="card-text">${note.body}</p>` + tag;
    card.appendChild(cardBody);
    col.appendChild(card);
    noteList.appendChild(col);
  });
}

function deleteNote(id) {
  const note = notes.find(n => n.id === id);
  if (!note) return;

  const confirmDelete = confirm(`Delete this note${note.title ? `: "${note.title}"` : ""}?`);
  if (!confirmDelete) return;

  notes = notes.filter(note => note.id !== id);
  localStorage.setItem("notes", JSON.stringify(notes));
  renderNotes();
}


function editNote(id) {
  const note = notes.find(n => n.id === id);
  if (!note) return;

  editingNoteId = id;
  document.getElementById("noteTitle").value = note.title;
  document.getElementById("noteBody").value = note.body;
  document.getElementById("noteTag").value = note.tag || "";
  document.getElementById("notePin").checked = note.pinned;

  document.getElementById("noteSubmitBtn").textContent = "💾 Update Note";
  document.getElementById("editBanner").classList.remove("d-none");

  // ✅ Scroll to the note form
  scrollToNoteForm();
}

function scrollToNoteForm() {
  const noteFormSection = document.getElementById("noteForm");
  if (noteFormSection) {
    noteFormSection.scrollIntoView({ behavior: "smooth", block: "start" });
  }
}


function cancelEditNote() {
  editingNoteId = null;
  noteForm.reset();
  document.getElementById("noteSubmitBtn").textContent = "➕ Add Note";
  document.getElementById("editBanner").classList.add("d-none");
}

// ===================== Calendar =====================
function renderCalendar(dateObj = new Date()) {
  const calendarGrid = document.getElementById("calendarGrid");
  const calendarMonth = document.getElementById("calendarMonth");
  calendarGrid.innerHTML = "";

  const year = dateObj.getFullYear();
  const month = dateObj.getMonth();
  calendarMonth.textContent = dateObj.toLocaleString("default", { month: "long", year: "numeric" });

  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  for (let i = 0; i < firstDay; i++) {
    const blank = document.createElement("div");
    blank.className = "calendar-day";
    calendarGrid.appendChild(blank);
  }

  for (let d = 1; d <= daysInMonth; d++) {
    const dayDate = new Date(year, month, d);
    const dateStr = `${dayDate.getFullYear()}-${String(dayDate.getMonth() + 1).padStart(2, '0')}-${String(dayDate.getDate()).padStart(2, '0')}`;

    const dayBox = document.createElement("div");
    dayBox.className = "calendar-day";
    const dateNum = document.createElement("span");
dateNum.className = "day-number";
dateNum.textContent = d;
dayBox.appendChild(dateNum);



    const today = new Date();
    if (
      dayDate.getFullYear() === today.getFullYear() &&
      dayDate.getMonth() === today.getMonth() &&
      dayDate.getDate() === today.getDate()
    ) {
      dayBox.classList.add("today");
    }

   let indicators = "";

// Task dot
if (tasks.some(t => t.dueDate === dateStr)) {
  dayBox.classList.add("has-task");
  indicators += `<span class="task-dot"></span>`;
}

// Birthday icon
if (birthdayEvents.some(b => b.date === dateStr)) {
  dayBox.classList.add("has-birthday");
  indicators += `<span class="birthday-icon" title="${birthdayEvents
    .filter(b => b.date === dateStr)
    .map(b => `${b.name} (${b.type})`)
    .join(", ")}">🎂</span>`;
}

// Append indicators inside the day box
dayBox.innerHTML = `<div class="day-number">${d}</div>${indicators}`;


    dayBox.addEventListener("click", () => showTasksForDate(dateStr, true));
    calendarGrid.appendChild(dayBox);
  }

  // ✅ Use local time for today's date
  const today = new Date();
  const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
  showTasksForDate(todayStr);
}


function showTasksForDate(dateStr, triggerByClick = false) {
  const selectedDate = new Date(dateStr);

  // 🔁 Monthly ToDo Label and List (below calendar)
  const selectedDateLabel = document.getElementById("selectedDateLabel");
  const tasksList = document.getElementById("tasksList");

  const year = selectedDate.getFullYear();
  const month = selectedDate.getMonth();

  selectedDateLabel.textContent = selectedDate.toLocaleDateString("en-IN", {
    month: "long",
    year: "numeric"
  });

  // ✅ Render Monthly ToDos (under calendar)
  const monthTasks = tasks.filter(task => {
    const taskDate = new Date(task.dueDate);
    return taskDate.getFullYear() === year && taskDate.getMonth() === month;
  });

tasksList.innerHTML = "";
if (monthTasks.length === 0) {
  tasksList.innerHTML = "<div class='text-muted'>No tasks for this month.</div>";
} else {
  const row = document.createElement("div");
  row.className = "row g-2";

  monthTasks
    .sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate))
    .forEach(task => {
      const col = document.createElement("div");
      col.className = "col-md-4"; // ✅ 2 columns

      const priorityColor = {
        Low: "text-primary",
        Medium: "text-warning",
        High: "text-danger"
      }[task.priority] || "text-secondary";

      const card = document.createElement("div");
      card.className = "border rounded p-2 h-100 bg-light";

      const pinned = task.pinned ? "📌 " : "";

      card.innerHTML = `
        <div class="fw-bold ${priorityColor}">${pinned}${task.title}</div>
        <div class="small">
          ${task.status ? `<span class="badge bg-${getStatusColor(task.status)} me-1">${task.status}</span>` : ""}
          ${task.tag ? `<span class="badge bg-info text-dark">${task.tag}</span>` : ""}
        </div>
        <div class="text-muted small">Due: ${formatDate(task.dueDate)}</div>
      `;

      col.appendChild(card);
      row.appendChild(col);
    });

  tasksList.appendChild(row);
}


  // 🚫 Only show day view panel if user clicked on a day
  if (!triggerByClick) return;

  // 👉 Replace Add Box with Smart Day View Panel
  document.getElementById("addEventBox").classList.add("d-none");
  document.getElementById("dayViewPanel").classList.remove("d-none");

  document.getElementById("dayViewTitle").textContent = `Details for ${selectedDate.toDateString()}`;

  // 📝 Day-specific ToDos
  const dayTasks = tasks.filter(t => t.dueDate === dateStr);
  const dayTasksList = document.getElementById("dayTasksList");
  dayTasksList.innerHTML = dayTasks.length
    ? ""
    : `<li class='list-group-item text-muted'>No tasks for this day.</li>`;

  dayTasks.forEach(task => {
    const li = document.createElement("li");
    li.className = "list-group-item";
    li.innerHTML = `
      <strong>${task.title}</strong><br>
      <small class="text-muted">${task.status} • ${formatDate(task.dueDate)}</small>
    `;
    dayTasksList.appendChild(li);
  });

  // 🎉 Day-specific Events
  const dayBirthdays = birthdayEvents.filter(b => b.date === dateStr);
  const dayBirthdaysList = document.getElementById("dayBirthdaysList");
  dayBirthdaysList.innerHTML = dayBirthdays.length
    ? ""
    : `<li class='list-group-item text-muted'>No events for this day.</li>`;

  dayBirthdays.forEach(event => {
    const li = document.createElement("li");
    li.className = "list-group-item";
    li.innerHTML = `
      <strong>${event.name}</strong> <span class="badge bg-secondary">${event.type}</span><br>
      ${event.note ? `<em>${event.note}</em><br>` : ""}
      <small class="text-muted">${formatDate(event.date)}</small>
    `;
    dayBirthdaysList.appendChild(li);
  });
}


// Hide Smart Panel & show original layout
function hideDayView() {
  document.getElementById("dayViewPanel").classList.add("d-none");
  document.getElementById("addEventBox").classList.remove("d-none");
}


function changeMonth(offset) {
  currentDate.setMonth(currentDate.getMonth() + offset);
  renderCalendar(currentDate);
  renderBirthdayList(currentDate.getMonth(), currentDate.getFullYear());

  // ⬇️ Add this to refresh the task list for the new month
  const firstDayStr = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}-01`;
  showTasksForDate(firstDayStr);
}



// ===================== Birthdays & Events =====================
function renderBirthdayList(selectedMonth = currentDate.getMonth(), selectedYear = currentDate.getFullYear()) {
  const birthdayList = document.getElementById("birthdayList");
  if (!birthdayList) return;

  birthdayList.innerHTML = "";

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const tomorrow = new Date(today);
  tomorrow.setDate(today.getDate() + 1);

  // Get current week's Sunday and Saturday
  const startOfWeek = new Date(today);
  startOfWeek.setDate(today.getDate() - today.getDay()); // Sunday
  const endOfWeek = new Date(startOfWeek);
  endOfWeek.setDate(startOfWeek.getDate() + 6); // Saturday

  // Next week's range
  const nextWeekStart = new Date(endOfWeek);
  nextWeekStart.setDate(endOfWeek.getDate() + 1); // Next Sunday
  const nextWeekEnd = new Date(nextWeekStart);
  nextWeekEnd.setDate(nextWeekStart.getDate() + 6); // Next Saturday

  const matchingEvents = birthdayEvents
    .map((event, index) => {
      const eventDate = new Date(event.date);
      eventDate.setHours(0, 0, 0, 0);

      // Skip past dates
      if (eventDate < today) return null;

      // Only show for selected month/year
      if (
        eventDate.getMonth() !== selectedMonth ||
        eventDate.getFullYear() !== selectedYear
      ) return null;

      let colorClass = "bg-success";
      let isTomorrow = eventDate.getTime() === tomorrow.getTime();

      if (eventDate >= startOfWeek && eventDate <= endOfWeek) {
        colorClass = "bg-danger";
      } else if (eventDate >= nextWeekStart && eventDate <= nextWeekEnd) {
        colorClass = "bg-warning";
      }

      return { ...event, index, eventDate, colorClass, isTomorrow };
    })
    .filter(e => e !== null)
    .sort((a, b) => a.eventDate - b.eventDate);

  if (matchingEvents.length === 0) {
    birthdayList.innerHTML = "<li class='list-group-item text-muted'>No birthdays/events this month.</li>";
    return;
  }

  matchingEvents.forEach(event => {
    const li = document.createElement("li");
    li.className = "list-group-item d-flex justify-content-between align-items-start";

    const badges = `
      <span class="badge ${event.colorClass}">${event.type}</span>
      ${event.isTomorrow ? `<span class="badge bg-primary ms-1">Tomorrow 🔔</span>` : ""}
    `;

    li.innerHTML = `
      <div>
        <strong>${event.name}</strong> ${badges}<br>
        <small class="text-muted">Date: ${formatDate(event.date)}</small><br>
        ${event.note ? `<em>Note: ${event.note}</em><br>` : ""}
      </div>
      <div class="d-flex gap-2 align-items-start">
        <button class="btn btn-sm btn-outline-primary" onclick="editBirthday(${event.index})">✏️</button>
        <button class="btn btn-sm btn-outline-danger" onclick="deleteBirthday(${event.index})">🗑️</button>
      </div>
    `;
    birthdayList.appendChild(li);
  });
}

function formatDate(dateStr) {
  const date = new Date(dateStr);
  return date.toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric"
  });
}


// ===================== Auto Load =====================
window.addEventListener("DOMContentLoaded", () => {
  renderTasks();
  renderNotes();
  renderCalendar(currentDate);
  renderBirthdayList();

  document.getElementById("birthdayForm")?.addEventListener("submit", function (e) {
    e.preventDefault();
    const name = document.getElementById("bdayName").value.trim();
    const date = document.getElementById("bdayDate").value;
    const type = document.getElementById("bdayType").value;
    const note = document.getElementById("bdayNote").value.trim();
    if (!name || !date) return;

    birthdayEvents.push({ name, date, type, note });
    localStorage.setItem("birthdayEvents", JSON.stringify(birthdayEvents));

    this.reset();
    renderBirthdayList();
    renderCalendar(currentDate);
  });
});

// ===================== Section Switching =====================
function showSection(id, btn) {
  localStorage.setItem("lastSection", id); // ✅ Save last section

  document.querySelectorAll('.content-section').forEach(section => {
    section.classList.remove('active');
    section.style.display = 'none';
  });

  const section = document.getElementById(id);
  section.classList.add('active');
  section.style.display = 'block';

  document.querySelectorAll('.menu-btn').forEach(button => {
    button.classList.remove('selected');
  });
  btn.classList.add('selected');

  if (id === "todo") {
    renderTasks();
  } else if (id === "notes") {
    renderNotes();
  } else if (id === "calendar") {
    renderCalendar(currentDate);
    renderBirthdayList(currentDate.getMonth(), currentDate.getFullYear());
  } else if (id === "expense-tracker-section") {
    setTimeout(() => {
      renderExpenses();
    }, 50);
  }
}




function deleteBirthday(index) {
  if (confirm("Delete this birthday/event?")) {
    birthdayEvents.splice(index, 1);
    localStorage.setItem("birthdayEvents", JSON.stringify(birthdayEvents));
    renderBirthdayList(currentDate.getMonth(), currentDate.getFullYear());
    renderCalendar(currentDate); // Refresh calendar
  }
}

function editBirthday(index) {
  const event = birthdayEvents[index];
  if (!event) return;

  document.getElementById("bdayName").value = event.name;
  document.getElementById("bdayDate").value = event.date;
  document.getElementById("bdayType").value = event.type;
  document.getElementById("bdayNote").value = event.note || "";

  // Optional: scroll to form
  const form = document.getElementById("birthdayForm");
  form.scrollIntoView({ behavior: "smooth" });

  // Replace submit handler temporarily
  const submitBtn = form.querySelector("button[type='submit']");
  submitBtn.textContent = "💾 Update Event";

  const originalHandler = form.onsubmit;
  form.onsubmit = function (e) {
    e.preventDefault();

    const updated = {
      name: document.getElementById("bdayName").value.trim(),
      date: document.getElementById("bdayDate").value,
      type: document.getElementById("bdayType").value,
      note: document.getElementById("bdayNote").value.trim(),
    };

    if (!updated.name || !updated.date) return;

    birthdayEvents[index] = updated;
    localStorage.setItem("birthdayEvents", JSON.stringify(birthdayEvents));

    form.reset();
    submitBtn.textContent = "➕ Add Event";
    form.onsubmit = originalHandler;

    renderBirthdayList(currentDate.getMonth(), currentDate.getFullYear());
    renderCalendar(currentDate);
  };
}

// expense sript

// 🚀 Submit handler
let chartRef = null;

document.getElementById('expenseForm').addEventListener('submit', function (e) {
  e.preventDefault();
  const id = document.getElementById('expense-id').value;
  if (id) updateExpense(parseInt(id));
  else addExpense();
});

// ➕ Add new expense
function addExpense() {
  const title = document.getElementById('expense-title').value.trim() || "Untitled";
  const amount = parseFloat(document.getElementById('expense-amount').value);
  let date = document.getElementById('expense-date').value;
  let category = document.getElementById('expense-category').value || "Other";

  if (isNaN(amount)) {
    alert("Amount is required.");
    return;
  }

  if (!date) {
    const today = new Date();
    date = today.toISOString().split('T')[0];
  }

  const expenses = JSON.parse(localStorage.getItem('expenses') || '[]');
  expenses.push({ title, amount, date, category });
  localStorage.setItem('expenses', JSON.stringify(expenses));

  document.getElementById('expenseForm').reset();
  renderExpenses();
}

// 📝 Edit existing
function updateExpense(index) {
  const expenses = JSON.parse(localStorage.getItem('expenses') || '[]');

  expenses[index].title = document.getElementById('expense-title').value.trim() || "Untitled";
  expenses[index].amount = parseFloat(document.getElementById('expense-amount').value) || 0;
  expenses[index].date = document.getElementById('expense-date').value || new Date().toISOString().split('T')[0];
  expenses[index].category = document.getElementById('expense-category').value || "Other";

  localStorage.setItem('expenses', JSON.stringify(expenses));
  document.getElementById('expenseForm').reset();
  document.getElementById('expense-id').value = '';
  renderExpenses();
}

// 📋 Render Expenses
function renderExpenses() {
  const list = document.getElementById('expense-list');
  const totalBox = document.getElementById('total-expense');
  const lastMonthBox = document.getElementById('last-month-expense');
  const filterMonth = document.getElementById('filter-month').value;
  const expenses = JSON.parse(localStorage.getItem('expenses') || '[]');

  let filtered = expenses;
  if (filterMonth && filterMonth !== 'all') {
    filtered = expenses.filter(e => e.date && e.date.startsWith(filterMonth));
  }

  // 🧮 Totals
  let total = 0;
  let lastMonth = 0;
  const today = new Date();
  const lastMonthStr = new Date(today.getFullYear(), today.getMonth() - 1).toISOString().slice(0, 7);

  list.innerHTML = '';
  if (filtered.length === 0) {
    list.innerHTML = '<li class="list-group-item text-muted">No expenses found.</li>';
  } else {
    filtered.forEach((exp, index) => {
      total += exp.amount;
      if (exp.date && exp.date.startsWith(lastMonthStr)) {
        lastMonth += exp.amount;
      }

      const li = document.createElement('li');
      li.className = 'list-group-item d-flex justify-content-between align-items-center';
      const category = exp.category || 'Other';
const tagColor = categoryColors[category] || '#888';

li.innerHTML = `
  <div>
    <strong>${exp.title || 'Untitled'}</strong><br/>
    <small>₹${exp.amount} on ${exp.date}</small>
    <span class="badge ms-2" style="
      background-color: ${tagColor};
      color: #fff;
      font-size: 0.75rem;
      padding: 4px 8px;
      border-radius: 12px;
    ">
      ${category}
    </span>
  </div>
  <div class="btn-group btn-group-sm">
    <button class="btn btn-outline-primary" onclick="editExpense(${index})">✏️</button>
    <button class="btn btn-outline-danger" onclick="deleteExpense(${index})">🗑️</button>
  </div>
`;

      list.appendChild(li);
    });
  }

  function updateExpenseHeading(filterMonth) {
  const heading = document.getElementById('expense-heading');
  if (!filterMonth || filterMonth === 'all') {
    heading.textContent = 'All Months';
    return;
  }

  const [year, month] = filterMonth.split('-');
  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];
  heading.textContent = `${monthNames[parseInt(month) - 1]} ${year}`;
}


  totalBox.innerText = total.toFixed(2);
  lastMonthBox.innerText = lastMonth.toFixed(2);

  updateMonthDropdown(expenses);
  renderChart(filtered);
  updateExpenseHeading(filterMonth);
}


// ✏️ Fill form for editing
function editExpense(index) {
  const expenses = JSON.parse(localStorage.getItem('expenses') || '[]');
  const exp = expenses[index];
  document.getElementById('expense-id').value = index;
  document.getElementById('expense-title').value = exp.title;
  document.getElementById('expense-amount').value = exp.amount;
  document.getElementById('expense-date').value = exp.date;
  document.getElementById('expense-category').value = exp.category;
}

// 🗑️ Delete
function deleteExpense(index) {
  const expenses = JSON.parse(localStorage.getItem('expenses') || '[]');
  expenses.splice(index, 1);
  localStorage.setItem('expenses', JSON.stringify(expenses));
  renderExpenses();
}

// 📅 Month filter
function updateMonthDropdown(expenses) {
  const monthDropdown = document.getElementById('filter-month');
  const selected = monthDropdown.value;
  const months = [...new Set(expenses.map(e => e.date?.slice(0, 7)).filter(Boolean))].sort().reverse();

  monthDropdown.innerHTML = '<option value="all">📅 All Months</option>';

  const todayMonth = new Date().toISOString().slice(0, 7);
  let currentMonthExists = false;

  months.forEach(m => {
    const option = document.createElement('option');
    option.value = m;
    option.textContent = new Date(m + "-01").toLocaleString('default', { month: 'long', year: 'numeric' });
    if (m === selected) option.selected = true;
    if (m === todayMonth) currentMonthExists = true;
    monthDropdown.appendChild(option);
  });

  // ✅ Auto-select current month ONLY on first load (not if user clicked All Months)
  if (!selected && !monthDropdown.dataset.userSelected && currentMonthExists) {
    monthDropdown.value = todayMonth;
    renderExpenses();
  }
}



// 📊 Chart
    const categoryColors = {
      Food: "#FF6384",
      Travel: "#36A2EB",
      Shopping: "#FFCE56",
      Bills: "#4BC0C0",
      Other: "#9966FF"
    };
function renderChart(expenses) {
  const ctx = document.getElementById('expenseChart')?.getContext('2d');
  if (!ctx) return;

  if (chartRef) chartRef.destroy();

  const selectedMonth = document.getElementById('filter-month').value;

  if (selectedMonth && selectedMonth !== 'all') {
    // 📊 Category-wise chart for selected month
    const categoryData = {};
    expenses.forEach(exp => {
      const cat = exp.category || "Other";
      categoryData[cat] = (categoryData[cat] || 0) + exp.amount;
    });

    const labels = Object.keys(categoryData);
    const data = Object.values(categoryData);

    const backgroundColors = labels.map(label => categoryColors[label] || "#888");

    chartRef = new Chart(ctx, {
      type: 'bar',
      data: {
        labels,
        datasets: [{
          label: 'Total by Category (₹)',
          data,
          backgroundColor: backgroundColors,
          borderRadius: 6,
          barThickness: 40
        }]
      },
      options: {
        plugins: { legend: { display: false } },
        scales: {
          x: { title: { display: true, text: 'Category' } },
          y: { beginAtZero: true, title: { display: true, text: 'Amount (₹)' } }
        }
      }
    });

  } else {
    // 📊 Month-wise chart for ALL months
    const monthMap = {};
    expenses.forEach(exp => {
      const monthKey = exp.date?.slice(0, 7); // "YYYY-MM"
      if (monthKey) {
        monthMap[monthKey] = (monthMap[monthKey] || 0) + exp.amount;
      }
    });

    const sortedMonths = Object.keys(monthMap).sort();
    const labels = sortedMonths.map(m => {
      const d = new Date(m + "-01");
      return d.toLocaleString('default', { month: 'short', year: 'numeric' }); // "Jul 2025"
    });
    const data = sortedMonths.map(m => monthMap[m]);

    chartRef = new Chart(ctx, {
      type: 'bar',
      data: {
        labels,
        datasets: [{
          label: 'Total by Month (₹)',
          data,
          backgroundColor: '#36a2eb',
          borderRadius: 6,
          barThickness: 40
        }]
      },
      options: {
        plugins: { legend: { display: false } },
        scales: {
          x: { title: { display: true, text: 'Month' } },
          y: { beginAtZero: true, title: { display: true, text: 'Amount (₹)' } }
        }
      }
    });
  }
}



// 🚀 Start
// ✅ Load all JSON files on page load
window.addEventListener('load', () => {
  Promise.all([
    fetch("tasks.json").then(res => res.json()),
    fetch("birthdayEvents.json").then(res => res.json()),
    fetch("notes.json").then(res => res.json()),
    fetch("expenses.json").then(res => res.json())
  ])
    .then(([loadedTasks, loadedBirthdays, loadedNotes, loadedExpenses]) => {
      tasks = loadedTasks || [];
      birthdayEvents = loadedBirthdays || [];
      notes = loadedNotes || [];

      // ✅ Only set localStorage if it's not already set (first load)
      if (!localStorage.getItem("expenses")) {
        localStorage.setItem("expenses", JSON.stringify(loadedExpenses || []));
      }

      renderTasks?.();
      renderBirthdays?.();
      renderNotes?.();
      renderExpenses?.(); // <-- Will now render from localStorage
    })
    .catch(err => {
      console.error("Error loading JSON files:", err);
    });
});

