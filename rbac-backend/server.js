import express from "express";
import cors from "cors";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import dotenv from "dotenv";
import Database from "better-sqlite3";
import os from "os";
import si from "systeminformation"; // Added for real metrics
import { Server } from "socket.io";
import http from "http";

dotenv.config();

const app = express();
const PORT = 5005;
const JWT_SECRET = process.env.JWT_SECRET || "supersecretkey";

// --- Database setup ---
const db = new Database("./rbac.db");

// --- Ensure all tables and columns exist ---
db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT UNIQUE,
    password TEXT,
    is_active INTEGER DEFAULT 1,
    last_login DATETIME DEFAULT NULL,
    last_ip TEXT
  );

  CREATE TABLE IF NOT EXISTS roles (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT UNIQUE
  );

  CREATE TABLE IF NOT EXISTS user_roles (
    user_id INTEGER,
    role_id INTEGER,
    FOREIGN KEY(user_id) REFERENCES users(id),
    FOREIGN KEY(role_id) REFERENCES roles(id)
  );

  CREATE TABLE IF NOT EXISTS audit_logs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    admin_id INTEGER,
    action TEXT,
    target_user TEXT,
    timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
  );
`);

// Seed Roles
const roles = ["admin", "manager", "employee", "hr", "it_support"];
roles.forEach((role) =>
  db.prepare("INSERT OR IGNORE INTO roles (name) VALUES (?)").run(role)
);

app.use(
  cors({
    origin: ["http://localhost:5173", "http://127.0.0.1:5173", "http://localhost:3000"],
    methods: ["GET", "POST", "PUT", "DELETE"],
    allowedHeaders: ["Content-Type", "Authorization"],
    credentials: true,
  })
);

app.use(express.json());

// --- SERVER + SOCKET.IO ---
const server = http.createServer(app);
const io = new Server(server, { cors: { origin: "*" } });

// --- REAL-TIME AUDIT LOG EMITTER ---
const emitAuditLog = (admin_id, action, target_user) => {
  const result = db
    .prepare("INSERT INTO audit_logs (admin_id, action, target_user) VALUES (?, ?, ?)")
    .run(admin_id, action, target_user);

  const newLog = db
    .prepare(`
      SELECT audit_logs.id, u.username AS admin, audit_logs.action, audit_logs.target_user, audit_logs.timestamp
      FROM audit_logs
      LEFT JOIN users u ON audit_logs.admin_id = u.id
      WHERE audit_logs.id = ?
    `)
    .get(result.lastInsertRowid);

  io.emit("new_audit_log", newLog);
};

// --- Auth middleware ---
const verifyToken = (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ message: "No token provided" });
  }

  const token = authHeader.split(" ")[1];
  try {
    req.user = jwt.verify(token, JWT_SECRET);
    next();
  } catch (err) {
    res.status(403).json({ message: "Invalid or expired token" });
  }
};

// --- ROUTES ---
// Health Check
app.get("/", (req, res) => res.json({ message: "Backend is running" }));

// --- REGISTER ---
app.post("/register", async (req, res) => {
  const { username, password, role } = req.body;
  try {
    const hashedPassword = await bcrypt.hash(password, 10);
    const roleRow = db.prepare("SELECT id FROM roles WHERE name = ?").get(role.toLowerCase());

    if (!roleRow) return res.status(400).json({ message: "Invalid role selected" });

    const registerTx = db.transaction(() => {
      const result = db.prepare("INSERT INTO users (username, password) VALUES (?, ?)").run(username, hashedPassword);
      db.prepare("INSERT INTO user_roles (user_id, role_id) VALUES (?, ?)").run(result.lastInsertRowid, roleRow.id);
    });
    registerTx();

    res.status(201).json({ message: "User registered successfully" });
  } catch (err) {
    console.error("Register error:", err);
    res.status(400).json({ message: "Username already exists" });
  }
});

// --- LOGIN ---
app.post("/login", async (req, res) => {
  const { username, password } = req.body;
  const user = db.prepare("SELECT * FROM users WHERE username = ?").get(username);

  if (!user || !(await bcrypt.compare(password, user.password)))
    return res.status(401).json({ message: "Invalid credentials" });

  const role = db
    .prepare(`
      SELECT roles.name FROM roles 
      JOIN user_roles ON roles.id = user_roles.role_id 
      WHERE user_roles.user_id = ?
    `)
    .get(user.id);

  db.prepare("UPDATE users SET last_login = CURRENT_TIMESTAMP WHERE id = ?").run(user.id);

  const token = jwt.sign({ id: user.id, role: role.name, username: user.username }, JWT_SECRET, {
    expiresIn: "1h",
  });

  res.json({ token, role: role.name, username: user.username });
});

// --- GET USERS ---
app.get("/users", verifyToken, (req, res) => {
  try {
    const users = db
      .prepare(
        `SELECT users.id, users.username, users.last_login, users.is_active, roles.name as role 
         FROM users 
         JOIN user_roles ON users.id = user_roles.user_id 
         JOIN roles ON user_roles.role_id = roles.id 
         ORDER BY roles.name, users.username`
      )
      .all();
    res.json(users);
  } catch (err) {
    res.status(500).json({ message: "Database error" });
  }
});

// --- DASHBOARD STATS ---
app.get("/dashboard-stats", verifyToken, (req, res) => {
  try {
    const userCount = db.prepare("SELECT COUNT(*) AS count FROM users").get().count;
    const logCount = db.prepare("SELECT COUNT(*) AS count FROM audit_logs").get().count;

    const roles = db
      .prepare(`
        SELECT roles.name AS label, COUNT(users.id) AS value
        FROM roles
        LEFT JOIN user_roles ON roles.id = user_roles.role_id
        LEFT JOIN users ON user_roles.user_id = users.id
        GROUP BY roles.name
      `)
      .all();

    const recentLogs = db
      .prepare(`
        SELECT audit_logs.id, u.username AS admin, audit_logs.action, audit_logs.target_user, audit_logs.timestamp
        FROM audit_logs
        LEFT JOIN users u ON audit_logs.admin_id = u.id
        ORDER BY audit_logs.timestamp DESC
        LIMIT 10
      `)
      .all();

    const cpuUsage = Math.round(os.loadavg()[0] * 10);
    const ramUsage = Math.round(((os.totalmem() - os.freemem()) / os.totalmem()) * 100);

    res.json({
      stats: { userCount, logCount, cpuUsage, ramUsage, uptime: os.uptime() },
      roleDistribution: roles,
      recentLogs,
    });
  } catch (err) {
    console.error("Dashboard stats error:", err);
    res.status(500).json({ message: "Failed to fetch dashboard stats" });
  }
});

// --- CREATE USER ---
app.post("/users", verifyToken, (req, res) => {
  try {
    if (req.user.role.toLowerCase() !== "admin") return res.status(403).json({ message: "Forbidden" });
    const { username, password, role } = req.body;
    if (!username || !password || !role) return res.status(400).json({ message: "Missing fields" });

    const roleRow = db.prepare("SELECT id FROM roles WHERE name = ?").get(role.toLowerCase());
    if (!roleRow) return res.status(400).json({ message: "Invalid role" });

    const hashedPassword = bcrypt.hashSync(password, 10);

    const createTx = db.transaction(() => {
      const result = db.prepare("INSERT INTO users (username, password) VALUES (?, ?)").run(username, hashedPassword);
      db.prepare("INSERT INTO user_roles (user_id, role_id) VALUES (?, ?)").run(result.lastInsertRowid, roleRow.id);

      // Log admin action + emit
      emitAuditLog(req.user.id, "Created User", username);

      return db
        .prepare(
          "SELECT users.id, users.username, users.is_active, users.last_login, roles.name AS role FROM users JOIN user_roles ON users.id = user_roles.user_id JOIN roles ON user_roles.role_id = roles.id WHERE users.id = ?"
        )
        .get(result.lastInsertRowid);
    });

    const newUser = createTx();
    res.status(201).json(newUser);
  } catch (err) {
    console.error("Create user error:", err);
    res.status(400).json({ message: "Username may already exist" });
  }
});

// --- UPDATE USER ---
app.put("/users/:id", verifyToken, (req, res) => {
  try {
    if (req.user.role.toLowerCase() !== "admin") return res.status(403).json({ message: "Forbidden" });
    const userId = req.params.id;
    const { username, role } = req.body;

    const roleRow = db.prepare("SELECT id FROM roles WHERE name = ?").get(role.toLowerCase());
    if (!roleRow) return res.status(400).json({ message: "Invalid role" });

    const updateTx = db.transaction(() => {
      db.prepare("UPDATE users SET username = ? WHERE id = ?").run(username, userId);
      db.prepare("UPDATE user_roles SET role_id = ? WHERE user_id = ?").run(roleRow.id, userId);

      // Log admin action + emit
      emitAuditLog(req.user.id, "Updated User", username);

      return db
        .prepare(
          "SELECT users.id, users.username, users.is_active, users.last_login, roles.name AS role FROM users JOIN user_roles ON users.id = user_roles.user_id JOIN roles ON user_roles.role_id = roles.id WHERE users.id = ?"
        )
        .get(userId);
    });

    const updatedUser = updateTx();
    res.json(updatedUser);
  } catch (err) {
    console.error("Update user error:", err);
    res.status(400).json({ message: "Failed to update user" });
  }
});

// --- DELETE USER ---
app.delete("/users/:id", verifyToken, (req, res) => {
  try {
    if (req.user.role.toLowerCase() !== "admin") return res.status(403).json({ message: "Forbidden" });
    const userId = req.params.id;

    const targetUser = db.prepare("SELECT username FROM users WHERE id = ?").get(userId);

    db.prepare("DELETE FROM user_roles WHERE user_id = ?").run(userId);
    db.prepare("DELETE FROM users WHERE id = ?").run(userId);

    // Log admin action + emit
    emitAuditLog(req.user.id, "Deleted User", targetUser.username);

    res.json({ message: "User deleted" });
  } catch (err) {
    console.error("Delete user error:", err);
    res.status(500).json({ message: "Failed to delete user" });
  }
});

// --- LOCK/UNLOCK USER ---
app.put("/users/:id/lock", verifyToken, (req, res) => {
  try {
    if (req.user.role.toLowerCase() !== "admin") return res.status(403).json({ message: "Forbidden" });
    const userId = req.params.id;

    const user = db.prepare("SELECT is_active, username FROM users WHERE id = ?").get(userId);
    if (!user) return res.status(404).json({ message: "User not found" });

    const newStatus = user.is_active ? 0 : 1;
    db.prepare("UPDATE users SET is_active = ? WHERE id = ?").run(newStatus, userId);

    const action = newStatus ? "Unlocked User" : "Locked User";

    // Log admin action + emit
    emitAuditLog(req.user.id, action, user.username);

    const updatedUser = db
      .prepare(
        "SELECT users.id, users.username, users.is_active, users.last_login, roles.name AS role FROM users JOIN user_roles ON users.id = user_roles.user_id JOIN roles ON user_roles.role_id = roles.id WHERE users.id = ?"
      )
      .get(userId);
    res.json(updatedUser);
  } catch (err) {
    console.error("Lock/Unlock user error:", err);
    res.status(500).json({ message: "Failed to update user status" });
  }
});

// --- RESET PASSWORD ---
app.post("/users/:id/reset-password", verifyToken, (req, res) => {
  try {
    if (req.user.role.toLowerCase() !== "admin") return res.status(403).json({ message: "Forbidden" });
    const userId = req.params.id;
    const newPassword = "Temp@1234";
    const hashedPassword = bcrypt.hashSync(newPassword, 10);

    const targetUser = db.prepare("SELECT username FROM users WHERE id = ?").get(userId);
    db.prepare("UPDATE users SET password = ? WHERE id = ?").run(hashedPassword, userId);

    // Log admin action + emit
    emitAuditLog(req.user.id, "Reset Password", targetUser.username);

    res.json({ message: "Password reset successfully" });
  } catch (err) {
    console.error("Password reset error:", err);
    res.status(500).json({ message: "Failed to reset password" });
  }
});

// --- REAL SYSTEM METRICS ENDPOINT ---
app.get("/system-metrics", async (req, res) => {
  try {
    const cpu = Math.round(os.loadavg()[0] * 10);
    const ram = Math.round(((os.totalmem() - os.freemem()) / os.totalmem()) * 100);
    const networkStats = await si.networkStats();
    const network = Math.round(networkStats[0].rx_sec / 1024);
    const diskStats = await si.fsSize();
    const disk = Math.round((diskStats[0].used / diskStats[0].size) * 100);

    res.json({ cpu, ram, network, disk, timestamp: new Date().toISOString() });
  } catch (err) {
    console.error("Metrics error:", err);
    res.status(500).json({ message: "Failed to fetch metrics" });
  }
});

// --- AUDIT LOGS ENDPOINT ---
app.get("/audit-logs", verifyToken, (req, res) => {
  try {
    const logs = db
      .prepare(`
        SELECT audit_logs.id, u.username AS admin, audit_logs.action, audit_logs.target_user, audit_logs.timestamp
        FROM audit_logs
        LEFT JOIN users u ON audit_logs.admin_id = u.id
        ORDER BY audit_logs.timestamp DESC
      `)
      .all();
    res.json(logs);
  } catch (err) {
    console.error("Audit logs fetch error:", err);
    res.status(500).json({ message: "Failed to fetch audit logs" });
  }
});

// --- SOCKET.IO SYSTEM METRICS ---
setInterval(async () => {
  try {
    const cpu = Math.round(os.loadavg()[0] * 10);
    const ram = Math.round(((os.totalmem() - os.freemem()) / os.totalmem()) * 100);
    const networkStats = await si.networkStats();
    const network = Math.round(networkStats[0].rx_sec / 1024);
    const diskStats = await si.fsSize();
    const disk = Math.round((diskStats[0].used / diskStats[0].size) * 100);

    io.emit("system_metrics", { cpu, ram, network, disk });
  } catch (err) {
    console.error("Socket metrics error:", err);
  }
}, 5000);

// --- SOCKET.IO ONLINE USERS TRACKING ---
const onlineUsers = new Set();

io.on("connection", (socket) => {
  console.log("New socket connected:", socket.id);

  // Listen for user registration
  socket.on("register_user", (userId) => {
    const numericId = Number(userId); // <-- FIX: ensure ID is numeric
    onlineUsers.add(numericId);
    io.emit("online_users", Array.from(onlineUsers));
    socket.userId = numericId;
  });

  socket.on("disconnect", () => {
    if (socket.userId) {
      onlineUsers.delete(socket.userId);
      io.emit("online_users", Array.from(onlineUsers));
    }
    console.log("Socket disconnected:", socket.id);
  });
});

server.listen(PORT, "127.0.0.1", () => console.log(`Server running on http://127.0.0.1:${PORT}`));