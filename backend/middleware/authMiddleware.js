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

    // 1. Check backend async storage token session
    const session = await asyncStorage.validateTokenSession(token);
    let uid = session ? session.uid : null;

    // 2. If not found in local async storage session, verify with Firebase Admin SDK verifyIdToken
    if (!uid && auth) {
      try {
        const decodedToken = await auth.verifyIdToken(token);
        uid = decodedToken.uid;
        // Cache verified token in asyncStorage
        await asyncStorage.storeToken(token, {
          uid,
          email: decodedToken.email,
          authTime: decodedToken.auth_time,
        });
      } catch (fbErr) {
        // If it's a custom token or format mismatch, check session again
        console.warn(`[AuthMiddleware] verifyIdToken check: ${fbErr.message}`);
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

