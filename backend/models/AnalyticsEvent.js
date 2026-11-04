import mongoose from 'mongoose';

const analyticsEventSchema = new mongoose.Schema({
  eventName: { type: String, required: true, index: true },
  userId: { type: String, index: true },
  params: { type: mongoose.Schema.Types.Mixed, default: {} },
  platform: { type: String, default: 'mobile' },
  ip: { type: String },
  timestamp: { type: Date, default: Date.now },
}, {
  timestamps: true,
});

export const AnalyticsEvent = mongoose.models.AnalyticsEvent || mongoose.model('AnalyticsEvent', analyticsEventSchema);
export default AnalyticsEvent;

