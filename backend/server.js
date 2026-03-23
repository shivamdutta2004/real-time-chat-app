const express = require("express");
const http = require("http");
const mongoose = require("mongoose");
const cors = require("cors");
const { Server } = require("socket.io");
require("dotenv").config();

// Models
const Message = require("./models/Message");

const app = express();
app.use(cors());
app.use(express.json());

// Create server
const server = http.createServer(app);

// Socket setup
const io = new Server(server, {
  cors: {
    origin: "*"
  }
});

// MongoDB connection
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log("MongoDB Connected ✅"))
  .catch(err => console.log("MongoDB Error:", err));

// ================= SOCKET LOGIC =================
io.on("connection", (socket) => {
  console.log("User connected:", socket.id);

  // Join Room
  socket.on("joinRoom", async (room) => {
    socket.join(room);
    console.log(`User joined room: ${room}`);

    // Send previous messages (chat history)
    const messages = await Message.find({ room }).sort({ time: 1 });

    socket.emit("chatHistory", messages);
  });

  // Send Message
  socket.on("sendMessage", async (data) => {
    try {
      console.log("Message received:", data);

      // Save to DB
      const newMessage = new Message({
        username: data.username,
        message: data.message,
        room: data.room,
        time: data.time
      });

      await newMessage.save();

      // Send to room
      io.to(data.room).emit("receiveMessage", data);

    } catch (error) {
      console.log("Error saving message:", error);
    }
  });

  // Disconnect
  socket.on("disconnect", () => {
    console.log("User disconnected:", socket.id);
  });
});

// ================= BASIC ROUTE =================
app.get("/", (req, res) => {
  res.send("Chat Server Running 🚀");
});

// ================= SERVER START =================
const PORT = 5000;

server.listen(PORT, () => {
  console.log(`Server running on port ${PORT} 🚀`);
});