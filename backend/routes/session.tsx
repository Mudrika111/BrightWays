import express from "express";
import type { RowDataPacket } from "mysql2/promise";
const router = express.Router();
import db from "../db";
import { requireAuth } from "../middleware/auth";

router.get("/", requireAuth, async (req, res) => {
  try {
    const [users] = await db.execute<RowDataPacket[]>(
      `SELECT id, username, email, first_name, last_name, user_type
       FROM users
       WHERE id = ?
       LIMIT 1`,
      [req.session.user.id]
    );

    const user = users[0];
    if (!user || user.user_type !== req.session.user.user_type) {
      return res.status(401).json({
        success: false,
        message: "Your session is no longer valid"
      });
    }

    let childProfile = null;
    if (user.user_type === "caregiver") {
      const [profiles] = await db.execute<RowDataPacket[]>(
        `SELECT * FROM child_profiles
         WHERE caregiver_id = ?
         LIMIT 1`,
        [user.id]
      );
      childProfile = profiles[0] || null;
    } else if (user.user_type === "child") {
      const [profiles] = await db.execute<RowDataPacket[]>(
        `SELECT * FROM child_profiles
         WHERE child_user_id = ?
         LIMIT 1`,
        [user.id]
      );
      childProfile = profiles[0] || null;
    } else {
      return res.status(403).json({
        success: false,
        message: "This account type cannot use this application"
      });
    }

    return res.json({
      success: true,
      user: {
        id: user.id,
        child_user_id:
          user.user_type === "child"
            ? user.id
            : childProfile
              ? childProfile.child_user_id
              : null,
        username: user.username,
        email: user.email,
        user_type: user.user_type,
        first_name: childProfile
          ? childProfile.child_name
          : user.first_name || user.username,
        condition: childProfile ? childProfile.condition_type : null,
        childProfile
      }
    });
  } catch (err) {
    console.error("Session lookup error:", err);
    return res.status(500).json({
      success: false,
      message: "Unable to verify login session"
    });
  }
});

router.post("/logout", (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      console.error("Session destruction failed:", err);
      return res.status(500).json({
        success: false,
        message: "Unable to log out"
      });
    }

    res.clearCookie("bw.sid", {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production"
    });
    return res.json({ success: true });
  });
});

export default router;
