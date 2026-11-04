import mongoose from 'mongoose';

const postSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true, index: true },
  userId: { type: String, index: true },
  author: { type: String, required: true },
  authorTag: { type: String, default: '@driver' },
  content: { type: String, required: true },
  fromCity: { type: String, default: '' },
  toCity: { type: String, default: '' },
  departureTime: { type: String, default: '' },
  availableSeats: { type: Number, default: 0 },
  pricePerSeat: { type: String, default: '' },
  link: { type: String },
  linkTitle: { type: String },
  tag: { type: String, default: '#General' },
  timeAgo: { type: String, default: 'Just now' },
  likes: { type: Number, default: 0 },
  commentsCount: { type: Number, default: 0 },
  likedBy: { type: [String], default: [] },
}, {
  timestamps: true,
});

export const Post = mongoose.models.Post || mongoose.model('Post', postSchema);
export default Post;
