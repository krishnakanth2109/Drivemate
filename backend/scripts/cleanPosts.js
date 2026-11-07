import { connectMongoDB } from '../config/mongodb.js';
import { Post } from '../models/Post.js';
import { asyncStorage } from '../utils/asyncStorage.js';

const CLEAN_POSTS = [
  {
    id: "p1",
    userId: "driver_jordan",
    author: "Jordan Lee",
    authorTag: "@jordan_ev",
    timeAgo: "25m ago",
    content: "Driving down south for the tech conference. Spacious EV with heated seats and supercharger stops planned. Trunk has room for 2 suitcases.",
    fromCity: "San Francisco, CA",
    toCity: "Los Angeles, CA",
    departureTime: "Today • 04:30 PM",
    availableSeats: 3,
    pricePerSeat: "Shared Ride",
    link: "https://drivemate.com/routes/pacific-coast-run",
    linkTitle: "Pacific Coast EV Route Map & Charging Guide",
    tag: "#Carpool",
    likes: 24,
    commentsCount: 6,
    likedBy: [],
    createdAt: new Date(Date.now() - 25 * 60 * 1000),
  },
  {
    id: "p2",
    userId: "driver_elena",
    author: "Elena Rostova",
    authorTag: "@elena_m3",
    timeAgo: "1h ago",
    content: "Daily morning commuter corridor run. Quiet ride, coffee friendly, dropping off near downtown Pioneer Square.",
    fromCity: "Seattle, WA",
    toCity: "Portland, OR",
    departureTime: "Tomorrow • 07:30 AM",
    availableSeats: 2,
    pricePerSeat: "Carpool",
    tag: "#Commute",
    likes: 19,
    commentsCount: 3,
    likedBy: [],
    createdAt: new Date(Date.now() - 60 * 60 * 1000),
  },
  {
    id: "p3",
    userId: "driver_safety",
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
    createdAt: new Date(Date.now() - 120 * 60 * 1000),
  },
  {
    id: "p4",
    userId: "driver_devon",
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
    createdAt: new Date(Date.now() - 240 * 60 * 1000),
  },
];

async function run() {
  await connectMongoDB();

  // 1. Clear out all test / junk posts from MongoDB
  const delRes = await Post.deleteMany({});
  console.log(`Deleted ${delRes.deletedCount} posts from MongoDB.`);

  // 2. Insert the 4 clean, authentic posts
  const inserted = await Post.insertMany(CLEAN_POSTS);
  console.log(`Inserted ${inserted.length} clean community posts into MongoDB.`);

  // 3. Clear and update AsyncStorage cache
  await asyncStorage.setItem('community_posts', CLEAN_POSTS);
  console.log('Synchronized community_posts in asyncStorage.');

  const remaining = await Post.find().lean();
  console.log(`Current total posts in DB: ${remaining.length}`);
  remaining.forEach((p, i) => {
    console.log(`  [${i + 1}] ${p.author} (${p.tag}): "${p.content.slice(0, 45)}..."`);
  });

  process.exit(0);
}

run().catch(err => {
  console.error(err);
  process.exit(1);
});
