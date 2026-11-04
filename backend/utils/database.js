import { auth } from '../config/firebase.js';
import { asyncStorage } from './asyncStorage.js';
import { User } from '../models/User.js';
import { Post } from '../models/Post.js';
import { mongoose } from '../config/mongodb.js';

const INITIAL_POSTS = [
  {
    id: "p1",
    author: "Jordan Lee",
    authorTag: "@jordan_ev",
    timeAgo: "25m ago",
    content: "Driving down south for the tech conference. Spacious EV with heated seats and supercharger stops planned. Trunk has room for 2 suitcases.",
    fromCity: "San Francisco, CA",
    toCity: "Los Angeles, CA",
    departureTime: "Today • 04:30 PM",
    availableSeats: 3,
    pricePerSeat: "$35",
    link: "https://drivemate.com/routes/pacific-coast-run",
    linkTitle: "Pacific Coast EV Route Map & Charging Guide",
    tag: "#Carpool",
    likes: 24,
    commentsCount: 6,
    likedBy: [],
  },
  {
    id: "p2",
    author: "Elena Rostova",
    authorTag: "@elena_m3",
    timeAgo: "1h ago",
    content: "Daily morning commuter corridor run. Quiet ride, coffee friendly, dropping off near downtown Pioneer Square.",
    fromCity: "Seattle, WA",
    toCity: "Portland, OR",
    departureTime: "Tomorrow • 07:30 AM",
    availableSeats: 2,
    pricePerSeat: "$25",
    tag: "#Commute",
    likes: 19,
    commentsCount: 3,
    likedBy: [],
  },
  {
    id: "p3",
    author: "Drivemate Road Safety",
    authorTag: "@drivemate_alerts",
    timeAgo: "2h ago",
    content: "Heavy fog warning on Interstate 80 pass. Drivers are advised to increase braking distance and enable fog lamps.",
    fromCity: "Sacramento, CA",
    toCity: "Lake Tahoe, NV",
    departureTime: "Active Road Hazard",
    tag: "#TrafficAlert",
    likes: 42,
    commentsCount: 9,
    likedBy: [],
  },
  {
    id: "p4",
    author: "Devon Clark",
    authorTag: "@devon_c",
    timeAgo: "4h ago",
    content: "Weekend road trip to the Hill Country. All wheel drive SUV, ski/snowboard rack mounted. Anyone want to split fuel?",
    fromCity: "Austin, TX",
    toCity: "Houston, TX",
    departureTime: "Friday • 05:00 PM",
    availableSeats: 4,
    pricePerSeat: "Fuel Split",
    link: "https://drivemate.com/guides/diy-sensor-cleaning",
    linkTitle: "DIY Vehicle Sensor Cleaning Guide",
    tag: "#RoadTrip",
    likes: 31,
    commentsCount: 12,
    likedBy: [],
  },
];

class DataStore {
  constructor() {
    this.firestoreEnabled = false;
  }

  isMongoReady() {
    return mongoose.connection && mongoose.connection.readyState === 1;
  }

  // --- USER OPERATIONS ---

  async getUserById(uid) {
    // 1. Try MongoDB Atlas
    if (this.isMongoReady()) {
      try {
        const userDoc = await User.findOne({ uid }).lean();
        if (userDoc) return userDoc;
      } catch (err) {
        console.warn(`[MongoDB] getUserById fallback: ${err.message}`);
      }
    }

    // 2. Try AsyncStorage
    const raw = await asyncStorage.getItem(`user:${uid}`);
    return raw ? (typeof raw === 'string' ? JSON.parse(raw) : raw) : null;
  }

  async getUserByEmail(email) {
    const normalized = email.toLowerCase().trim();

    // 1. Try MongoDB Atlas
    if (this.isMongoReady()) {
      try {
        const userDoc = await User.findOne({ email: normalized }).lean();
        if (userDoc) return userDoc;
      } catch (err) {
        console.warn(`[MongoDB] getUserByEmail fallback: ${err.message}`);
      }
    }

    // 2. Try AsyncStorage
    const keys = await asyncStorage.getAllKeys();
    for (const key of keys) {
      if (key.startsWith('user:')) {
        const raw = await asyncStorage.getItem(key);
        if (raw) {
          const u = typeof raw === 'string' ? JSON.parse(raw) : raw;
          if (u.email && u.email.toLowerCase() === normalized) {
            return u;
          }
        }
      }
    }
    return null;
  }

