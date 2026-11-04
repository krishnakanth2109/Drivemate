import { promises as fs } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const DATA_DIR = join(__dirname, '..', 'data');
const STORAGE_FILE = join(DATA_DIR, 'async_storage.json');

/**
 * AsyncStorage for Backend
 * Provides asynchronous persistence for tokens, user sessions, and credentials.
 * Implements standard AsyncStorage methods (getItem, setItem, removeItem, clear, getAllKeys)
 * alongside dedicated token management methods.
 */
class BackendAsyncStorage {
  constructor() {
    this.memoryCache = new Map();
    this.initialized = false;
    this.writePromise = Promise.resolve();
  }

  async init() {
    if (this.initialized) return;

    try {
      await fs.mkdir(DATA_DIR, { recursive: true });
      const data = await fs.readFile(STORAGE_FILE, 'utf8');
      const parsed = JSON.parse(data);
      for (const [key, value] of Object.entries(parsed)) {
        this.memoryCache.set(key, value);
      }
    } catch (err) {
      if (err.code !== 'ENOENT') {
        console.warn('[AsyncStorage Backend] Note on init load:', err.message);
      }
      // If file doesn't exist yet, start with empty map and save
      await this.saveToFile();
    }

    this.initialized = true;
  }

  async saveToFile() {
    this.writePromise = this.writePromise.then(async () => {
      try {
        await fs.mkdir(DATA_DIR, { recursive: true });
        const obj = Object.fromEntries(this.memoryCache.entries());
        await fs.writeFile(STORAGE_FILE, JSON.stringify(obj, null, 2), 'utf8');
      } catch (err) {
        console.error('[AsyncStorage Backend] Failed to persist data to disk:', err.message);
      }
    });
    return this.writePromise;
  }

  /**
   * Set an item asynchronously
   * @param {string} key 
   * @param {any} value 
   */
  async setItem(key, value) {
    await this.init();
    const serialized = typeof value === 'string' ? value : JSON.stringify(value);
    this.memoryCache.set(key, serialized);
    await this.saveToFile();
    return true;
  }

  /**
   * Get an item asynchronously
   * @param {string} key 
   * @returns {Promise<string|null>}
   */
  async getItem(key) {
    await this.init();
    const val = this.memoryCache.get(key);
    return val !== undefined ? val : null;
  }

  /**
   * Remove an item asynchronously
   * @param {string} key 
   */
  async removeItem(key) {
    await this.init();
    const existed = this.memoryCache.delete(key);
    if (existed) {
      await this.saveToFile();
    }
    return existed;
  }

  /**
   * Clear all storage asynchronously
   */
  async clear() {
    await this.init();
    this.memoryCache.clear();
    await this.saveToFile();
  }

  /**
   * Get all storage keys
   * @returns {Promise<string[]>}
   */
  async getAllKeys() {
    await this.init();
    return Array.from(this.memoryCache.keys());
  }

  /**
   * Dedicated Token Helper: Store issued user auth token in async storage
   * @param {string} token 
   * @param {object} metadata 
   */
  async storeToken(token, metadata = {}) {
    const key = `token:${token}`;
    const tokenData = {
      token,
      ...metadata,
      storedAt: new Date().toISOString(),
      expiresAt: metadata.expiresAt || new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
      active: true,
    };
    await this.setItem(key, tokenData);
    if (metadata.uid) {
      await this.setItem(`user_active_token:${metadata.uid}`, token);
    }
    return tokenData;
  }

  /**
   * Dedicated Token Helper: Validate token session from async storage
   * @param {string} token 
   */
  async validateTokenSession(token) {
    const raw = await this.getItem(`token:${token}`);
    if (!raw) return null;
    try {
      const data = typeof raw === 'string' ? JSON.parse(raw) : raw;
      if (!data.active) return null;
      if (data.expiresAt && new Date(data.expiresAt) < new Date()) {
        await this.revokeToken(token);
        return null;
      }
      return data;
    } catch {
      return null;
    }
  }

  /**
   * Dedicated Token Helper: Revoke token from async storage
   * @param {string} token 
   */
  async revokeToken(token) {
    const raw = await this.getItem(`token:${token}`);
    if (raw) {
      try {
        const data = typeof raw === 'string' ? JSON.parse(raw) : raw;
        data.active = false;
        await this.setItem(`token:${token}`, data);
        if (data.uid) {
          await this.removeItem(`user_active_token:${data.uid}`);
        }
      } catch {}
    }
    return true;
  }
}

export const asyncStorage = new BackendAsyncStorage();
export default asyncStorage;

