const express = require("express");
const bodyParser = require("body-parser");
const cors = require("cors");
const mongoose = require("mongoose");
const app = express();
const PORT = 3000;

app.use(cors());
app.use(bodyParser.json());
app.use(express.static("public")); // serve frontend files

// Connect to MongoDB
mongoose.connect("mongodb+srv://manahil:admin@cluster0.hkjjqxs.mongodb.net/BudgetWise?retryWrites=true&w=majority")
  .then(() => {
    console.log("MongoDB connected");
  })
  .catch(err => {
    console.error("MongoDB connection error:", err);
  });

// User schema
const userSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true }
});
const User = mongoose.model("User", userSchema);

// Expense schema
const expenseSchema = new mongoose.Schema({
  user: { type: String, required: true },
  date: String,
  category: String,
  amount: Number
});
const Expense = mongoose.model("Expense", expenseSchema);

// Income schema
const incomeSchema = new mongoose.Schema({
  user: { type: String, required: true },
  date: String,
  source: String,
  amount: Number
});
const Income = mongoose.model("Income", incomeSchema);

// Middleware to get current user from request headers
async function authMiddleware(req, res, next) {
  const email = req.headers["x-user-email"];
  if (!email) return res.status(403).json({ message: "Please login first" });
  const user = await User.findOne({ email });
  if (!user) return res.status(403).json({ message: "User not found" });
  req.currentUser = user;
  next();
}



// Signup
app.post("/api/signup", async (req, res) => {
  console.log("Signup request body:", req.body);
  const { email, password } = req.body;
  const existingUser = await User.findOne({ email });
  if (existingUser) {
    return res.status(400).json({ message: "User already exists!" });
  }
  await User.create({ email, password });
  res.json({ message: "Account created successfully!" });
});

//  Login
app.post("/api/login", async (req, res) => {
  const { email, password } = req.body;
  const user = await User.findOne({ email, password });
  if (!user) return res.status(401).json({ message: "Invalid credentials" });
  res.json({ message: "Login successful", email: user.email });
});



//  Add Expense
app.post("/api/expenses", authMiddleware, async (req, res) => {
  const { date, category, amount } = req.body;
  const newExpense = await Expense.create({
    user: req.currentUser.email,
    date,
    category,
    amount: parseFloat(amount)
  });
  res.json({ message: "Expense added", expense: newExpense });
});

//  View Expenses
app.get("/api/expenses", authMiddleware, async (req, res) => {
  const userExpenses = await Expense.find({ user: req.currentUser.email });
  res.json(userExpenses);
});

//  Edit Expense
app.put("/api/expenses/:id", authMiddleware, async (req, res) => {
  const { date, category, amount } = req.body;
  const updated = await Expense.findOneAndUpdate(
    { _id: req.params.id, user: req.currentUser.email },
    { date, category, amount: parseFloat(amount) },
    { new: true }
  );
  if (!updated) return res.status(404).json({ message: "Expense not found" });
  res.json({ message: "Expense updated", expense: updated });
});

//  Delete Expense
app.delete("/api/expenses/:id", authMiddleware, async (req, res) => {
  const deleted = await Expense.findOneAndDelete({ _id: req.params.id, user: req.currentUser.email });
  if (!deleted) return res.status(404).json({ message: "Expense not found" });
  res.json({ message: "Expense deleted" });
});

//  Filter by Date
app.get("/api/expenses/date/:date", authMiddleware, async (req, res) => {
  const filtered = await Expense.find({ user: req.currentUser.email, date: req.params.date });
  res.json(filtered);
});

//  Filter by Category
app.get("/api/expenses/category/:category", authMiddleware, async (req, res) => {
  const filtered = await Expense.find({
    user: req.currentUser.email,
    category: { $regex: new RegExp(`^${req.params.category}$`, "i") }
  });
  res.json(filtered);
});

//  Total Expense
app.get("/api/expenses/total", authMiddleware, async (req, res) => {
  const expenses = await Expense.find({ user: req.currentUser.email });
  const total = expenses.reduce((sum, e) => sum + e.amount, 0);
  res.json({ totalExpense: total });
});

// Add Income
app.post("/api/incomes", authMiddleware, async (req, res) => {
  const { date, source, amount } = req.body;
  const newIncome = await Income.create({
    user: req.currentUser.email,
    date,
    source,
    amount: parseFloat(amount)
  });
  res.json({ message: "Income added", income: newIncome });
});

// View Incomes
app.get("/api/incomes", authMiddleware, async (req, res) => {
  const userIncomes = await Income.find({ user: req.currentUser.email });
  res.json(userIncomes);
});

// Edit Income
app.put("/api/incomes/:id", authMiddleware, async (req, res) => {
  const { date, source, amount } = req.body;
  const updated = await Income.findOneAndUpdate(
    { _id: req.params.id, user: req.currentUser.email },
    { date, source, amount: parseFloat(amount) },
    { new: true }
  );
  if (!updated) return res.status(404).json({ message: "Income not found" });
  res.json({ message: "Income updated", income: updated });
});

// Delete Income
app.delete("/api/incomes/:id", authMiddleware, async (req, res) => {
  const deleted = await Income.findOneAndDelete({ _id: req.params.id, user: req.currentUser.email });
  if (!deleted) return res.status(404).json({ message: "Income not found" });
  res.json({ message: "Income deleted" });
});

// Total Income
app.get("/api/incomes/total", authMiddleware, async (req, res) => {
  const incomes = await Income.find({ user: req.currentUser.email });
  const total = incomes.reduce((sum, i) => sum + i.amount, 0);
  res.json({ totalIncome: total });
});

// Start server
app.listen(PORT, () => console.log(` Server running on http://localhost:${PORT}`));
