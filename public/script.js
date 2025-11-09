const API = "http://localhost:3000/api";

// --- AUTH FUNCTIONS ---
async function signup() {
  const email = document.getElementById("signupEmail").value;
  const password = document.getElementById("signupPassword").value;

  const res = await fetch(`${API}/signup`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password })
  });

  const data = await res.json();
  alert(data.message);
}

async function login() {
  const email = document.getElementById("loginEmail").value;
  const password = document.getElementById("loginPassword").value;

  const res = await fetch(`${API}/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password })
  });

  const data = await res.json();
  if (res.ok) {
    localStorage.setItem("currentUser", data.email); // save logged-in user
    window.location.href = "dashboard.html";
  } else {
    alert(data.message);
  }
}

function logout() {
  localStorage.removeItem("currentUser");
  window.location.href = "index.html";
}

// Helper to include user email in headers
function getHeaders() {
  const email = localStorage.getItem("currentUser");
  return {
    "Content-Type": "application/json",
    "x-user-email": email
  };
}

// --- EXPENSE FUNCTIONS ---
async function addOrUpdateExpense() {
  const id = document.getElementById("editId").value;
  const date = document.getElementById("date").value;
  const category = document.getElementById("category").value;
  const amount = document.getElementById("amount").value;

  if (!date || !category || !amount) return alert("Fill all fields");

  const payload = { date, category, amount };

  let res, data;

  if (id) {
    res = await fetch(`${API}/expenses/${id}`, {
      method: "PUT",
      headers: getHeaders(),
      body: JSON.stringify(payload)
    });
    data = await res.json();
    if (res.ok) alert("Expense updated!");
    else alert("Error: " + data.message);
  } else {
    res = await fetch(`${API}/expenses`, {
      method: "POST",
      headers: getHeaders(),
      body: JSON.stringify(payload)
    });
    data = await res.json();
    if (res.ok) alert("Expense added!");
    else alert("Error: " + data.message);
  }

  document.getElementById("editId").value = "";
  document.getElementById("date").value = "";
  document.getElementById("category").value = "";
  document.getElementById("amount").value = "";

  loadExpenses();
}

async function loadExpenses() {
  const email = localStorage.getItem("currentUser");
  if (!email) {
    window.location.href = "index.html";
    return;
  }

  const res = await fetch(`${API}/expenses`, { headers: getHeaders() });
  const data = await res.json();

  renderExpenseTable(data);

  const totalRes = await fetch(`${API}/expenses/total`, { headers: getHeaders() });
  const totalData = await totalRes.json();
  document.getElementById("totalExpense").textContent = `Total: $${totalData.totalExpense}`;
}

// Function to render the table (used for both load and filtered data)
function renderExpenseTable(data) {
  const tbody = document.querySelector("#expenseTable tbody");
  tbody.innerHTML = ""; // clear existing rows

  data.forEach(expense => {
    const tr = document.createElement("tr");

    const dateTd = document.createElement("td");
    dateTd.textContent = expense.date;

    const categoryTd = document.createElement("td");
    categoryTd.textContent = expense.category;

    const amountTd = document.createElement("td");
    amountTd.textContent = `$${expense.amount}`;

    const actionsTd = document.createElement("td");

    const editBtn = document.createElement("button");
    editBtn.textContent = "Edit";
    editBtn.addEventListener("click", () => {
      editExpense(expense.id, expense.date, expense.category, expense.amount);
    });

    const deleteBtn = document.createElement("button");
    deleteBtn.textContent = "Delete";
    deleteBtn.addEventListener("click", () => deleteExpense(expense.id));

    actionsTd.appendChild(editBtn);
    actionsTd.appendChild(deleteBtn);

    tr.appendChild(dateTd);
    tr.appendChild(categoryTd);
    tr.appendChild(amountTd);
    tr.appendChild(actionsTd);

    tbody.appendChild(tr);
  });
}

function editExpense(id, date, category, amount) {
  document.getElementById("editId").value = id;
  document.getElementById("date").value = date;
  document.getElementById("category").value = category;
  document.getElementById("amount").value = amount;
}

async function deleteExpense(id) {
  if (!confirm("Delete this expense?")) return;
  const res = await fetch(`${API}/expenses/${id}`, { method: "DELETE", headers: getHeaders() });
  const data = await res.json();
  if (res.ok) alert(data.message);
  else alert("Error: " + data.message);
  loadExpenses();
}

async function filterByDate() {
  const date = document.getElementById("filterDate").value;
  const res = await fetch(`${API}/expenses/date/${date}`, { headers: getHeaders() });
  const data = await res.json();
  renderExpenseTable(data);
}

async function filterByCategory() {
  const category = document.getElementById("filterCategory").value;
  const res = await fetch(`${API}/expenses/category/${category}`, { headers: getHeaders() });
  const data = await res.json();
  renderExpenseTable(data);
}

// Load expenses on dashboard
if (window.location.pathname.endsWith("dashboard.html")) {
  const email = localStorage.getItem("currentUser");
  if (!email) window.location.href = "index.html";
  else loadExpenses();
}
