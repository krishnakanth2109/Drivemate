import { auth } from '../config/firebase.js';
import { asyncStorage } from '../utils/asyncStorage.js';
import { dataStore } from '../utils/database.js';

export const requireAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization || req.headers['x-auth-token'];
    let token = null;

    if (authHeader) {
      if (typeof authHeader === 'string' && authHeader.startsWith('Bearer ')) {
        token = authHeader.substring(7).trim();
      } else {
        token = authHeader.trim();
      }
    }

    if (!token) {
      return res.status(401).json({
        success: false,
        error: 'Authentication required. No Bearer token provided in headers.',
      });
    }

    // 1. Check backend async storage token session (includes MongoDB Atlas persistent lookup)
    const session = await asyncStorage.validateTokenSession(token);
    let uid = session ? session.uid : null;

    // 2. If not found, verify standard Firebase ID token with Admin SDK if available
    if (!uid && auth) {
      try {
        const decodedToken = await auth.verifyIdToken(token);
        uid = decodedToken.uid;
        // Cache verified token in asyncStorage & MongoDB
        await asyncStorage.storeToken(token, {
          uid,
          email: decodedToken.email,
          authTime: decodedToken.auth_time,
        });
      } catch (fbErr) {
        // If it's a custom token or format mismatch, continue to JWT/dm_ parser
      }
    }

    // 3. If token is a JWT (such as a Firebase Custom Token or service-issued token)
    if (!uid && typeof token === 'string' && token.includes('.')) {
      try {
        const parts = token.split('.');
        if (parts.length === 3) {
          const payload = JSON.parse(Buffer.from(parts[1], 'base64url').toString('utf8'));
          const candidateUid = payload.uid || payload.user_id || payload.sub;
          if (candidateUid) {
            const { User } = await import('../models/User.js');
            const existing = await User.findOne({ uid: candidateUid }).lean();
            if (existing) {
              uid = existing.uid;
              await User.updateOne({ uid }, { $set: { activeToken: token } }).catch(() => {});
              await asyncStorage.storeToken(token, { uid, email: existing.email }).catch(() => {});
            } else if (auth) {
              try {
                const fbUser = await auth.getUser(candidateUid);
                if (fbUser) {
                  uid = fbUser.uid;
                }
              } catch {}
            }
          }
        }
      } catch (jwtErr) {}
    }

    // 4. If token is a dm_<uid>_<random> fallback token
    if (!uid && typeof token === 'string' && token.startsWith('dm_')) {
      const firstUnderscore = token.indexOf('_');
      const lastUnderscore = token.lastIndexOf('_');
      if (firstUnderscore !== -1 && lastUnderscore > firstUnderscore) {
        const candidateUid = token.substring(firstUnderscore + 1, lastUnderscore);
        if (candidateUid) {
          const { User } = await import('../models/User.js');
          const existing = await User.findOne({ uid: candidateUid }).lean();
          if (existing) {
            uid = existing.uid;
            await User.updateOne({ uid }, { $set: { activeToken: token } }).catch(() => {});
            await asyncStorage.storeToken(token, { uid, email: existing.email }).catch(() => {});
          }
        }
      }
    }

    if (!uid) {
      return res.status(401).json({
        success: false,
        error: 'Invalid, expired, or revoked authentication token.',
      });
    }

    // Fetch user profile
    let user = await dataStore.getUserById(uid);
    if (!user) {
      try {
        const { User } = await import('../models/User.js');
        user = await User.findOne({ uid }).lean();
      } catch {}
    }
    if (!user) {
      // If user is authenticated in Firebase Auth but missing local record, pull from Firebase Auth
      try {
        const fbUser = await auth.getUser(uid);
        user = {
          uid: fbUser.uid,
          email: fbUser.email,
          fullName: fbUser.displayName || fbUser.email.split('@')[0],
          phoneNumber: fbUser.phoneNumber || '',
          isProUser: false,
          freePostsUsed: 0,
          maxFreePosts: 2,
          singlePasses: 0,
          vehicles: [],
        };
        await dataStore.saveUser(user);
      } catch (err) {
        return res.status(404).json({
          success: false,
          error: 'User account not found.',
        });
      }
    }

    req.user = user;
    req.token = token;
    next();
  } catch (error) {
    console.error('[AuthMiddleware] Error:', error);
    return res.status(500).json({
      success: false,
      error: 'Internal server authentication error.',
    });
  }
};

