const express = require("express");
const router  = express.Router();
const db      = require("../db");

router.get("/", async (req, res) => {
  try {
    const { user_id } = req.query;
    if (!user_id) return res.status(400).json({ success: false, message: "user_id required" });

    const [[user]] = await db.execute(
      "SELECT id, username, first_name, last_name, user_type FROM users WHERE id = ?",
      [user_id]
    );
    if (!user) return res.status(404).json({ success: false, message: "User not found" });

    // Count how many times the child has completed an activity today
    const [[done]] = await db.execute(
      `SELECT COUNT(*) as c
       FROM activity_sessions
       WHERE user_id = ?
       AND DATE(completed_at) = CURDATE()`,
      [user_id]
    );

    // UI always shows 4 cards per condition — hardcode total to 4
    res.json({
      success: true,
      user,
      statistics: {
        total_completed:  Math.min(done.c || 0, 4),
        total_activities: 4
      }
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

module.exports = router;
