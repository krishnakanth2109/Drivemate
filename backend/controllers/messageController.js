import { Message } from '../models/Message.js';

const INITIAL_MESSAGES = [
  {
    id: "m1",
    senderId: "system_dispatch",
    senderName: "Drivemate Dispatch",
    senderTag: "@dispatch_hq",
    roomId: "drivemate-hq",
    text: "Welcome to Drivemate Driver Comms! Share live road conditions, speed traps, and carpool coordinates here.",
    time: "10:00 AM",
    status: "delivered",
  },
  {
    id: "m2",
    senderId: "marcus_ev",
    senderName: "Marcus Vance",
    senderTag: "@marcus_v",
    roomId: "drivemate-hq",
    text: "Hey drivers, anyone heading out toward Tahoe today? Donner Pass has light flurries, tire chains recommended.",
    time: "10:15 AM",
    status: "read",
  },
  {
    id: "m3",
    senderId: "elena_r",
    senderName: "Elena Rostova",
    senderTag: "@elena_m3",
    roomId: "drivemate-hq",
    text: "Thanks Marcus! Just passed Rocklin Supercharger. Plenty of open stalls right now.",
    time: "10:22 AM",
    status: "read",
  },
];

export const getMessages = async (req, res) => {
  try {
    const roomId = req.query.roomId || 'drivemate-hq';
    let messages = await Message.find({ roomId }).sort({ createdAt: 1 }).lean();

    if (!messages || messages.length === 0) {
      await Message.insertMany(INITIAL_MESSAGES);
      messages = INITIAL_MESSAGES;
    }

    return res.status(200).json({ success: true, messages });
  } catch (error) {
    console.error('[MessageController.getMessages] Error:', error.message);
    return res.status(500).json({ success: false, error: 'Failed to fetch messages.' });
  }
};

export const sendMessage = async (req, res) => {
  try {
    const { text, roomId = 'drivemate-hq' } = req.body;
    const user = req.user;

    if (!text || !text.trim()) {
      return res.status(400).json({ success: false, error: 'Message cannot be empty.' });
    }

    const newMessage = await Message.create({
      id: `msg_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      senderId: user ? user.uid : 'anon',
      senderName: user ? user.fullName : 'Guest Driver',
      senderTag: user && user.username ? `@${user.username}` : '@driver',
      roomId,
      text: text.trim(),
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      status: 'sent',
    });

    // Broadcast if socket io is attached to app
    const io = req.app.get('io');
    if (io) {
      io.to(roomId).emit('new_message', newMessage);
    }

    return res.status(201).json({ success: true, message: newMessage });
  } catch (error) {
    return res.status(500).json({ success: false, error: 'Failed to send message.' });
  }
};

