const express = require("express");
const router  = express.Router();
const db      = require("../db");
const { getActivity } = require("../activityCatalog");

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
    const {
      activity_key,
      score_percent,
      time_spent_seconds
    } = req.body || {};
    const user_id = req.session.user.id;
    const activity = getActivity(activity_key);

    if (!activity) {
      return res.status(400).json({
        success: false,
        message: "A valid activity must be selected"
      });
    }

    if (
      typeof score_percent !== "number" ||
      !Number.isFinite(score_percent) ||
      score_percent < 0 ||
      score_percent > 100 ||
      typeof time_spent_seconds !== "number" ||
      !Number.isFinite(time_spent_seconds) ||
      time_spent_seconds < 0
    ) {
      return res.status(400).json({
        success: false,
        message: "Score and time must be valid non-negative numbers"
      });
    }
    const score = score_percent;
    const timeSpent = time_spent_seconds;

    const [actRows] = await db.execute(
      `SELECT id
       FROM activities
       WHERE activity_type = ?
       ORDER BY id ASC
       LIMIT 1`,
      [activity.type]
    );

    if (actRows.length === 0) {
      return res.status(400).json({
        success: false,
        message: `No activities found for type: ${activity.type}`
      });
    }

    const activity_id = actRows[0].id;

    await db.execute(
      `INSERT INTO activity_sessions
       (user_id, activity_id, activity_type, activity_key, score_percent, time_spent_seconds)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [user_id, activity_id, activity.type, activity_key, score, timeSpent]
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
    console.error("Save activity error:", err);
    res.status(500).json({ success: false, message: "Unable to save activity" });
  }
});

module.exports = router;
