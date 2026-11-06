import mongoose from 'mongoose';

const postSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true, index: true },
  userId: { type: String, index: true },
  author: { type: String, required: true },
  authorTag: { type: String, default: '@driver' },
  authorAvatar: { type: String, default: '' },
  content: { type: String, required: true },
  fromCity: { type: String, default: '' },
  toCity: { type: String, default: '' },
  departureTime: { type: String, default: '' },
  availableSeats: { type: Number, default: 0 },
  pricePerSeat: { type: String, default: '' },
  link: { type: String },
  linkTitle: { type: String },
  tag: { type: String, default: '#General' },
  photos: { type: [String], default: [] },
  timeAgo: { type: String, default: 'Just now' },
  likes: { type: Number, default: 0 },
  commentsCount: { type: Number, default: 0 },
  likedBy: { type: [String], default: [] },
}, {
  timestamps: true,
});

export const Post = mongoose.models.Post || mongoose.model('Post', postSchema);
export default Post;
