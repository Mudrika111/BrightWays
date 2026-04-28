const express = require("express");
const router = express.Router();
const db = require("../db");
const bcrypt = require("bcrypt");

router.post("/", async (req, res) => {
  try {
    const { username, password, role } = req.body;

    const [users] = await db.execute(
      "SELECT * FROM users WHERE username = ?",
      [username]
    );

    if (users.length === 0) {
      return res.status(401).json({ success: false, message: "User not found" });
    }

    const user = users[0];

    const match = await bcrypt.compare(password, user.password);
    if (!match) {
      return res.status(401).json({ success: false, message: "Wrong password" });
    }

    // Fetch child profile linked to this user (as caregiver)
    const [rows] = await db.execute(
      "SELECT * FROM child_profiles WHERE caregiver_id = ? LIMIT 1",
      [user.id]
    );

    const childProfile = rows[0] || null;

    // For caregiver login: return caregiver id + child_user_id so the
    // child dashboard can POST sessions under the correct child account.
    // For child login (if you ever add direct child accounts): user.id IS the child.
    const isCaregiver = user.user_type === "caregiver" || role === "caregiver";

    res.json({
      success: true,
      user: {
        id:             user.id,           // caregiver id (used for caregiver dashboard)
        child_user_id:  childProfile ? childProfile.child_user_id : null,  // ← KEY FIX
        username:       user.username,
        email:          user.email,
        user_type:      user.user_type,
        first_name:     childProfile ? childProfile.child_name : (user.first_name || user.username),
        condition:      childProfile ? childProfile.condition_type : null,
        childProfile:   childProfile
      }
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

module.exports = router;
