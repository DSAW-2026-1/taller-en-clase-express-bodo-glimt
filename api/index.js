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
app.get("/", (req, res) => {
  res.status(200).send(`
    <!doctype html>
    <html>
      <head>
        <meta charset="utf-8" />
        <title>Auth API Tester</title>
      </head>
      <body style="font-family: Arial; max-width: 700px; margin: 40px auto;">
        <h1>Auth API Tester</h1>
        <p>Prueba login y request por rol aquí mismo.</p>

        <h3>1) Login</h3>
        <select id="user">
          <option value="ADMIN">ADMIN</option>
          <option value="USER">USER</option>
        </select>
        <button onclick="doLogin()">Login</button>
        <pre id="loginOut"></pre>

        <h3>2) Request por rol</h3>
        <select id="role">
          <option value="ADMIN">ADMIN</option>
          <option value="USER">USER</option>
        </select>
        <button onclick="doRequest()">Request</button>
        <pre id="reqOut"></pre>

        <script>
          let token = "";

          async function doLogin() {
            const u = document.getElementById("user").value;
            const res = await fetch("/login", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ username: u, password: u })
            });
            const data = await res.json();
            token = data.token || "";
            document.getElementById("loginOut").textContent =
              "Status: " + res.status + "\\n" + JSON.stringify(data, null, 2);
          }

          async function doRequest() {
            const role = document.getElementById("role").value;
            const res = await fetch("/request/" + role, {
              headers: { Authorization: "Bearer " + token }
            });
            const data = await res.json();
            document.getElementById("reqOut").textContent =
              "Status: " + res.status + "\\n" + JSON.stringify(data, null, 2);
          }
        </script>
      </body>
    </html>
  `);
});


module.exports = app;
