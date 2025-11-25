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
  if (res.ok) {
    localStorage.setItem("currentUser", email);
    window.location.href = "dashboard.html";
  }
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
  loadCategoryChart();
  loadExpensePieChart();
  loadMonthlyTrendsChart();
  loadHighestCategory(); 
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
      editExpense(expense._id, expense.date, expense.category, expense.amount);
    });

    const deleteBtn = document.createElement("button");
    deleteBtn.textContent = "Delete";
    deleteBtn.addEventListener("click", () => deleteExpense(expense._id));

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
  loadCategoryChart();
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

// --- INCOME FUNCTIONS ---
async function addOrUpdateIncome() {
  const id = document.getElementById("incomeEditId").value;
  const date = document.getElementById("incomeDate").value;
  const source = document.getElementById("incomeSource").value;
  const amount = document.getElementById("incomeAmount").value;

  if (!date || !source || !amount) return alert("Fill all fields");

  const payload = { date, source, amount };

  let res, data;

  if (id) {
    res = await fetch(`${API}/incomes/${id}`, {
      method: "PUT",
      headers: getHeaders(),
      body: JSON.stringify(payload)
    });
    data = await res.json();
    if (res.ok) alert("Income updated!");
    else alert("Error: " + data.message);
  } else {
    res = await fetch(`${API}/incomes`, {
      method: "POST",
      headers: getHeaders(),
      body: JSON.stringify(payload)
    });
    data = await res.json();
    if (res.ok) alert("Income added!");
    else alert("Error: " + data.message);
  }

  document.getElementById("incomeEditId").value = "";
  document.getElementById("incomeDate").value = "";
  document.getElementById("incomeSource").value = "";
  document.getElementById("incomeAmount").value = "";

  loadIncomes();
  loadIncomeCategoryChart();
}

async function loadIncomes() {
  const email = localStorage.getItem("currentUser");
  if (!email) {
    window.location.href = "index.html";
    return;
  }

  const res = await fetch(`${API}/incomes`, { headers: getHeaders() });
  const data = await res.json();

  renderIncomeTable(data);

  const totalRes = await fetch(`${API}/incomes/total`, { headers: getHeaders() });
  const totalData = await totalRes.json();
  document.getElementById("totalIncome").textContent = `Total: $${totalData.totalIncome}`;
}

function renderIncomeTable(data) {
  const tbody = document.querySelector("#incomeTable tbody");
  tbody.innerHTML = ""; // clear existing rows

  data.forEach(income => {
    const tr = document.createElement("tr");

    const dateTd = document.createElement("td");
    dateTd.textContent = income.date;

    const sourceTd = document.createElement("td");
    sourceTd.textContent = income.source;

    const amountTd = document.createElement("td");
    amountTd.textContent = `$${income.amount}`;

    const actionsTd = document.createElement("td");

    const editBtn = document.createElement("button");
    editBtn.textContent = "Edit";
    // Use income._id instead of income.id
    editBtn.addEventListener("click", () => {
      editIncome(income._id, income.date, income.source, income.amount);
    });

    const deleteBtn = document.createElement("button");
    deleteBtn.textContent = "Delete";
    deleteBtn.addEventListener("click", () => deleteIncome(income._id));

    actionsTd.appendChild(editBtn);
    actionsTd.appendChild(deleteBtn);

    tr.appendChild(dateTd);
    tr.appendChild(sourceTd);
    tr.appendChild(amountTd);
    tr.appendChild(actionsTd);

    tbody.appendChild(tr);
  });
}

function editIncome(id, date, source, amount) {
  document.getElementById("incomeEditId").value = id;
  document.getElementById("incomeDate").value = date;
  document.getElementById("incomeSource").value = source;
  document.getElementById("incomeAmount").value = amount;
}

