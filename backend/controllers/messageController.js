import { Message } from '../models/Message.js';
import { Connection } from '../models/Connection.js';
import { User } from '../models/User.js';
import emailService from '../services/emailService.js';

const INITIAL_MESSAGES = [
  {
    id: "m1",
    senderId: "system_dispatch",
    senderName: "Drivemate Dispatch",
    senderTag: "@dispatch_hq",
    roomId: "drivemate-hq",
    text: "Welcome to Drivemate Driver Comms! Share live road updates, locations, and travel tips with fellow drivers.",
    msgType: "text",
    time: "10:00 AM",
    status: "delivered",
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
      'uid fullName username email location drivingStyle vehicles profilePicture photoUrl'
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
        profilePicture: u.profilePicture || u.photoUrl || null,
        photoUrl: u.profilePicture || u.photoUrl || null,
      }));
    }

    // Only return registered drivers from the database

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
    const { targetUserId, targetName: bodyName, targetTag: bodyTag } = req.body;

    if (!targetUserId || targetUserId === fromUser.uid) {
      return res.status(400).json({ success: false, error: 'Invalid target user ID.' });
    }

    // Resolve target driver name
    let targetDriver = await User.findOne({ uid: targetUserId }).lean();
    if (!targetDriver) {
      targetDriver = DEFAULT_DRIVERS.find(d => d.uid === targetUserId);
    }
    const targetName = targetDriver ? targetDriver.fullName : (bodyName || 'Driver');
    const targetTag = targetDriver && targetDriver.username ? `@${targetDriver.username}` : (bodyTag || '@driver');

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

    // Send email notification to recipient
    try {
      const recipient = await User.findOne({ uid: targetUserId }).lean();
      if (recipient && recipient.email) {
        emailService.sendConnectionInviteEmail({
          toEmail: recipient.email,
          recipientName: recipient.fullName || targetName,
          senderName: fromUser.fullName || 'A Driver',
          senderTag: fromUser.username ? `@${fromUser.username}` : '@driver',
        }).catch((err) => console.warn('Email dispatch warning:', err.message));
      }
    } catch (e) {
      console.warn('Failed to find recipient for invite email:', e.message);
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

    // If accepted, seed a greeting message in the private room and send email notification
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

      try {
        const sender = await User.findOne({ uid: connection.fromUserId }).lean();
        if (sender && sender.email) {
          emailService.sendConnectionAcceptedEmail({
            toEmail: sender.email,
            senderName: sender.fullName || connection.fromUserName,
            acceptorName: connection.toUserName,
            acceptorTag: connection.toUserTag,
          }).catch((err) => console.warn('Accept email warning:', err.message));
        }
      } catch (e) {
        console.warn('Failed to find sender for accept email:', e.message);
      }
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

      const [latestMsg, partnerUser] = await Promise.all([
        Message.findOne({ roomId: c.roomId }).sort({ createdAt: -1 }).lean(),
        User.findOne({ uid: partnerId }, 'profilePicture photoUrl').lean(),
      ]);

      conversations.push({
        id: c.id,
        roomId: c.roomId,
        partnerId,
        name: partnerName,
        tag: partnerTag,
        avatar: partnerUser?.profilePicture || partnerUser?.photoUrl || null,
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
 * Send message to a room (group or direct) - supports text, photos, location, voice memos, PDFs
 */
export const sendMessage = async (req, res) => {
  try {
    const {
      text = '',
      roomId = 'drivemate-hq',
      msgType = 'text',
      mediaUrl = '',
      locationData,
      fileMeta,
    } = req.body;
    const user = req.user;

    const trimmedText = text.trim();
    if (!trimmedText && !mediaUrl && !locationData) {
      return res.status(400).json({ success: false, error: 'Message content or media attachment is required.' });
    }

    // Default friendly label if message is media-only
    let displayText = trimmedText;
    if (!displayText) {
      if (msgType === 'photo') displayText = '📷 Shared a photo';
      else if (msgType === 'voice') displayText = '🎙️ Voice note';
      else if (msgType === 'pdf') displayText = `📄 Document: ${fileMeta?.fileName || 'PDF'}`;
      else if (msgType === 'location') displayText = `📍 Location: ${locationData?.address || 'Pinned location'}`;
    }

    const newMessage = await Message.create({
      id: `msg_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      senderId: user ? user.uid : 'anon',
      senderName: user ? user.fullName : 'Guest Driver',
      senderTag: user && user.username ? `@${user.username}` : '@driver',
      roomId,
      text: displayText,
      msgType,
      mediaUrl,
      locationData: locationData || undefined,
      fileMeta: fileMeta || undefined,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      status: 'sent',
    });

    // Update connection timestamp so conversation sorts to top
    if (roomId.startsWith('dm_') || roomId.includes('_dm_')) {
      await Connection.findOneAndUpdate({ roomId }, { $set: { updatedAt: new Date() } });
    }

    // Broadcast if socket io is attached to app
    const io = req.app.get('io');
    if (io) {
      io.to(roomId).emit('new_message', newMessage);
    }

    return res.status(201).json({ success: true, message: newMessage });
  } catch (error) {
    console.error('[sendMessage Error]:', error.message);
    return res.status(500).json({ success: false, error: 'Failed to send message.' });
  }
};
