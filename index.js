const express = require("express");
const app = express();
const path = require("path");
const { v4: uuidv4 } = require("uuid");
const ws = require("express-ws")(app);
const bodyParser = require("body-parser");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const User = require("./db");
require("dotenv").config();

let rooms = {};

const secretKey = process.env.JWT_SECRET;
const port = process.env.PORT;

app.use("/", express.static(path.join(__dirname, "static")));
app.use(bodyParser.json());

app.post("/api/register", async (req, res) => {
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

// app.get("/*", (req, res) => {
//   res.sendFile(path.resolve(__dirname, "client", "index.html"));
// });

// app.post("/room", (req, res) => {
//   const roomId = uuidv4();
//   res.redirect(`/room/${roomId}`);
// });

// app.get("/room/:id", (req, res) => {
//   res.sendFile(path.join(__dirname + "/room.html"));
// });

// app.ws("/room/:id", (ws, req) => {
//   let id = req.params.id;
//   ws.on("message", (data) => {
//     let message = JSON.parse(data);
//     switch (message.type) {
//       case "connection":
//         if (!rooms[id]) {
//           rooms[id] = {};
//           rooms[id]["player1"] = ws;
//         } else {
//           rooms[id]["player2"] = ws;
//         }
//         break;
//       case "message":
//         rooms[id]["player1"].send(JSON.stringify(message));
//         rooms[id]["player2"].send(JSON.stringify(message));
//         break;
//       default:
//         break;
//     }
//   });
// });

app.listen(port, () => {
  console.log(`Listening at http://localhost:${port}`);
});
