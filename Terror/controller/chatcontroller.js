const User = require("../models/User");
const { v4: uuidv4 } = require("uuid");

// Get All Chats Controller (unchanged)
exports.getAllChats = async (req, res) => {
  try {
    const user = await User.findById(req.user.userId).select("chats");
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    res.status(200).json({
      message: "Chats retrieved successfully",
      chats: user.chats.map(chat => ({
        chatId: chat.chatId,
        chatName: chat.chatName,
        createdAt: chat.createdAt
      }))
    });
  } catch (error) {
    console.error("Get chats error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// Get Single Chat Controller (unchanged)
exports.getChat = async (req, res) => {
  try {
    const { chatId } = req.params;
    const user = await User.findById(req.user.userId);

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const chat = user.chats.find(c => c.chatId === chatId);
    if (!chat) {
      return res.status(404).json({ message: "Chat not found" });
    }

    res.status(200).json({
      message: "Chat retrieved successfully",
      chat: {
        chatId: chat.chatId,
        chatName: chat.chatName,
        history: chat.history,
        createdAt: chat.createdAt
      }
    });
  } catch (error) {
    console.error("Get chat error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// Save or Update Chat Controller
exports.saveChat = async (req, res) => {
  try {
    const { chatId, chatName, history } = req.body;
    const user = await User.findById(req.user.userId); // Use JWT userId

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Validate history format
    if (!Array.isArray(history) || history.some(h => !h.role || !h.content || !['user', 'bot'].includes(h.role))) {
      return res.status(400).json({ message: "Invalid history format" });
    }

    // Generate chatId if not provided
    const finalChatId = chatId || uuidv4();

    // Generate chatName if not provided (use first user question or timestamp)
    let finalChatName = chatName;
    if (!finalChatName) {
      const firstUserMessage = history.find(h => h.role === 'user')?.content;
      finalChatName = firstUserMessage ? firstUserMessage.substring(0, 50) : `Chat ${new Date().toISOString()}`;
    }

    // Check if chat exists
    const chatIndex = user.chats.findIndex(c => c.chatId === finalChatId);

    if (chatIndex >= 0) {
      // Update existing chat's history
      user.chats[chatIndex].history = history.map(h => ({
        role: h.role,
        content: h.content,
        timestamp: new Date()
      }));
      user.chats[chatIndex].chatName = finalChatName;
    } else {
      // Create new chat
      user.chats.push({
        chatId: finalChatId,
        chatName: finalChatName,
        history: history.map(h => ({
          role: h.role,
          content: h.content,
          timestamp: new Date()
        })),
        createdAt: new Date()
      });
    }

    await user.save();

    res.status(200).json({
      message: "Chat saved successfully",
      chatId: finalChatId
    });
  } catch (error) {
    console.error("Save chat error:", error);
    res.status(500).json({ message: "Server error" });
  }
};