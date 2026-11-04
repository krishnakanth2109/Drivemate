import Redis from 'ioredis';
import dotenv from 'dotenv';

dotenv.config();

let redisClient = null;
let isConnected = false;

// In-memory fallback if local Redis server is not currently running
class MemoryRedisFallback {
  constructor() {
    this.store = new Map();
    this.ttls = new Map();
    console.log('⚡ [Redis Fallback] In-memory high-speed cache & lock active.');
  }

  async get(key) {
    if (this.ttls.has(key) && Date.now() > this.ttls.get(key)) {
      this.store.delete(key);
      this.ttls.delete(key);
      return null;
    }
    return this.store.has(key) ? this.store.get(key) : null;
  }

  async set(key, value, mode, duration) {
    this.store.set(key, String(value));
    if (mode === 'EX' && typeof duration === 'number') {
      this.ttls.set(key, Date.now() + duration * 1000);
    }
    return 'OK';
  }

  async setnx(key, value) {
    if (this.store.has(key)) return 0;
    this.store.set(key, String(value));
    return 1;
  }

  async del(key) {
    const existed = this.store.delete(key);
    this.ttls.delete(key);
    return existed ? 1 : 0;
  }

  async incr(key) {
    const current = parseInt(this.store.get(key) || '0', 10);
    const next = current + 1;
    this.store.set(key, String(next));
    return next;
  }

  async acquireLock(lockKey, ttlSeconds = 5) {
    const now = Date.now();
    if (this.ttls.has(lockKey) && now < this.ttls.get(lockKey)) {
      return false; // Already locked
    }
    this.store.set(lockKey, 'locked');
    this.ttls.set(lockKey, now + ttlSeconds * 1000);
    return true;
  }

  async releaseLock(lockKey) {
    this.store.delete(lockKey);
    this.ttls.delete(lockKey);
    return true;
  }
}

export function initRedis() {
  const redisUrl = process.env.REDIS_URL || 'redis://127.0.0.1:6379';

  try {
    const client = new Redis(redisUrl, {
      maxRetriesPerRequest: 1,
      connectTimeout: 2000,
      lazyConnect: true,
      retryStrategy: () => null, // don't infinite loop on dev machines without redis
    });

    client.on('connect', () => {
      isConnected = true;
      console.log('⚡ [Redis Cache] Connected to Redis server.');
    });

    client.on('error', (err) => {
      isConnected = false;
      // Silently fall back to in-memory
    });

    // Try connecting
    client.connect().catch(() => {
      isConnected = false;
    });

    redisClient = client;
  } catch {
    isConnected = false;
  }

  return redisClient;
}

export const fallbackStore = new MemoryRedisFallback();

/**
 * Race Condition Mutex Lock helper
 * Prevents multiple simultaneous post creations / quota bypass exploits
 */
export async function acquireRaceLock(lockKey, ttlSeconds = 4) {
  if (isConnected && redisClient) {
    try {
      const result = await redisClient.set(lockKey, 'locked', 'EX', ttlSeconds, 'NX');
      return result === 'OK';
    } catch {
      return fallbackStore.acquireLock(lockKey, ttlSeconds);
    }
  }
  return fallbackStore.acquireLock(lockKey, ttlSeconds);
}

export async function releaseRaceLock(lockKey) {
  if (isConnected && redisClient) {
    try {
      await redisClient.del(lockKey);
      return true;
    } catch {}
  }
  return fallbackStore.releaseLock(lockKey);
}

export default {
  initRedis,
  acquireRaceLock,
  releaseRaceLock,
};

