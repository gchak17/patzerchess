const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { v4: uuidv4 } = require("uuid");
const User = require("./db");
const router = require("express").Router();
require("dotenv").config();
const secretKey = process.env.JWT_SECRET;

router.get("/", (req, res) => {
  res.sendFile("/static/index.html", { root: __dirname });
});

router.get("/dashboard", async (req, res) => {
  const token = req.get("token");

  if (!token) {
    res.sendFile("/static/dashboard.html", { root: __dirname });
  } else {
    try {
      const username = jwt.verify(token, secretKey).username;
      const user = await User.findOne({ username }).lean();

      res.status(200).json({ username: user.username, rating: user.rating });
    } catch (err) {
      res.status(500).send();
    }
  }
});

router.post("/login", async (req, res) => {
  const { username, password } = req.body;
  const user = await User.findOne({ username }).lean();

  if (!user) {
    return res.status(403).json({ message: "Invalid username" });
  }

  if (await bcrypt.compare(password, user.password)) {
    const token = jwt.sign(
      { id: user._id, username: user.username },
      secretKey
    );

    return res.status(200).json({ message: token });
  } else {
    res.status(403).json({ message: "Invalid password" });
  }
});

router.post("/register", async (req, res) => {
  let { username, password } = req.body;
  password = await bcrypt.hash(password, 10);

  try {
    const user = await User.create({
      username,
      password,
      rating: 1000,
    });

    const token = jwt.sign(
      { id: user._id, username: user.username },
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

router.post("/game", (req, res) => {
  const roomId = uuidv4();
  res.status(200).json({ message: roomId });
});

router.get("/game/:id", (req, res) => {
  res.sendFile("/static/game.html", { root: __dirname });
});

module.exports = router;