  async saveUser(user) {
    const uid = user.uid;
    const cleanUser = {
      ...user,
      updatedAt: new Date().toISOString(),
    };

    // 1. Save in MongoDB Atlas
    if (this.isMongoReady()) {
      try {
        await User.findOneAndUpdate(
          { uid },
          { $set: cleanUser },
          { upsert: true, returnDocument: 'after', setDefaultsOnInsert: true }
        );
      } catch (err) {
        console.warn(`[MongoDB] saveUser error: ${err.message}`);
      }
    }

    // 2. Also persist in AsyncStorage
    await asyncStorage.setItem(`user:${uid}`, cleanUser);

    return cleanUser;
  }

  async updateUser(uid, updates) {
    const existing = await this.getUserById(uid);
    if (!existing) return null;

    const merged = {
      ...existing,
      ...updates,
      updatedAt: new Date().toISOString(),
    };

    // 1. Update in MongoDB Atlas
    if (this.isMongoReady()) {
      try {
        const updatedDoc = await User.findOneAndUpdate(
          { uid },
          { $set: merged },
          { returnDocument: 'after' }
        ).lean();
        if (updatedDoc) {
          await asyncStorage.setItem(`user:${uid}`, updatedDoc);
          return updatedDoc;
        }
      } catch (err) {
        console.warn(`[MongoDB] updateUser error: ${err.message}`);
      }
    }

    // 2. Update in AsyncStorage
    await asyncStorage.setItem(`user:${uid}`, merged);
    return merged;
  }

  // --- POST OPERATIONS ---

  async getAllPosts() {
    let posts = [];

    // 1. Try MongoDB Atlas
    if (this.isMongoReady()) {
      try {
        posts = await Post.find().sort({ createdAt: -1 }).lean();
        if (!posts || posts.length === 0) {
          // Seed MongoDB with initial community posts
          const seeded = await Post.insertMany(INITIAL_POSTS);
          posts = seeded.map(p => p.toObject());
        }
        return posts;
      } catch (err) {
        console.warn(`[MongoDB] getAllPosts fallback: ${err.message}`);
      }
    }

    // 2. Fallback to AsyncStorage
    const raw = await asyncStorage.getItem('community_posts');
    if (raw) {
      posts = typeof raw === 'string' ? JSON.parse(raw) : raw;
    } else {
      posts = INITIAL_POSTS;
      await asyncStorage.setItem('community_posts', posts);
    }

    return posts;
  }

  async createPost(post) {
    const newPost = {
      ...post,
      id: post.id || `p_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      createdAt: new Date().toISOString(),
      likes: 0,
      commentsCount: 0,
      likedBy: [],
    };

    // 1. Save in MongoDB Atlas
    if (this.isMongoReady()) {
      try {
        const created = await Post.create(newPost);
        newPost._id = created._id;
      } catch (err) {
        console.warn(`[MongoDB] createPost error: ${err.message}`);
      }
    }

    // 2. Persist in AsyncStorage
    const currentPosts = await this.getAllPosts();
    const updated = [newPost, ...currentPosts];
    await asyncStorage.setItem('community_posts', updated);

    return newPost;
  }

  async toggleLikePost(postId, userId) {
    // 1. Try MongoDB Atlas
    if (this.isMongoReady()) {
      try {
        const post = await Post.findOne({ id: postId });
        if (post) {
          const likedBy = Array.isArray(post.likedBy) ? [...post.likedBy] : [];
          const index = likedBy.indexOf(userId);
          let likes = typeof post.likes === 'number' ? post.likes : 0;
          let isLiked = false;

          if (index > -1) {
            likedBy.splice(index, 1);
            likes = Math.max(0, likes - 1);
            isLiked = false;
          } else {
            likedBy.push(userId);
            likes += 1;
            isLiked = true;
          }

          post.likes = likes;
          post.likedBy = likedBy;
          await post.save();

          return {
            ...post.toObject(),
            isLiked,
          };
        }
      } catch (err) {
        console.warn(`[MongoDB] toggleLikePost fallback: ${err.message}`);
      }
    }

    // 2. Fallback to AsyncStorage
    const posts = await this.getAllPosts();
    let target = null;

    const updated = posts.map(p => {
      if (p.id === postId) {
        const likedBy = Array.isArray(p.likedBy) ? [...p.likedBy] : [];
        const index = likedBy.indexOf(userId);
        let likes = typeof p.likes === 'number' ? p.likes : 0;
        let isLiked = false;

        if (index > -1) {
          likedBy.splice(index, 1);
          likes = Math.max(0, likes - 1);
          isLiked = false;
        } else {
          likedBy.push(userId);
          likes += 1;
          isLiked = true;
        }

        target = { ...p, likes, likedBy, isLiked };
        return target;
      }
      return p;
    });

    if (!target) return null;

    await asyncStorage.setItem('community_posts', updated);
    return target;
  }
}

export const dataStore = new DataStore();
export default dataStore;
