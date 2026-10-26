const express = require("express");
const router = express.Router();
const db = require("../db");
const bcrypt = require("bcrypt");

router.post("/", async (req, res) => {
  try {
    const {
      username,
      email,
      password,
      full_name,
      child_name,
      child_age,
      condition
    } = req.body;

    if (!username || !email || !password) {
      return res.status(400).json({ success: false, message: "Missing fields" });
    }

    const hashed = await bcrypt.hash(password, 10);

    const nameParts = full_name ? full_name.split(" ") : ["", ""];
    const first_name = nameParts[0];
    const last_name  = nameParts.slice(1).join(" ");

    // Check caregiver username/email uniqueness
    const [exists] = await db.execute(
      "SELECT id FROM users WHERE username=? OR email=?",
      [username, email]
    );
    if (exists.length > 0) {
      return res.status(400).json({ success: false, message: "User already exists" });
    }

    // 1. Create caregiver account
    const [result] = await db.execute(
      `INSERT INTO users (username, email, password, user_type, first_name, last_name)
       VALUES (?, ?, ?, 'caregiver', ?, ?)`,
      [username, email, hashed, first_name, last_name]
    );
    const caregiverId = result.insertId;

    let childUserId = null;

    if (child_name) {
      // 2. Auto-generate child username: e.g. "danny_child"
      const childUsername = child_name.toLowerCase().replace(/\s+/g, "_") + "_child";
      const childEmail    = childUsername + "@brightways.local";

      // Make username unique if it already exists
      const [childExists] = await db.execute(
        "SELECT id FROM users WHERE username=? OR email=?",
        [childUsername, childEmail]
      );

      if (childExists.length > 0) {
        // Append caregiver id to guarantee uniqueness
        const uniqueUsername = childUsername + "_" + caregiverId;
        const uniqueEmail    = uniqueUsername + "@brightways.local";

        const [childResult] = await db.execute(
          `INSERT INTO users (username, email, password, user_type, first_name)
           VALUES (?, ?, ?, 'child', ?)`,
          [uniqueUsername, uniqueEmail, hashed, child_name]
        );
        childUserId = childResult.insertId;
      } else {
        const [childResult] = await db.execute(
          `INSERT INTO users (username, email, password, user_type, first_name)
           VALUES (?, ?, ?, 'child', ?)`,
          [childUsername, childEmail, hashed, child_name]
        );
        childUserId = childResult.insertId;
      }

      // 3. Create child_profile linked to both caregiver AND child user
      await db.execute(
        `INSERT INTO child_profiles (caregiver_id, child_user_id, child_name, child_age, condition_type)
         VALUES (?, ?, ?, ?, ?)`,
        [caregiverId, childUserId, child_name, child_age, condition.toLowerCase()]
      );
    }

    res.json({
      success: true,
      user: {
        id:         caregiverId,
        username:   username,
        email:      email,
        full_name:  full_name,
        first_name: child_name || first_name,
        condition:  condition,
        child_user_id: childUserId
      }
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

module.exports = router;
