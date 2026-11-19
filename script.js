const STORAGE_KEY = "expenseTrackerData";

const form = document.getElementById("expenseForm");
const titleInput = document.getElementById("title");
const amountInput = document.getElementById("amount");
const categoryInput = document.getElementById("category");
const dateInput = document.getElementById("date");
const expenseList = document.getElementById("expenseList");
const emptyState = document.getElementById("emptyState");
const searchInput = document.getElementById("searchInput");
const categoryFilter = document.getElementById("categoryFilter");
const dateFilter = document.getElementById("dateFilter");
const sortFilter = document.getElementById("sortFilter");
const submitBtn = document.getElementById("submitBtn");
const cancelEditBtn = document.getElementById("cancelEditBtn");
const formTitle = document.getElementById("formTitle");
const formMessage = document.getElementById("formMessage");

let expenses = loadExpenses();
let editingId = null;

function loadExpenses() {
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY));
    return Array.isArray(saved) ? saved : [];
  } catch {
    return [];
  }
}

function saveExpenses() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(expenses));
}

function currency(value) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency", currency: "INR", maximumFractionDigits: 2
  }).format(value);
}

function localDateString(date = new Date()) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function formatDate(dateString) {
  if (!dateString) return "";
  return new Date(`${dateString}T00:00:00`).toLocaleDateString("en-IN", {
    day: "2-digit", month: "short", year: "numeric"
  });
}

function showMessage(message, isError = false) {
  formMessage.textContent = message;
  formMessage.style.color = isError ? "#dc2626" : "#15803d";
}

function resetForm() {
  form.reset();
  dateInput.value = localDateString();
  editingId = null;
  formTitle.textContent = "Add an expense";
  submitBtn.textContent = "Add expense";
  cancelEditBtn.classList.add("hidden");
}

form.addEventListener("submit", (event) => {
  event.preventDefault();

  const title = titleInput.value.trim();
  const amount = Number(amountInput.value);
  const category = categoryInput.value;
  const date = dateInput.value;

  if (!title || !Number.isFinite(amount) || amount <= 0 || !date) {
    showMessage("Please enter a valid name, amount and date.", true);
    return;
  }

  if (editingId) {
    expenses = expenses.map((expense) =>
      expense.id === editingId
        ? { ...expense, title, amount, category, date }
        : expense
    );
    showMessage("Expense updated successfully.");
  } else {
    expenses.push({
      id: (window.crypto && crypto.randomUUID) ? crypto.randomUUID() : String(Date.now()),
      title, amount, category, date
    });
    showMessage("Expense added successfully.");
  }

  saveExpenses();
  resetForm();
  render();
});

function editExpense(id) {
  const expense = expenses.find((item) => item.id === id);
  if (!expense) return;

  editingId = id;
  titleInput.value = expense.title;
  amountInput.value = expense.amount;
  categoryInput.value = expense.category;
  dateInput.value = expense.date;
  formTitle.textContent = "Edit expense";
  submitBtn.textContent = "Save changes";
  cancelEditBtn.classList.remove("hidden");
  showMessage("Update the details and save your changes.");
  titleInput.focus();
  window.scrollTo({ top: 0, behavior: "smooth" });
}

function deleteExpense(id) {
  const expense = expenses.find((item) => item.id === id);
  if (!expense) return;
  if (!window.confirm(`Delete "${expense.title}"?`)) return;

  expenses = expenses.filter((item) => item.id !== id);
  saveExpenses();
  if (editingId === id) resetForm();
  showMessage("Expense deleted.");
  render();
}

function getFilteredExpenses() {
  const search = searchInput.value.trim().toLowerCase();
  const category = categoryFilter.value;
  const date = dateFilter.value;

  let filtered = expenses.filter((expense) => {
    const matchesSearch = expense.title.toLowerCase().includes(search);
    const matchesCategory = category === "All" || expense.category === category;
    const matchesDate = !date || expense.date === date;
    return matchesSearch && matchesCategory && matchesDate;
  });

  switch (sortFilter.value) {
    case "oldest": filtered.sort((a, b) => a.date.localeCompare(b.date)); break;
    case "high": filtered.sort((a, b) => b.amount - a.amount); break;
    case "low": filtered.sort((a, b) => a.amount - b.amount); break;
    default: filtered.sort((a, b) => b.date.localeCompare(a.date));
  }
  return filtered;
}

function renderSummary() {
  const total = expenses.reduce((sum, item) => sum + item.amount, 0);
  const now = new Date();
  const monthTotal = expenses
    .filter((item) => {
      const d = new Date(`${item.date}T00:00:00`);
      return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
    })
    .reduce((sum, item) => sum + item.amount, 0);

  document.getElementById("totalAmount").textContent = currency(total);
  document.getElementById("monthAmount").textContent = currency(monthTotal);
  document.getElementById("expenseCount").textContent = expenses.length;
}

function renderList() {
  const filtered = getFilteredExpenses();
  expenseList.innerHTML = "";

  filtered.forEach((expense) => {
    const row = document.createElement("tr");

    const nameCell = document.createElement("td");
    nameCell.textContent = expense.title;

    const categoryCell = document.createElement("td");
    const pill = document.createElement("span");
    pill.className = "category-pill";
    pill.textContent = expense.category;
    categoryCell.appendChild(pill);

    const dateCell = document.createElement("td");
    dateCell.textContent = formatDate(expense.date);

    const amountCell = document.createElement("td");
    amountCell.className = "amount";
    amountCell.textContent = currency(expense.amount);

    const actionCell = document.createElement("td");
    actionCell.className = "action-cell";

    const editButton = document.createElement("button");
    editButton.className = "action-btn";
    editButton.type = "button";
    editButton.textContent = "Edit";
    editButton.setAttribute("aria-label", `Edit ${expense.title}`);
    editButton.addEventListener("click", () => editExpense(expense.id));

    const deleteButton = document.createElement("button");
    deleteButton.className = "action-btn delete-btn";
    deleteButton.type = "button";
    deleteButton.textContent = "Delete";
    deleteButton.setAttribute("aria-label", `Delete ${expense.title}`);
    deleteButton.addEventListener("click", () => deleteExpense(expense.id));

    actionCell.append(editButton, deleteButton);
    row.append(nameCell, categoryCell, dateCell, amountCell, actionCell);
    expenseList.appendChild(row);
  });

  emptyState.style.display = filtered.length ? "none" : "block";
  document.getElementById("resultCount").textContent =
    `${filtered.length} ${filtered.length === 1 ? "item" : "items"}`;
  const filteredTotal = filtered.reduce((sum, item) => sum + item.amount, 0);
  document.getElementById("filteredTotal").textContent = currency(filteredTotal);
}

function render() {
  renderSummary();
  renderList();
}

[searchInput, categoryFilter, dateFilter, sortFilter].forEach((control) => {
  control.addEventListener("input", renderList);
  control.addEventListener("change", renderList);
});

cancelEditBtn.addEventListener("click", () => {
  resetForm();
  showMessage("Editing cancelled.");
});

document.getElementById("todayLabel").textContent =
  new Date().toLocaleDateString("en-IN", { weekday: "short", day: "numeric", month: "short", year: "numeric" });

dateInput.value = localDateString();
render();
