const express = require("express");
const app = express();
const port = 3000;
const path = require("path");
const { v4: uuidv4 } = require("uuid");
const ws = require("express-ws")(app);

let rooms = {};

app.get("/*", (req, res) => {
  res.sendFile(path.join(__dirname + "/index.html"));
});

app.post("/room", (req, res) => {
  const roomId = uuidv4();
  res.redirect(`/room/${roomId}`);
});

app.get("/room/:id", (req, res) => {
  res.sendFile(path.join(__dirname + "/room.html"));
});

app.ws("/room/:id", (ws, req) => {
  let id = req.params.id;
  ws.on("message", (data) => {
    let message = JSON.parse(data);
    switch (message.type) {
      case "connection":
        if (!rooms[id]) {
          rooms[id] = {};
          rooms[id]["player1"] = ws;
        } else {
          rooms[id]["player2"] = ws;
        }
        break;
      case "message":
        rooms[id]["player1"].send(JSON.stringify(message));
        rooms[id]["player2"].send(JSON.stringify(message));
        break;
      default:
        break;
    }
  });
});

app.listen(port, () => {
  console.log(`Listening at http://localhost:${port}`);
});
