import { Message } from '../models/Message.js';
import { Connection } from '../models/Connection.js';
import { User } from '../models/User.js';

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

const DEFAULT_DRIVERS = [
  {
    uid: "driver_elena",
    fullName: "Elena Rostova",
    username: "elena_m3",
    email: "elena@drivemate.com",
    location: "Seattle, WA",
    drivingStyle: "Commute",
    vehicleName: "2023 Tesla Model 3",
  },
  {
    uid: "driver_marcus",
    fullName: "Marcus Vance",
    username: "marcus_v",
    email: "marcus@drivemate.com",
    location: "San Francisco, CA",
    drivingStyle: "Road Trip",
    vehicleName: "2024 Rivian R1T",
  },
  {
    uid: "driver_devon",
    fullName: "Devon Clark",
    username: "devon_c",
    email: "devon@drivemate.com",
    location: "Austin, TX",
    drivingStyle: "AWD Explorer",
    vehicleName: "2022 Subaru Outback",
  },
  {
    uid: "driver_sarah",
    fullName: "Sarah Jenkins",
    username: "sarah_j",
    email: "sarah@drivemate.com",
    location: "Denver, CO",
    drivingStyle: "Mountain Drive",
    vehicleName: "2024 Ford F-150 Lightning",
  },
];

/**
 * List discoverable driver profiles to send connection / message requests to
 */
export const getDrivers = async (req, res) => {
  try {
    const currentUserId = req.user ? req.user.uid : null;
    let drivers = [];

    // Query real users from database
    const dbUsers = await User.find(
      currentUserId ? { uid: { $ne: currentUserId } } : {},
      'uid fullName username email location drivingStyle vehicles'
    ).limit(30).lean();

    if (dbUsers && dbUsers.length > 0) {
      drivers = dbUsers.map(u => ({
        uid: u.uid,
        fullName: u.fullName,
        username: u.username || u.email?.split('@')[0] || 'driver',
        email: u.email,
        location: u.location || 'United States',
        drivingStyle: u.drivingStyle || 'Commute',
        vehicleName: u.vehicles && u.vehicles[0] ? u.vehicles[0].name : 'Primary Vehicle',
      }));
    }

    // Merge default discoverable drivers if database has few records
    for (const d of DEFAULT_DRIVERS) {
      if (d.uid !== currentUserId && !drivers.some(item => item.uid === d.uid || item.email === d.email)) {
        drivers.push(d);
      }
    }

    // Annotate connection statuses for current user
    let userConnections = [];
    if (currentUserId) {
      userConnections = await Connection.find({
        $or: [{ fromUserId: currentUserId }, { toUserId: currentUserId }]
      }).lean();
    }

    const annotated = drivers.map(d => {
      const match = userConnections.find(
        c => (c.fromUserId === d.uid && c.toUserId === currentUserId) ||
             (c.toUserId === d.uid && c.fromUserId === currentUserId)
      );

      return {
        ...d,
        connectionStatus: match ? match.status : 'none',
        connectionRequestId: match ? match.id : null,
        isSender: match ? match.fromUserId === currentUserId : false,
      };
    });

    return res.status(200).json({ success: true, drivers: annotated });
  } catch (error) {
    console.error('[getDrivers Error]:', error.message);
    return res.status(500).json({ success: false, error: 'Failed to retrieve driver profiles.' });
  }
};

/**
 * Get all connection requests (incoming pending to accept/decline + outgoing sent)
 */
export const getRequests = async (req, res) => {
  try {
    const currentUserId = req.user.uid;

    const incoming = await Connection.find({
      toUserId: currentUserId,
      status: 'pending',
    }).sort({ createdAt: -1 }).lean();

    const outgoing = await Connection.find({
      fromUserId: currentUserId,
      status: 'pending',
    }).sort({ createdAt: -1 }).lean();

    return res.status(200).json({
      success: true,
      incoming: incoming || [],
      outgoing: outgoing || [],
    });
  } catch (error) {
    console.error('[getRequests Error]:', error.message);
    return res.status(500).json({ success: false, error: 'Failed to fetch connection requests.' });
  }
};

/**
 * Send a message/connection request to another driver profile
 */
