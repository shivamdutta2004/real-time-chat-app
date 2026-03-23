const express = require("express");
const http = require("http");
const mongoose = require("mongoose");
const cors = require("cors");
const { Server } = require("socket.io");
require("dotenv").config();

// Model
const Message = require("./models/Message");

const app = express();
app.use(cors());
app.use(express.json());

const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: "*"
  }
});

// ================= ONLINE USERS =================
let users = {};

// ================= DATABASE =================
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log("MongoDB Connected ✅"))
  .catch(err => console.log("MongoDB Error:", err));

// ================= SOCKET =================
io.on("connection", (socket) => {
  console.log("User connected:", socket.id);

  // ================= REGISTER USER =================
  socket.on("registerUser", (username) => {
    users[socket.id] = username;

    console.log("Online Users:", users);

    // Send updated list to all
    io.emit("onlineUsers", Object.values(users));
  });

  // ================= GROUP CHAT =================
  socket.on("joinRoom", async (room) => {
    socket.join(room);
    console.log(`Joined group room: ${room}`);

    try {
      const messages = await Message.find({ room }).sort({ time: 1 });
      socket.emit("chatHistory", messages);
    } catch (err) {
      console.log("Error fetching group messages:", err);
    }
  });

  // ================= PRIVATE CHAT =================
  socket.on("joinPrivateChat", async ({ user1, user2 }) => {
    const privateRoom = [user1, user2].sort().join("_");

    socket.join(privateRoom);
    console.log(`Joined private room: ${privateRoom}`);

    try {
      const messages = await Message.find({ room: privateRoom }).sort({ time: 1 });
      socket.emit("chatHistory", messages);
    } catch (err) {
      console.log("Error fetching private messages:", err);
    }
  });

  // ================= SEND MESSAGE =================
  socket.on("sendMessage", async (data) => {
    try {
      console.log("Message:", data);

      const newMessage = new Message({
        username: data.username,
        message: data.message,
        room: data.room,
        time: data.time
      });

      await newMessage.save();

      io.to(data.room).emit("receiveMessage", data);

    } catch (err) {
      console.log("Error saving message:", err);
    }
  });

  // ================= DISCONNECT =================
  socket.on("disconnect", () => {
    console.log("User disconnected:", socket.id);

    delete users[socket.id];

    // Update all clients
    io.emit("onlineUsers", Object.values(users));
  });
});

// ================= ROUTE =================
app.get("/", (req, res) => {
  res.send("Chat Server Running 🚀");
});

// ================= START =================
const PORT = 5000;

server.listen(PORT, () => {
  console.log(`Server running on port ${PORT} 🚀`);
});