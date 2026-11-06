import mongoose from 'mongoose';

const vehicleSchema = new mongoose.Schema({
  id: { type: String, required: true },
  name: { type: String, required: true },
  year: { type: String, default: '2024' },
  type: { type: String, default: 'EV' },
  plate: { type: String, default: '' },
  vin: { type: String, default: '' },
  odometer: { type: String, default: '0 mi' },
  batteryOrFuel: { type: String, default: '100% Battery' },
  isPrimary: { type: Boolean, default: false },
  serviceDue: { type: String, default: 'Inspection in 10,000 mi' },
}, { _id: false });

const userSchema = new mongoose.Schema({
  uid: { type: String, required: true, unique: true, index: true },
  fullName: { type: String, required: true },
  email: { type: String, required: true, unique: true, lowercase: true, index: true },
  phoneNumber: { type: String, default: '' },
  username: { type: String, default: '' },
  profilePicture: { type: String, default: '' },
  photoUrl: { type: String, default: '' },
  bio: { type: String, default: '' },
  location: { type: String, default: 'San Francisco, CA' },
  drivingStyle: { type: String, default: 'commute' },
  passwordHash: { type: String, default: '' },
  activeToken: { type: String, index: true },
  isProUser: { type: Boolean, default: false },
  freePostsUsed: { type: Number, default: 0 },
  maxFreePosts: { type: Number, default: 2 },
  singlePasses: { type: Number, default: 0 },
  vehicles: [vehicleSchema],
  planUpgradedAt: { type: Date },
}, {
  timestamps: true,
});

export const User = mongoose.models.User || mongoose.model('User', userSchema);
export default User;

