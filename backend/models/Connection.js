import mongoose from 'mongoose';

const connectionSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true, index: true },
  fromUserId: { type: String, required: true, index: true },
  fromUserName: { type: String, required: true },
  fromUserTag: { type: String, default: '@driver' },
  toUserId: { type: String, required: true, index: true },
  toUserName: { type: String, required: true },
  toUserTag: { type: String, default: '@driver' },
  status: { type: String, enum: ['pending', 'accepted', 'declined'], default: 'pending', index: true },
  roomId: { type: String, required: true, index: true },
}, {
  timestamps: true,
});

export const Connection = mongoose.models.Connection || mongoose.model('Connection', connectionSchema);
export default Connection;
