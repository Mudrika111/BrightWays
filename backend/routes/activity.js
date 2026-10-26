const express = require("express");
const router  = express.Router();
const db      = require("../db");

router.get("/", async (req, res) => {
  try {
    const { type } = req.query;
    if (!type) return res.status(400).json({ success: false, message: "Missing activity type" });
    const [rows] = await db.execute(
      "SELECT id, activity_type, title, description, difficulty_level, duration_minutes FROM activities WHERE activity_type = ?",
      [type.toLowerCase()]
    );
    res.json({ success: true, activities: rows });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

router.post("/", async (req, res) => {
  try {
    const { user_id, activity_type, score_percent, time_spent_seconds } = req.body;

    if (!user_id || !activity_type) {
      return res.status(400).json({ success: false, message: "Missing required fields" });
    }

    const type = activity_type.toLowerCase();

    // Get all activity IDs for this type
    const [actRows] = await db.execute(
      "SELECT id FROM activities WHERE activity_type = ? ORDER BY id ASC",
      [type]
    );

    if (actRows.length === 0) {
      return res.status(400).json({ success: false, message: "No activities found for type: " + type });
    }

    // Pick a random activity_id from available ones so each session
    // can map to different activities (avoids always reusing the same ID)
    const activity_id = actRows[Math.floor(Math.random() * actRows.length)].id;

    const score     = score_percent      || 0;
    const timeSpent = time_spent_seconds || 0;

    // Always insert a new session row (allows counting multiple completions today)
    await db.execute(
      `INSERT INTO activity_sessions
       (user_id, activity_id, activity_type, score_percent, time_spent_seconds)
       VALUES (?, ?, ?, ?, ?)`,
      [user_id, activity_id, type, score, timeSpent]
    );

    // Update best score in progress table
    await db.execute(
      `INSERT INTO user_activity_progress
       (user_id, activity_id, score, time_spent_seconds, status)
       VALUES (?, ?, ?, ?, 'completed')
       ON DUPLICATE KEY UPDATE
         score              = GREATEST(score, VALUES(score)),
         time_spent_seconds = VALUES(time_spent_seconds),
         status             = 'completed',
         completed_at       = CURRENT_TIMESTAMP`,
      [user_id, activity_id, score, timeSpent]
    );

    res.json({ success: true, message: "Saved" });

  } catch (err) {
    console.error("Save activity error:", err.message);
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
