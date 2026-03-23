const mongoose = require("mongoose");

const messageSchema = new mongoose.Schema({
  username: String,
  message: String,
  room: String,
  time: String
});

module.exports = mongoose.model("Message", messageSchema);