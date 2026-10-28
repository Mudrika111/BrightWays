
const express = require("express");
const router = express.Router();
const db = require("../db");
const bcrypt = require("bcrypt");
const { createSession } = require("../middleware/auth");

router.post("/", async (req, res) => {
  try {
    const { username, password, role } = req.body || {};

    if (
      typeof username !== "string" ||
      typeof password !== "string" ||
      !username.trim() ||
      !password ||
      !["caregiver", "child"].includes(role)
    ) {
      return res.status(400).json({
        success: false,
        message: "A valid role, name, and password are required"
      });
    }

    const [users] = await db.execute(
      `SELECT id, username, email, password, user_type, first_name
       FROM users
       WHERE user_type = ?
         AND (
          username = ?
          OR (user_type = 'child' AND first_name = ?)
          OR (
            user_type = 'caregiver'
            AND CONCAT_WS(' ', first_name, last_name) = ?
          )
         )`,
      [role, username.trim(), username.trim(), username.trim()]
    );

    let user = null;
    for (const candidate of users) {
      if (await bcrypt.compare(password, candidate.password)) {
        user = candidate;
        break;
      }
    }

    if (!user) {
      return res.status(401).json({
        success: false,
        message: "Invalid username or password"
      });
    }

    let childProfile = null;

    // Load the child's profile for the authenticated account.
    if (user.user_type === "caregiver") {
      const [profiles] = await db.execute(
        `SELECT * FROM child_profiles
         WHERE caregiver_id = ?
         LIMIT 1`,
        [user.id]
      );

      childProfile = profiles[0] || null;

      // A caregiver can enter the child dashboard only if
      // a child is linked to their account.
      if (role === "child" && !childProfile) {
        return res.status(403).json({
          success: false,
          message: "No child profile is linked to this caregiver"
        });
      }
    } else {
      const [profiles] = await db.execute(
        `SELECT * FROM child_profiles
         WHERE child_user_id = ?
         LIMIT 1`,
        [user.id]
      );

      childProfile = profiles[0] || null;
    }
    await createSession(req, user);

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
    console.error("Login error:", err);
    return res.status(500).json({
      success: false,
      message: "Server error"
    });
  }
});

module.exports = router;
