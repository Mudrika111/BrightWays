const express = require("express");
const router  = express.Router();
const db      = require("../db");

router.get("/", async (req, res) => {
  try {
    const user_id = req.session.user.id;

    const [[user]] = await db.execute(
      `SELECT id, username, first_name, last_name, user_type
       FROM users
       WHERE id = ? AND user_type = 'child'`,
      [user_id]
    );
    if (!user) return res.status(404).json({ success: false, message: "User not found" });

    const [completed] = await db.execute(
      `SELECT DISTINCT activity_key
       FROM activity_sessions
       WHERE user_id = ?
         AND DATE(completed_at) = CURDATE()
         AND activity_key IS NOT NULL`,
      [user_id]
    );

    res.json({
      success: true,
      user,
      completed_activity_keys: completed.map(row => row.activity_key)
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

module.exports = router;
