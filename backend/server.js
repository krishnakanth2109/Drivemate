import http from 'http';
import express from 'express';
import { Server as SocketIOServer } from 'socket.io';
import cors from 'cors';
import morgan from 'morgan';
import dotenv from 'dotenv';

import { auth } from './config/firebase.js';
import { connectMongoDB, mongoose } from './config/mongodb.js';
import { initRedis } from './config/redis.js';
import { asyncStorage } from './utils/asyncStorage.js';
import { Message } from './models/Message.js';

import authRoutes from './routes/authRoutes.js';
import postRoutes from './routes/postRoutes.js';
import vehicleRoutes from './routes/vehicleRoutes.js';
import billingRoutes from './routes/billingRoutes.js';
import messageRoutes from './routes/messageRoutes.js';
import analyticsRoutes from './routes/analyticsRoutes.js';

dotenv.config();

const app = express();
const httpServer = http.createServer(app);
const PORT = process.env.PORT || 5000;

// Setup Socket.io
const io = new SocketIOServer(httpServer, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST'],
  },
});

app.set('io', io);

// Middleware
app.use(morgan('dev'));
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'x-auth-token'],
}));
app.use(express.json());

// Initialize backend services
await asyncStorage.init();
await connectMongoDB();
initRedis();

// Socket.io Realtime Messaging Handlers
io.on('connection', (socket) => {
  console.log(`🔌 [Socket.io] Driver client connected: ${socket.id}`);

  // Join chat room
  socket.on('join_room', (roomId) => {
    socket.join(roomId || 'drivemate-hq');
    console.log(`💬 [Socket.io] Client ${socket.id} joined room: ${roomId || 'drivemate-hq'}`);
  });

  // Handle incoming realtime message
  socket.on('send_message', async (data) => {
    try {
      const { text, senderName, senderTag, senderId, roomId = 'drivemate-hq' } = data;
      if (!text || !text.trim()) return;

      const created = await Message.create({
        id: `msg_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
        senderId: senderId || socket.id,
        senderName: senderName || 'Driver',
        senderTag: senderTag || '@driver',
        roomId,
        text: text.trim(),
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        status: 'delivered',
      });

      // Broadcast to room
      io.to(roomId).emit('new_message', created);
    } catch (err) {
      console.error('[Socket.io] Message error:', err.message);
    }
  });

  // Realtime typing indicator
  socket.on('typing', (data) => {
    socket.to(data.roomId || 'drivemate-hq').emit('user_typing', data);
  });

  socket.on('disconnect', () => {
    console.log(`🔌 [Socket.io] Driver disconnected: ${socket.id}`);
  });
});

// Health Check
app.get('/api/health', (req, res) => {
  res.status(200).json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    firebaseProject: process.env.FIREBASE_PROJECT_ID || 'drivemate-39edf',
    firebaseAuthReady: !!auth,
    mongodbConnected: mongoose.connection.readyState === 1,
    mongodbDatabase: mongoose.connection.name || 'drivemate',
    redisActive: true,
    socketIOReady: true,
    backendStorage: 'AsyncStorage Active',
  });
});

// Mount REST Routes
app.use('/api/auth', authRoutes);
app.use('/api/posts', postRoutes);
app.use('/api/vehicles', vehicleRoutes);
app.use('/api/billing', billingRoutes);
app.use('/api/messages', messageRoutes);
app.use('/api/analytics', analyticsRoutes);

// Root Welcome Endpoint
app.get('/', (req, res) => {
  res.json({
    name: 'Drivemate Realtime Telematics & Community API',
    version: '1.2.0',
    features: [
      'Firebase Auth (from .env)',
      'MongoDB Atlas Persistence',
      'Redis Race-Condition Lock',
      'Socket.io Live Driver Comms',
      'Ride-Share Route & City Postings',
      'Firebase Analytics Tracking',
    ],
    endpoints: {
      auth: '/api/auth',
      posts: '/api/posts',
      vehicles: '/api/vehicles',
      billing: '/api/billing',
      messages: '/api/messages',
      analytics: '/api/analytics',
      health: '/api/health',
    },
  });
});

// 404 Handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: `Route ${req.method} ${req.originalUrl} not found.`,
  });
});

// Global Error Handler
app.use((err, req, res, next) => {
  console.error('[Unhandled Server Error]', err);
  res.status(500).json({
    success: false,
    error: err.message || 'Internal server error',
  });
});

httpServer.listen(PORT, '0.0.0.0', () => {
  console.log(`\n=================================================`);
  console.log(`🚀 DRIVEMATE SERVER RUNNING ON PORT ${PORT}`);
  console.log(`🔥 Firebase Project: ${process.env.FIREBASE_PROJECT_ID || 'drivemate-39edf'}`);
  console.log(`🍃 MongoDB Atlas: ${mongoose.connection.name || 'drivemate'}`);
  console.log(`⚡ Redis Quota Lock & Concurrency: Active`);
  console.log(`🔌 Socket.io Realtime Messaging: Ready`);
  console.log(`📡 Local: http://localhost:${PORT}`);
  console.log(`📱 Android Emulator: http://10.0.2.2:${PORT}`);
  console.log(`=================================================\n`);
});

export default app;
