
import "dotenv/config";

import express from "express";
import session from "express-session";
import MySQLStoreFactory from "express-mysql-session";
import path from "path";
import type { ResultSetHeader, RowDataPacket } from "mysql2/promise";
import db from "./db";
import { requireAuth, requireRole } from "./middleware/auth";
import activityRouter from "./routes/activity";
import caregiverRouter from "./routes/caregiver";
import dashboardRouter from "./routes/dashboard";
import loginRouter from "./routes/login";
import registerRouter from "./routes/register";
import sessionRouter from "./routes/session";

const app = express();
const MySQLStore = MySQLStoreFactory(session);
const PORT = process.env.PORT || 5000;

// Require a session secret instead of using a predictable default.
if (!process.env.SESSION_SECRET) {
  throw new Error("SESSION_SECRET is missing from backend/.env");
}

app.use(express.json());

// Store sessions in MySQL so they survive server restarts.
const sessionStore = new MySQLStore({
  host: process.env.DB_HOST,
  port: Number(process.env.DB_PORT),
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  createDatabaseTable: true,
  clearExpired: true,
  checkExpirationInterval: 15 * 60 * 1000
});

app.use(
  session({
    name: "bw.sid",
    secret: process.env.SESSION_SECRET,
    store: sessionStore,
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 2 * 60 * 60 * 1000
    }
  })
);

// Serve the React production build from the same origin.
const frontendPath = path.join(__dirname, "../../frontend/dist");
app.use(express.static(frontendPath));

// API routes
app.use("/api/activity", requireAuth, requireRole("child"), activityRouter);
app.use("/api/caregiver", requireAuth, requireRole("caregiver"), caregiverRouter);
app.use("/api/dashboard", requireAuth, requireRole("child"), dashboardRouter);
app.use("/api/login", loginRouter);
app.use("/api/register", registerRouter);
app.use("/api/session", sessionRouter);

// Do not mount /api/caregiver a second time.
app.get(/^(?!\/api(?:\/|$)).*/, (req, res) => {
  res.sendFile(path.join(frontendPath, "index.html"));
});

async function startServer() {
  await db.execute<ResultSetHeader>(
    `CREATE TABLE IF NOT EXISTS activity_sessions (
      id INT PRIMARY KEY AUTO_INCREMENT,
      user_id INT NOT NULL,
      activity_id INT NOT NULL,
      activity_type ENUM('autism', 'adhd', 'dyslexia') NOT NULL,
      activity_key VARCHAR(80) DEFAULT NULL,
      score_percent INT NOT NULL DEFAULT 0,
      time_spent_seconds INT DEFAULT 0,
      completed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY (activity_id) REFERENCES activities(id) ON DELETE CASCADE,
      INDEX idx_user_sessions (user_id),
      INDEX idx_user_type_sessions (user_id, activity_type)
    )`
  );

  const [columns] = await db.execute<RowDataPacket[]>(
    "SHOW COLUMNS FROM activity_sessions LIKE 'activity_key'"
  );
  if (columns.length === 0) {
    await db.execute<ResultSetHeader>(
      "ALTER TABLE activity_sessions ADD COLUMN activity_key VARCHAR(80) DEFAULT NULL"
    );
  }

  app.listen(PORT, () => {
    console.log(`BrightWays server running at http://localhost:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error("Unable to initialize the database or start the server:", err);
  process.exitCode = 1;
});