async function deleteIncome(id) {
  if (!confirm("Delete this income?")) return;
  const res = await fetch(`${API}/incomes/${id}`, { method: "DELETE", headers: getHeaders() });
  const data = await res.json();
  if (res.ok) alert(data.message);
  else alert("Error: " + data.message);
  loadIncomes();
  loadIncomeCategoryChart();
}

// --- CHART FUNCTIONS ---
async function loadCategoryChart() {
  const res = await fetch(`${API}/expenses/by-category`, { headers: getHeaders() });
  const data = await res.json();

  // Prepare data for chart
  const categories = Object.keys(data);
  const amounts = Object.values(data);

  // Render chart (simple bar chart using Chart.js)
  const ctx = document.getElementById("categoryChart").getContext("2d");
  if (window.categoryChartInstance) window.categoryChartInstance.destroy(); // Remove old chart
  window.categoryChartInstance = new Chart(ctx, {
    type: "bar",
    data: {
      labels: categories,
      datasets: [{
        label: "Spending by Category",
        data: amounts,
        backgroundColor: "#1976d2"
      }]
    },
    options: {
      responsive: true,
      plugins: {
        legend: { display: false }
      }
    }
  });
}

async function loadIncomeCategoryChart() {
  const res = await fetch(`${API}/incomes/by-category`, { headers: getHeaders() });
  const data = await res.json();

  const sources = Object.keys(data);
  const amounts = Object.values(data);

  const ctx = document.getElementById("incomeCategoryChart").getContext("2d");
  if (window.incomeCategoryChartInstance) window.incomeCategoryChartInstance.destroy();
  window.incomeCategoryChartInstance = new Chart(ctx, {
    type: "bar",
    data: {
      labels: sources,
      datasets: [{
        label: "Income by Source",
        data: amounts,
        backgroundColor: "#1565c0"
      }]
    },
    options: {
      responsive: true,
      plugins: {
        legend: { display: false }
      }
    }
  });
}

// Expense Pie Chart
async function loadExpensePieChart() {
  const res = await fetch(`${API}/expenses/by-category`, { headers: getHeaders() });
  const data = await res.json();
  const categories = Object.keys(data);
  const amounts = Object.values(data);

  const ctx = document.getElementById("expensePieChart").getContext("2d");
  if (window.expensePieChartInstance) window.expensePieChartInstance.destroy();
  window.expensePieChartInstance = new Chart(ctx, {
    type: "pie",
    data: {
      labels: categories,
      datasets: [{
        data: amounts,
        backgroundColor: [
          "#1976d2", "#42a5f5", "#90caf9", "#1565c0", "#64b5f6", "#e3f0ff"
        ]
      }]
    }
  });
}

// Monthly Trends Chart
async function loadMonthlyTrendsChart() {
  // Get expenses grouped by month
  const expRes = await fetch(`${API}/expenses`, { headers: getHeaders() });
  const expenses = await expRes.json();
  const incRes = await fetch(`${API}/incomes`, { headers: getHeaders() });
  const incomes = await incRes.json();

  // Group by YYYY-MM
  function groupByMonth(arr, key) {
    const map = {};
    arr.forEach(item => {
      const month = item.date.slice(0,7); // "YYYY-MM"
      map[month] = (map[month] || 0) + item[key];
    });
    return map;
  }
  const expByMonth = groupByMonth(expenses, "amount");
  const incByMonth = groupByMonth(incomes, "amount");
  const months = Array.from(new Set([...Object.keys(expByMonth), ...Object.keys(incByMonth)])).sort();

  const expAmounts = months.map(m => expByMonth[m] || 0);
  const incAmounts = months.map(m => incByMonth[m] || 0);

  const ctx = document.getElementById("monthlyTrendsChart").getContext("2d");
  if (window.monthlyTrendsChartInstance) window.monthlyTrendsChartInstance.destroy();
  window.monthlyTrendsChartInstance = new Chart(ctx, {
    type: "bar",
    data: {
      labels: months,
      datasets: [
        { label: "Expenses", data: expAmounts, backgroundColor: "#e53935" },
        { label: "Income", data: incAmounts, backgroundColor: "#1976d2" }
      ]
    },
    options: { responsive: true }
  });
}

