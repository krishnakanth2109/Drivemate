import mongoose from 'mongoose';

const messageSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true, index: true },
  senderId: { type: String, required: true, index: true },
  senderName: { type: String, required: true },
  senderTag: { type: String, default: '@driver' },
  recipientId: { type: String, default: 'community' },
  roomId: { type: String, default: 'drivemate-hq', index: true },
  text: { type: String, default: '' },
  msgType: {
    type: String,
    enum: ['text', 'photo', 'location', 'voice', 'pdf'],
    default: 'text',
    index: true,
  },
  mediaUrl: { type: String, default: '' },
  locationData: {
    latitude: { type: Number },
    longitude: { type: Number },
    address: { type: String, default: '' },
  },
  fileMeta: {
    fileName: { type: String, default: '' },
    fileSize: { type: String, default: '' },
    mimeType: { type: String, default: '' },
    duration: { type: String, default: '' },
  },
  time: { type: String, default: 'Just now' },
  status: { type: String, default: 'sent' }, // sent, delivered, read
}, {
  timestamps: true,
});

export const Message = mongoose.models.Message || mongoose.model('Message', messageSchema);
export default Message;
