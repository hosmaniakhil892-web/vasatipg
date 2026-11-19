const express = require("express");
const router = express.Router();
const Chat = require("../models/Chat");
const dbService = require("../services/dbService");

router.get("/conversations/:userEmail", async (req, res) => {
  const userEmail = req.params.userEmail;

  try {
    let messages = [];
    if (dbService.isMongoConnected()) {
      messages = await Chat.find({
        $or: [{ senderEmail: userEmail }, { receiverEmail: userEmail }],
      }).sort({ timestamp: -1 });
    } else {
      const allChats = dbService.readCollection("chats");
      messages = allChats
        .filter((c) => c.senderEmail === userEmail || c.receiverEmail === userEmail)
        .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
    }

    let uniqueConversations = new Map();
    messages.forEach((msg) => {
      const otherUser = msg.senderEmail === userEmail ? msg.receiverEmail : msg.senderEmail;
      if (!uniqueConversations.has(otherUser)) {
        uniqueConversations.set(otherUser, msg);
      }
    });

    const conversationsArray = Array.from(uniqueConversations.values());
    res.json(conversationsArray);
  } catch (error) {
    console.error("Error fetching conversations:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// Send a message
router.post("/send", async (req, res) => {
  const { roomId, senderEmail, receiverEmail, message } = req.body;

  try {
    const chatMessage = {
      _id: "chat_" + Date.now(),
      roomId,
      senderEmail,
      receiverEmail,
      message,
      timestamp: new Date().toISOString(),
    };

    if (dbService.isMongoConnected()) {
      const doc = new Chat(chatMessage);
      await doc.save();
    } else {
      const chats = dbService.readCollection("chats");
      chats.push(chatMessage);
      dbService.writeCollection("chats", chats);
    }

    res.status(201).json(chatMessage);
  } catch (error) {
    res.status(500).json({ message: "Error sending message", error });
  }
});

// Get all messages in a chat room
router.get("/:roomId", async (req, res) => {
  try {
    const { roomId } = req.params;
    let messages = [];
    if (dbService.isMongoConnected()) {
      messages = await Chat.find({ roomId }).sort({ timestamp: 1 });
    } else {
      const chats = dbService.readCollection("chats");
      messages = chats
        .filter((c) => c.roomId === roomId)
        .sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
    }
    res.json(messages);
  } catch (error) {
    console.error("Error fetching messages:", error);
    res.status(500).json({ message: "Error fetching messages", error });
  }
});

// Fetch all chats for a user
router.get("/user/:email", async (req, res) => {
  try {
    const userEmail = req.params.email;
    let chats = [];
    if (dbService.isMongoConnected()) {
      chats = await Chat.find({
        $or: [{ senderEmail: userEmail }, { receiverEmail: userEmail }],
      }).sort({ timestamp: -1 });
    } else {
      const allChats = dbService.readCollection("chats");
      chats = allChats
        .filter((c) => c.senderEmail === userEmail || c.receiverEmail === userEmail)
        .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
    }
    res.status(200).json(chats);
  } catch (error) {
    res.status(500).json({ message: "Error fetching chats", error });
  }
});

// Get chat messages between two users
router.get("/:senderEmail/:receiverEmail", async (req, res) => {
  try {
    const { senderEmail, receiverEmail } = req.params;
    let messages = [];
    if (dbService.isMongoConnected()) {
      messages = await Chat.find({
        $or: [
          { senderEmail, receiverEmail },
          { senderEmail: receiverEmail, receiverEmail: senderEmail },
        ],
      }).sort({ timestamp: 1 });
    } else {
      const allChats = dbService.readCollection("chats");
      messages = allChats
        .filter(
          (c) =>
            (c.senderEmail === senderEmail && c.receiverEmail === receiverEmail) ||
            (c.senderEmail === receiverEmail && c.receiverEmail === senderEmail)
        )
        .sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
    }
    res.status(200).json(messages);
  } catch (error) {
    res.status(500).json({ message: "Error fetching messages", error });
  }
});

module.exports = router;