// Highest Spending Category
async function loadHighestCategory() {
  const res = await fetch(`${API}/expenses/by-category`, { headers: getHeaders() });
  const data = await res.json();
  let highest = "";
  let max = 0;
  for (const [cat, amt] of Object.entries(data)) {
    if (amt > max) {
      max = amt;
      highest = cat;
    }
  }
  document.getElementById("highestCategory").textContent =
    highest ? `Your highest spending category is "${highest}" ($${max})` : "No expenses yet.";
}

// Reset Data
async function resetData() {
  if (!confirm("Are you sure you want to reset all your data?")) return;
  await fetch(`${API}/expenses/reset`, { method: "POST", headers: getHeaders() });
  await fetch(`${API}/incomes/reset`, { method: "POST", headers: getHeaders() });
  await fetch(`${API}/budget`, { method: "POST", headers: getHeaders(), body: JSON.stringify({ amount: 0 }) });
  alert("All data reset!");
  loadExpensePieChart();
  loadMonthlyTrendsChart();
  loadHighestCategory();
  loadBudget();
  loadExpenses();
  loadIncomes();
}

// Budget Functions
async function setBudget() {
  const amount = document.getElementById("budgetAmount").value;
  if (!amount || amount <= 0) return alert("Enter a valid budget amount");
  const res = await fetch(`${API}/budget`, {
    method: "POST",
    headers: getHeaders(),
    body: JSON.stringify({ amount })
  });
  const data = await res.json();
  alert(data.message);
  loadBudget();
}

async function loadBudget() {
  const budgetRes = await fetch(`${API}/budget`, { headers: getHeaders() });
  const budgetData = await budgetRes.json();
  const budget = budgetData.amount || 0;

  const expenseRes = await fetch(`${API}/expenses/total`, { headers: getHeaders() });
  const expenseData = await expenseRes.json();
  const totalExpense = expenseData.totalExpense || 0;

  const remaining = budget - totalExpense;
  const percent = budget > 0 ? Math.round((totalExpense / budget) * 100) : 0;

  document.getElementById("budgetInfo").textContent =
    `Budget: $${budget} | Spent: $${totalExpense} | Remaining: $${remaining < 0 ? 0 : remaining}`;

  const progress = document.getElementById("budgetProgress");
  progress.value = percent > 100 ? 100 : percent;
  progress.max = 100;
  document.getElementById("budgetPercent").textContent = ` ${percent}% used`;
}

// Load expenses and incomes on dashboard
if (window.location.pathname.endsWith("dashboard.html")) {
  const email = localStorage.getItem("currentUser");
  if (!email) window.location.href = "index.html";
  else {
    loadExpenses();
    loadIncomes();
    loadCategoryChart();
    loadIncomeCategoryChart();
    loadBudget();
  }
}

// Optional: loadBudget when switching to budget tab
function showTab(tabId) {
  document.querySelectorAll('.tab-content').forEach(tab => tab.classList.remove('active'));
  document.getElementById(tabId).classList.add('active');
  document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
  if(tabId === 'expenseTab') {
    document.querySelector('.tab-btn:nth-child(1)').classList.add('active');
  } else if(tabId === 'incomeTab') {
    document.querySelector('.tab-btn:nth-child(2)').classList.add('active');
  } else if(tabId === 'budgetTab') {
    document.querySelector('.tab-btn:nth-child(3)').classList.add('active');
    loadBudget();
  } else if(tabId === 'reportsTab') {
    document.querySelector('.tab-btn:nth-child(4)').classList.add('active');
    loadExpensePieChart();
    loadMonthlyTrendsChart();
    loadHighestCategory();
  }
}