export const sendRequest = async (req, res) => {
  try {
    const fromUser = req.user;
    const { targetUserId } = req.body;

    if (!targetUserId || targetUserId === fromUser.uid) {
      return res.status(400).json({ success: false, error: 'Invalid target user ID.' });
    }

    // Resolve target driver name
    let targetDriver = await User.findOne({ uid: targetUserId }).lean();
    if (!targetDriver) {
      targetDriver = DEFAULT_DRIVERS.find(d => d.uid === targetUserId);
    }
    const targetName = targetDriver ? targetDriver.fullName : 'Driver';
    const targetTag = targetDriver && targetDriver.username ? `@${targetDriver.username}` : '@driver';

    // Check if an existing request / connection is already present
    const existing = await Connection.findOne({
      $or: [
        { fromUserId: fromUser.uid, toUserId: targetUserId },
        { fromUserId: targetUserId, toUserId: fromUser.uid },
      ]
    });

    if (existing) {
      if (existing.status === 'accepted') {
        return res.status(200).json({
          success: true,
          message: 'Already connected!',
          connection: existing,
        });
      }
      if (existing.status === 'pending') {
        return res.status(200).json({
          success: true,
          message: 'Request already pending.',
          connection: existing,
        });
      }
    }

    const roomId = ['dm', fromUser.uid, targetUserId].sort().join('_');
    const newRequest = await Connection.create({
      id: `req_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      fromUserId: fromUser.uid,
      fromUserName: fromUser.fullName || 'Drivemate Driver',
      fromUserTag: fromUser.username ? `@${fromUser.username}` : '@driver',
      toUserId: targetUserId,
      toUserName: targetName,
      toUserTag: targetTag,
      status: 'pending',
      roomId,
    });

    // Real-time broadcast if socket io is active
    const io = req.app.get('io');
    if (io) {
      io.emit(`request_${targetUserId}`, newRequest);
    }

    return res.status(201).json({
      success: true,
      message: `Connection request dispatched to ${targetName}.`,
      connection: newRequest,
    });
  } catch (error) {
    console.error('[sendRequest Error]:', error.message);
    return res.status(500).json({ success: false, error: 'Failed to send connection request.' });
  }
};

/**
 * Accept or decline an incoming connection request
 */
export const respondRequest = async (req, res) => {
  try {
    const { requestId, action } = req.body;
    const currentUserId = req.user.uid;

    if (!requestId || !['accept', 'decline'].includes(action)) {
      return res.status(400).json({ success: false, error: 'Invalid request ID or action.' });
    }

    const connection = await Connection.findOne({
      id: requestId,
      toUserId: currentUserId,
    });

    if (!connection) {
      return res.status(404).json({ success: false, error: 'Connection request not found.' });
    }

    connection.status = action === 'accept' ? 'accepted' : 'declined';
    await connection.save();

    // If accepted, seed a greeting message in the private room
    if (action === 'accept') {
      await Message.create({
        id: `msg_seed_${Date.now()}`,
        senderId: 'system_dispatch',
        senderName: 'Drivemate',
        senderTag: '@drivemate',
        roomId: connection.roomId,
        text: `You and ${connection.fromUserName} are now connected! Start sharing road trips and vehicle tips.`,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        status: 'delivered',
      });
    }

    const io = req.app.get('io');
    if (io) {
      io.emit(`connection_status_${connection.fromUserId}`, connection);
      io.emit(`connection_status_${connection.toUserId}`, connection);
    }

    return res.status(200).json({
      success: true,
      action,
      connection,
      message: action === 'accept' ? 'Connection request accepted! You can now chat.' : 'Connection request declined.',
    });
  } catch (error) {
    console.error('[respondRequest Error]:', error.message);
    return res.status(500).json({ success: false, error: 'Failed to respond to request.' });
  }
};

/**
 * Get all active private conversations (accepted connections) + community channel
 */
export const getConversations = async (req, res) => {
  try {
    const currentUserId = req.user.uid;

    const acceptedConnections = await Connection.find({
      status: 'accepted',
      $or: [{ fromUserId: currentUserId }, { toUserId: currentUserId }],
    }).sort({ updatedAt: -1 }).lean();

    const conversations = [];

    // Always include Community Driver Comms
    const latestCommunityMsg = await Message.findOne({ roomId: 'drivemate-hq' }).sort({ createdAt: -1 }).lean();
    conversations.push({
      id: 'drivemate-hq',
      roomId: 'drivemate-hq',
      isGroup: true,
      name: 'Driver Comms HQ',
      tag: '@community',
      lastMessage: latestCommunityMsg ? latestCommunityMsg.text : 'Welcome to Driver Comms!',
      lastTime: latestCommunityMsg ? latestCommunityMsg.time : 'Active',
      unreadCount: 0,
    });

    // Populate direct conversations
    for (const c of acceptedConnections) {
      const isFromMe = c.fromUserId === currentUserId;
      const partnerId = isFromMe ? c.toUserId : c.fromUserId;
      const partnerName = isFromMe ? c.toUserName : c.fromUserName;
      const partnerTag = isFromMe ? c.toUserTag : c.fromUserTag;

      const latestMsg = await Message.findOne({ roomId: c.roomId }).sort({ createdAt: -1 }).lean();

      conversations.push({
        id: c.id,
        roomId: c.roomId,
        partnerId,
        name: partnerName,
        tag: partnerTag,
        isGroup: false,
        lastMessage: latestMsg ? latestMsg.text : 'Connected! Tap to send a message.',
        lastTime: latestMsg ? latestMsg.time : 'Just now',
        unreadCount: 0,
      });
    }

    return res.status(200).json({ success: true, conversations });
  } catch (error) {
    console.error('[getConversations Error]:', error.message);
    return res.status(500).json({ success: false, error: 'Failed to fetch conversations.' });
  }
};

/**
 * Fetch all messages for a specific room (group or direct)
 */
export const getMessages = async (req, res) => {
  try {
    const roomId = req.query.roomId || 'drivemate-hq';
    let messages = await Message.find({ roomId }).sort({ createdAt: 1 }).lean();

    if ((!messages || messages.length === 0) && roomId === 'drivemate-hq') {
      await Message.insertMany(INITIAL_MESSAGES);
      messages = INITIAL_MESSAGES;
    }

    return res.status(200).json({ success: true, messages: messages || [] });
  } catch (error) {
    console.error('[MessageController.getMessages] Error:', error.message);
    return res.status(500).json({ success: false, error: 'Failed to fetch messages.' });
  }
};

/**
 * Send message to a room (group or direct)
 */
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

    // Update connection timestamp so conversation sorts to top
    if (roomId.startsWith('dm_')) {
      await Connection.findOneAndUpdate({ roomId }, { $set: { updatedAt: new Date() } });
    }

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
