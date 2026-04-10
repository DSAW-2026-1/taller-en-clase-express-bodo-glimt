const express = require("express");
const jwt = require("jsonwebtoken");

const app = express();
const JWT_SECRET = process.env.JWT_SECRET || "super-secret-key";
app.get("/", (req, res) => {
  res.status(200).json({ message: "API running" });
});
app.use(express.json());

const users = [
  { username: "ADMIN", password: "ADMIN", role: "ADMIN" },
  { username: "USER", password: "USER", role: "USER" }
];

app.post("/login", (req, res) => {
  const { username, password } = req.body;

  const user = users.find(
    (u) => u.username === username && u.password === password
  );

  if (!user) {
    return res.status(400).json({ message: "invalid credentials" });
  }

  const token = jwt.sign(
    { username: user.username, role: user.role },
    JWT_SECRET,
    { expiresIn: "1h" }
  );

  return res.status(200).json({ token });
});

function authenticate(req, res, next) {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ message: "Youre not allowed to do this" });
  }

  const token = authHeader.split(" ")[1];

  try {
    const payload = jwt.verify(token, JWT_SECRET);
    req.user = payload;
    next();
  } catch (error) {
    return res.status(401).json({ message: "Youre not allowed to do this" });
  }
}

app.get("/request/:role", authenticate, (req, res) => {
  const requestedRole = req.params.role.toUpperCase();
  const tokenRole = req.user.role;

  if (requestedRole !== tokenRole) {
    return res.status(401).json({ message: "Youre not allowed to do this" });
  }

  if (requestedRole === "ADMIN") {
    return res.status(200).json({ message: "Hi from ADMIN" });
  }

  if (requestedRole === "USER") {
    return res.status(200).json({ message: "Hi from USER" });
  }

  return res.status(401).json({ message: "Youre not allowed to do this" });
});


module.exports = app;
