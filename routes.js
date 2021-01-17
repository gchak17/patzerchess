const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const User = require("./db");
const router = require("express").Router();
require("dotenv").config();

const secretKey = process.env.JWT_SECRET;

router.get("/api/dashboard", async (req, res) => {
  const token = req.get("token");

  try {
    const user = jwt.verify(token, secretKey);
    res.status(200).json({ username: user.username });
  } catch (err) {
    res.status(500).send();
  }
});

router.post("/api/register", async (req, res) => {
  let { username, password } = req.body;
  password = await bcrypt.hash(password, 10);

  try {
    const user = await User.create({
      username,
      password,
    });

    const token = jwt.sign(
      {
        id: user._id,
        username: user.username,
      },
      secretKey
    );

    res.status(200).json({ message: token });
  } catch (err) {
    if (err.code === 11000) {
      return res.status(409).json({ message: "Username already in use" });
    } else {
      return res.status(500).json({ message: "Internal server error" });
    }
  }
});

module.exports = router;
