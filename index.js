const express = require("express");
const app = express();
const bodyParser = require("body-parser");
const router = require("./routes");
const server = require("http").Server(app);
const io = require("socket.io")(server);
const jwt = require("jsonwebtoken");
const path = require("path");
require("dotenv").config();
const users = [];
const secretKey = process.env.JWT_SECRET;
const port = process.env.PORT;

app.use(
  "/static",
  express.static(path.resolve(__dirname, "frontend", "static"))
);
app.use(bodyParser.json());
app.use(router);

server.listen(port, () => {
  console.log(`Listening at http://localhost:${port}`);
});

const getRoomUsers = (room) => {
  return users.filter((user) => user.room === room);
};

const userJoin = (id, username, room) => {
  const user = { id, username, room };
  users.push(user);
  return user;
};

const getCurrentUser = (id) => {
  return users.find((user) => user.id === id);
};

const userLeave = (id) => {
  const index = users.findIndex((user) => user.id === id);

  if (index !== -1) {
    return users.splice(index, 1)[0];
  }
};

io.on("connection", (socket) => {
  socket.on("joinGame", (data) => {
    const { auth_token, room } = data;

    if (!auth_token) {
      return;
    }

    const username = jwt.verify(auth_token, secretKey).username;
    const user = userJoin(socket.id, username, room);

    socket.join(user.room);

    switch (getRoomUsers(user.room).length) {
      case 1:
        socket.emit(
          "connectionMessage",
          "You created game, waiting for your friend"
        );
        break;
      case 2:
        socket
          .to(user.room)
          .emit(
            "connectionMessage",
            `${user.username} has joined, game started`
          );
        socket.to(user.room).emit("turnMessage", true);

        socket.emit("connectionMessage", "Game started");
        socket.emit("turnMessage", false);
        break;
      default:
        console.log(users);
        console.log("Reject another user from entering game");
    }
  });

  socket.on("chatMessage", (data) => {
    const user = getCurrentUser(socket.id);
    io.to(user.room).emit("chatMessage", `${user.username}: ${data}`);
  });

  socket.on("disconnect", () => {
    const user = userLeave(socket.id);

    if (user) {
      io.to(user.room).emit(
        "disconnectionMessage",
        `${user.username} has left the game, you won!`
      );
      console.log(`${user.username} has left the game`);
    }
  });

  socket.on("gameMove", (data) => {
    const user = getCurrentUser(socket.id);
    if (user) {
      socket.to(user.room).emit("gameMove", data);
    }
  });
});
