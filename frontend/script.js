// ================= SOCKET CONNECTION =================
const socket = io("http://localhost:5000");

// ================= GET USER DATA FROM URL =================
const params = new URLSearchParams(window.location.search);

const username = params.get("username");
const room = params.get("room");

// ================= SAFETY CHECK =================
if (!username || !room) {
  alert("Invalid access. Please join again.");
  window.location.href = "index.html";
}

// ================= CURRENT ROOM =================
let currentRoom = room;

// ================= UI SETUP =================
document.getElementById("username-display").innerText = username;
document.getElementById("room-display").innerText = room;
document.getElementById("chat-room-title").innerText = room;

// ================= REGISTER USER (ONLINE USERS) =================
socket.emit("registerUser", username);

// ================= JOIN GROUP ROOM =================
socket.emit("joinRoom", room);

// ================= SEND MESSAGE =================
function sendMessage() {
  const input = document.getElementById("message");
  const message = input.value.trim();

  if (message === "") return;

  const data = {
    username,
    message,
    room: currentRoom,
    time: new Date().toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit"
    })
  };

  socket.emit("sendMessage", data);
  input.value = "";
}

// ================= ENTER KEY SUPPORT =================
document.getElementById("message").addEventListener("keypress", (e) => {
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
  chatBox.innerHTML = "";

  messages.forEach(msg => displayMessage(msg));
});

// ================= DISPLAY MESSAGE =================
function displayMessage(data) {
  const chatBox = document.getElementById("chat-box");

  const messageDiv = document.createElement("div");
  messageDiv.classList.add("message");

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
  chatBox.scrollTop = chatBox.scrollHeight;
}

// ================= PRIVATE CHAT =================
function startPrivateChat() {
  const otherUser = document.getElementById("privateUser").value.trim();

  if (!otherUser) {
    alert("Enter username for private chat");
    return;
  }

  const privateRoom = [username, otherUser].sort().join("_");

  // Clear chat
  document.getElementById("chat-box").innerHTML = "";

  // Update UI
  document.getElementById("chat-room-title").innerText = `Private: ${otherUser}`;

  // Join private room
  socket.emit("joinPrivateChat", {
    user1: username,
    user2: otherUser
  });

  // Switch room
  currentRoom = privateRoom;
}

// ================= ONLINE USERS =================
socket.on("onlineUsers", (users) => {
  const list = document.getElementById("online-users");

  if (!list) return;

  list.innerHTML = "";

  users.forEach(user => {
    const li = document.createElement("li");
    li.innerText = user;
    list.appendChild(li);
  });
});