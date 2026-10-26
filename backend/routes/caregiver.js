const express = require("express");
const router = express.Router();
const db = require("../db");

// GET caregiver dashboard
router.get("/", async (req, res) => {
  const caregiver_id = parseInt(req.query.caregiver_id);

  if (!caregiver_id) {
    return res.status(400).json({
      success: false,
      message: "Missing caregiver_id"
    });
  }

  try {
    // 🔹 Verify caregiver
    const [userRows] = await db.execute(
      `SELECT id, first_name, last_name, username
       FROM users
       WHERE id = ? AND user_type = 'caregiver'`,
      [caregiver_id]
    );

    if (userRows.length === 0) {
      return res.status(403).json({
        success: false,
        message: "User not found or not a caregiver"
      });
    }

    const caregiver = userRows[0];

    // 🔹 Get children
    const [childrenRows] = await db.execute(
      `SELECT id, child_name, child_age, condition_type, child_user_id
       FROM child_profiles
       WHERE caregiver_id = ?
       ORDER BY created_at ASC`,
      [caregiver_id]
    );

    const childrenData = [];

    for (let child of childrenRows) {
      let entry = {
        profile_id: child.id,
        child_name: child.child_name,
        child_age: child.child_age,
        condition_type: child.condition_type,
        child_user_id: child.child_user_id,
        sessions: [],
        statistics: {
          total_completed: 0,
          avg_score: 0,
          total_sessions: 0
        },
        accuracy_trend: {
          labels: [],
          data: []
        },
        activity_breakdown: {
          labels: [],
          data: []
        }
      };

      if (child.child_user_id) {
        const uid = child.child_user_id;

        // 🔹 Sessions
        const [sessions] = await db.execute(
          `SELECT s.completed_at, a.title, s.activity_type, s.score_percent, s.time_spent_seconds
           FROM activity_sessions s
           JOIN activities a ON a.id = s.activity_id
           WHERE s.user_id = ?
           ORDER BY s.completed_at DESC
           LIMIT 10`,
          [uid]
        );

        entry.sessions = sessions.map(s => ({
          date: new Date(s.completed_at).toLocaleDateString("en-US", { month: "short", day: "2-digit" }),
          activity: s.title,
          type: s.activity_type.charAt(0).toUpperCase() + s.activity_type.slice(1),
          score: s.score_percent,
          time: `${Math.floor(s.time_spent_seconds / 60)}m ${s.time_spent_seconds % 60}s`,
          status: "Completed"
        }));

        // 🔹 Stats
        const [[stat]] = await db.execute(
          `SELECT COUNT(*) as total_sessions,
                  COALESCE(AVG(score_percent),0) as avg_score
           FROM activity_sessions
           WHERE user_id = ?`,
          [uid]
        );

        const [[completed]] = await db.execute(
          `SELECT COUNT(*) as total_completed
           FROM user_activity_progress
           WHERE user_id = ? AND status = 'completed'`,
          [uid]
        );

        entry.statistics = {
          total_completed: completed.total_completed,
          avg_score: Math.round(stat.avg_score),
          total_sessions: stat.total_sessions
        };

        // 🔹 Accuracy trend
        const [trend] = await db.execute(
          `SELECT score_percent
           FROM activity_sessions
           WHERE user_id = ?
           ORDER BY completed_at DESC
           LIMIT 10`,
          [uid]
        );

        const trendData = trend.map(t => t.score_percent).reverse();

        entry.accuracy_trend = {
          labels: trendData.map((_, i) => `S${i + 1}`),
          data: trendData
        };

        // 🔹 Activity breakdown
        const [breakdown] = await db.execute(
          `SELECT activity_type, COUNT(*) as cnt
           FROM activity_sessions
           WHERE user_id = ?
           GROUP BY activity_type`,
          [uid]
        );

        entry.activity_breakdown = {
          labels: breakdown.map(b => b.activity_type),
          data: breakdown.map(b => b.cnt)
        };
      }

      childrenData.push(entry);
    }

    res.json({
      success: true,
      caregiver,
      children: childrenData
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({
      success: false,
      message: "Server error"
    });
  }
});

module.exports = router;