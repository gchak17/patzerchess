if (!localStorage.getItem("token")) {
  location.href = "/";
}

const messageForm = document.getElementById("send-container");
const messageInput = document.getElementById("message-input");
const messageContainer = document.getElementById("messages-container");
const socket = io();

const appendMessage = (message) => {
  const messageElement = document.createElement("div");
  messageElement.innerText = message;
  messageContainer.append(messageElement);
};

socket.emit("joinGame", {
  auth_token: localStorage.getItem("token"),
  room: location.pathname,
});

socket.on("chatMessage", (message) => {
  appendMessage(message);
});

socket.on("connectionMessage", (message) => {
  appendMessage(message);
});

messageForm.addEventListener("submit", (e) => {
  e.preventDefault();
  socket.emit("chatMessage", messageInput.value);
  messageInput.value = "";
});
