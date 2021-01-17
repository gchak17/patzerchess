const express = require("express");
const app = express();
// const { v4: uuidv4 } = require("uuid");
// const ws = require("express-ws")(app);
const bodyParser = require("body-parser");
const router = require("./routes");
require("dotenv").config();

let rooms = {};
const port = process.env.PORT;

app.use(express.static(__dirname + "/static"));
app.use(bodyParser.json());
app.use(router);

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
