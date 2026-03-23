// ================= SOCKET CONNECTION =================
const socket = io("http://localhost:5000");

// ================= USER DATA =================
const username = localStorage.getItem("username");
const room = localStorage.getItem("room");

// ================= UI SETUP =================
document.getElementById("username-display").innerText = username;
document.getElementById("room-display").innerText = room;
document.getElementById("chat-room-title").innerText = room;

// ================= JOIN ROOM =================
socket.emit("joinRoom", room);

// ================= SEND MESSAGE =================
function sendMessage() {
  const input = document.getElementById("message");
  const message = input.value.trim();

  if (message === "") return;

  const data = {
    username,
    message,
    room,
    time: new Date().toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit"
    })
  };

  socket.emit("sendMessage", data);
  input.value = "";
}

// Send message on Enter key
document.getElementById("message").addEventListener("keypress", function (e) {
  if (e.key === "Enter") {
    sendMessage();
  }
});

// ================= RECEIVE MESSAGE =================
socket.on("receiveMessage", (data) => {
  displayMessage(data);
});

// ================= LOAD CHAT HISTORY =================
socket.on("chatHistory", (messages) => {
  const chatBox = document.getElementById("chat-box");
  chatBox.innerHTML = ""; // clear old

  messages.forEach(msg => {
    displayMessage(msg);
  });
});

// ================= DISPLAY MESSAGE =================
function displayMessage(data) {
  const chatBox = document.getElementById("chat-box");

  const messageDiv = document.createElement("div");
  messageDiv.classList.add("message");

  // Align messages
  if (data.username === username) {
    messageDiv.classList.add("sent");
  } else {
    messageDiv.classList.add("received");
  }

  messageDiv.innerHTML = `
    <strong>${data.username}</strong>
    <div>${data.message}</div>
    <span class="time">${data.time}</span>
  `;

  chatBox.appendChild(messageDiv);

  // Auto scroll
  chatBox.scrollTop = chatBox.scrollHeight;
}