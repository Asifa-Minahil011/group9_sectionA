const express = require("express");
const bodyParser = require("body-parser");
const cors = require("cors");
const app = express();
const PORT = 3000;

app.use(cors());
app.use(bodyParser.json());
app.use(express.static("public")); // serve frontend files

// Temporary "database"
let users = [];
let expenses = [];

// Middleware to get current user from request headers
function authMiddleware(req, res, next) {
  const email = req.headers["x-user-email"];
  if (!email) return res.status(403).json({ message: "Please login first" });
  const user = users.find(u => u.email === email);
  if (!user) return res.status(403).json({ message: "User not found" });
  req.currentUser = user;
  next();
}



// 1️⃣ Signup
app.post("/api/signup", (req, res) => {
  const { email, password } = req.body;
  if (users.find(u => u.email === email)) {
    return res.status(400).json({ message: "User already exists!" });
  }
  users.push({ email, password });
  res.json({ message: "Account created successfully!" });
});

//  Login
app.post("/api/login", (req, res) => {
  const { email, password } = req.body;
  const user = users.find(u => u.email === email && u.password === password);
  if (!user) return res.status(401).json({ message: "Invalid credentials" });
  res.json({ message: "Login successful", email: user.email });
});



//  Add Expense
app.post("/api/expenses", authMiddleware, (req, res) => {
  const { date, category, amount } = req.body;
  const newExpense = {
    id: expenses.length + 1,
    user: req.currentUser.email,
    date,
    category,
    amount: parseFloat(amount)
  };
  expenses.push(newExpense);
  res.json({ message: "Expense added", expense: newExpense });
});

//  View Expenses
app.get("/api/expenses", authMiddleware, (req, res) => {
  const userExpenses = expenses.filter(e => e.user === req.currentUser.email);
  res.json(userExpenses);
});

//  Edit Expense
app.put("/api/expenses/:id", authMiddleware, (req, res) => {
  const id = parseInt(req.params.id);
  const expense = expenses.find(e => e.id === id && e.user === req.currentUser.email);
  if (!expense) return res.status(404).json({ message: "Expense not found" });

  const { date, category, amount } = req.body;
  expense.date = date;
  expense.category = category;
  expense.amount = parseFloat(amount);
  res.json({ message: "Expense updated", expense });
});

//  Delete Expense
app.delete("/api/expenses/:id", authMiddleware, (req, res) => {
  const id = parseInt(req.params.id);
  const index = expenses.findIndex(e => e.id === id && e.user === req.currentUser.email);
  if (index === -1) return res.status(404).json({ message: "Expense not found" });
  expenses.splice(index, 1);
  res.json({ message: "Expense deleted" });
});

//  Filter by Date
app.get("/api/expenses/date/:date", authMiddleware, (req, res) => {
  const filtered = expenses.filter(
    e => e.user === req.currentUser.email && e.date === req.params.date
  );
  res.json(filtered);
});

//  Filter by Category
app.get("/api/expenses/category/:category", authMiddleware, (req, res) => {
  const filtered = expenses.filter(
    e => e.user === req.currentUser.email &&
         e.category.toLowerCase() === req.params.category.toLowerCase()
  );
  res.json(filtered);
});

//  Total Expense
app.get("/api/expenses/total", authMiddleware, (req, res) => {
  const total = expenses
    .filter(e => e.user === req.currentUser.email)
    .reduce((sum, e) => sum + e.amount, 0);
  res.json({ totalExpense: total });
});

// Start server
app.listen(PORT, () => console.log(` Server running on http://localhost:${PORT}`));
