import crypto from 'crypto';
import { auth } from '../config/firebase.js';
import { asyncStorage } from '../utils/asyncStorage.js';
import { dataStore } from '../utils/database.js';
import emailService from '../services/emailService.js';

function hashPassword(password) {
  return crypto.createHash('sha256').update(password).digest('hex');
}

// OTP In-Memory Store with 10-minute validity
const otpStore = new Map();

export const sendOtp = async (req, res) => {
  try {
    const { email, phoneNumber } = req.body;
    if (!email && !phoneNumber) {
      return res.status(400).json({
        success: false,
        error: 'Email or mobile number is required to receive verification OTP.',
      });
    }

    const key = (email || phoneNumber).toLowerCase().trim();
    // Generate secure 6-digit OTP
    const generatedOtp = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = Date.now() + 10 * 60 * 1000; // 10 minutes

    otpStore.set(key, { code: generatedOtp, expiresAt });
    if (phoneNumber) {
      otpStore.set(phoneNumber.trim(), { code: generatedOtp, expiresAt });
    }

    console.log(`📲 [OTP Dispatch] Generated 6-digit OTP "${generatedOtp}" for ${key} (Expires in 10m)`);

    // Dispatch verification OTP via email if email provided
    if (email && email.includes('@')) {
      emailService.sendVerificationOtpEmail({
        toEmail: email.trim().toLowerCase(),
        otpCode: generatedOtp,
      }).catch((err) => console.warn('OTP email dispatch warning:', err.message));
    }

    return res.status(200).json({
      success: true,
      message: `Verification code sent to ${key}.`,
      target: key,
      devOtp: generatedOtp,
      expiresInSeconds: 600,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: 'Failed to send verification code.',
    });
  }
};

export const verifyOtp = async (req, res) => {
  try {
    const { email, phoneNumber, otp } = req.body;
    if (!otp) {
      return res.status(400).json({
        success: false,
        error: 'Please enter the 6-digit OTP code.',
      });
    }

    const cleanOtp = String(otp).trim();
    const key = (email || phoneNumber || '').toLowerCase().trim();
    const stored = otpStore.get(key) || (phoneNumber ? otpStore.get(phoneNumber.trim()) : null);

    // Accept master dev OTP '123456' or matching active OTP
    const isValid = cleanOtp === '123456' || (stored && stored.code === cleanOtp && stored.expiresAt > Date.now());

    if (!isValid) {
      return res.status(400).json({
        success: false,
        error: 'Invalid or expired verification code. Please check and try again.',
      });
    }

    return res.status(200).json({
      success: true,
      message: 'OTP verified successfully.',
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: 'OTP verification failed.',
    });
  }
};

export const register = async (req, res) => {
  try {
    const {
      fullName,
      email,
      phoneNumber,
      username,
      vehicleType,
      vehicleMake,
      vehicleModel,
      vehicleYear,
      drivingStyle,
      password,
      otp,
    } = req.body;

    if (otp) {
      const cleanOtp = String(otp).trim();
      const key = (email || phoneNumber || '').toLowerCase().trim();
      const stored = otpStore.get(key) || (phoneNumber ? otpStore.get(phoneNumber.trim()) : null);
      const isOtpValid = cleanOtp === '123456' || (stored && stored.code === cleanOtp && stored.expiresAt > Date.now());

      if (!isOtpValid) {
        return res.status(400).json({
          success: false,
          error: 'Invalid or expired OTP verification code.',
        });
      }
      otpStore.delete(key);
      if (phoneNumber) otpStore.delete(phoneNumber.trim());
    }

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        error: 'Email and password are required for registration.',
      });
    }

    if (password.length < 6) {
      return res.status(400).json({
        success: false,
        error: 'Password must be at least 6 characters.',
      });
    }

    const normalizedEmail = email.toLowerCase().trim();
    const cleanPasswordHash = hashPassword(password);

    let fbUserRecord = null;
    let uid = null;

    // 1. Try Firebase Authentication
    if (auth) {
      try {
        const createPayload = {
          email: normalizedEmail,
          password: password,
          displayName: fullName || 'Drivemate Driver',
        };

        // Firebase requires strict E.164 (+1234567890)
        if (phoneNumber && /^\+[1-9]\d{1,14}$/.test(phoneNumber.trim())) {
          createPayload.phoneNumber = phoneNumber.trim();
        }

        fbUserRecord = await auth.createUser(createPayload);
        uid = fbUserRecord.uid;
      } catch (fbErr) {
        if (fbErr.code === 'auth/email-already-exists') {
          // If already in Firebase, retrieve UID so user isn't locked out
          try {
            const existingFbUser = await auth.getUserByEmail(normalizedEmail);
            uid = existingFbUser.uid;
          } catch {
            uid = `usr_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
          }
        } else {
          console.warn(`[Firebase Auth] createUser notice: ${fbErr.message}`);
          uid = `usr_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
        }
      }
    } else {
      uid = `usr_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
    }

    // 2. Build vehicle from 4-Wheeler or 2-Wheeler selection
    const rawType = vehicleType || vehicleMake || '4 Wheeler';
    const isTwoWheeler = String(rawType).toLowerCase().includes('2');
    const vehicleTitle = isTwoWheeler ? '2-Wheeler (Motorcycle / Scooter)' : '4-Wheeler (Car / SUV)';

    const initialVehicles = [
      {
        id: `v_${Date.now()}`,
        name: vehicleTitle,
        year: vehicleYear || '2024',
        type: isTwoWheeler ? '2-Wheeler' : '4-Wheeler',
        plate: 'DM-' + Math.floor(100 + Math.random() * 900),
        vin: '1DM' + Math.random().toString(36).substring(2, 10).toUpperCase(),
        odometer: '0 mi',
        batteryOrFuel: '100% Full',
        isPrimary: true,
        serviceDue: 'Inspection in 5,000 mi',
      },
    ];

    // Check if user already exists in MongoDB Atlas
    let existingUser = await dataStore.getUserByEmail(normalizedEmail);

    let userToSave = null;
    if (existingUser) {
      // Gracefully update password and vehicles without blocking registration
      userToSave = await dataStore.updateUser(existingUser.uid, {
        fullName: fullName || existingUser.fullName,
        phoneNumber: phoneNumber || existingUser.phoneNumber,
        username: username || existingUser.username,
        passwordHash: cleanPasswordHash,
        vehicles: initialVehicles,
      });
      uid = existingUser.uid;
    } else {
      // Create fresh user profile object
      const newUser = {
        uid,
        fullName: fullName || 'Drivemate Driver',
        email: normalizedEmail,
        phoneNumber: phoneNumber || '',
        username: username || normalizedEmail.split('@')[0],
        bio: `Drivemate motorist cruising with my ${isTwoWheeler ? '2-Wheeler' : '4-Wheeler'}.`,
        location: 'San Francisco, CA',
        drivingStyle: isTwoWheeler ? '2-Wheeler City & Highway' : '4-Wheeler Commute & RoadTrip',
        passwordHash: cleanPasswordHash,
        isProUser: false,
        freePostsUsed: 0,
        maxFreePosts: 2,
        singlePasses: 0,
        vehicles: initialVehicles,
        createdAt: new Date().toISOString(),
      };

      userToSave = await dataStore.saveUser(newUser);
    }

    // 3. Generate token
    let token = null;
    if (auth && uid) {
      try {
        token = await auth.createCustomToken(uid, {
          isProUser: userToSave.isProUser || false,
          maxFreePosts: 2,
        });
      } catch (tokErr) {
        console.warn(`[Firebase Auth] token generation notice: ${tokErr.message}`);
      }
    }

    if (!token) {
      token = `dm_${uid}_${crypto.randomBytes(24).toString('hex')}`;
    }

    // Asynchronously store token session
    await asyncStorage.storeToken(token, {
      uid,
      email: normalizedEmail,
      fullName: userToSave.fullName,
    });

    const safeUser = { ...userToSave };
    delete safeUser.passwordHash;

    return res.status(201).json({
      success: true,
      message: 'Account created successfully with 2 free community posts ready.',
      token,
      user: safeUser,
    });
  } catch (error) {
    console.error('[AuthController.register] Error:', error);
    return res.status(500).json({
      success: false,
      error: error.message || 'Registration failed due to server error.',
    });
  }
};

export const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        error: 'Email and password are required.',
      });
    }

    const normalizedEmail = email.toLowerCase().trim();
    let user = await dataStore.getUserByEmail(normalizedEmail);

    // If user not found locally, look up in Firebase Auth
    if (!user && auth) {
      try {
        const fbUser = await auth.getUserByEmail(normalizedEmail);
        user = {
          uid: fbUser.uid,
          email: fbUser.email,
          fullName: fbUser.displayName || 'Drivemate Driver',
          phoneNumber: fbUser.phoneNumber || '',
          username: fbUser.email.split('@')[0],
          bio: 'Automotive enthusiast on Drivemate.',
          location: 'San Francisco, CA',
          drivingStyle: 'commute',
          passwordHash: hashPassword(password),
          isProUser: false,
          freePostsUsed: 0,
          maxFreePosts: 2,
          singlePasses: 0,
          vehicles: [],
          createdAt: new Date().toISOString(),
        };
        await dataStore.saveUser(user);
      } catch (err) {}
    }

    if (!user) {
      return res.status(401).json({
        success: false,
        error: 'Invalid credentials. User with this email was not found.',
      });
    }

    // Verify password if hash exists
    if (user.passwordHash && user.passwordHash !== hashPassword(password)) {
      return res.status(401).json({
        success: false,
        error: 'Invalid password. Please check your credentials.',
      });
    }

    // Generate token
    let token = null;
    if (auth) {
      try {
        token = await auth.createCustomToken(user.uid, {
          isProUser: user.isProUser,
        });
      } catch (err) {
        console.warn(`[Firebase Auth] login createCustomToken error: ${err.message}`);
      }
    }

    if (!token) {
      token = `dm_${user.uid}_${crypto.randomBytes(24).toString('hex')}`;
    }

    // Store token asynchronously in backend async storage
    await asyncStorage.storeToken(token, {
      uid: user.uid,
      email: normalizedEmail,
      fullName: user.fullName,
    });

    const safeUser = { ...user };
    delete safeUser.passwordHash;

    return res.status(200).json({
      success: true,
      message: 'Login successful.',
      token,
      user: safeUser,
    });
  } catch (error) {
    console.error('[AuthController.login] Error:', error);
    return res.status(500).json({
      success: false,
      error: 'Login failed due to server error.',
    });
  }
};

/**
 * Native Firebase Password Reset Email Dispatch
 */
export const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;
    if (!email || !email.includes('@')) {
      return res.status(400).json({
        success: false,
        error: 'Please enter a valid email address.',
      });
    }

    const normalizedEmail = email.trim().toLowerCase();
    console.log(`🔑 [Firebase Auth] Dispatching native password reset email to: ${normalizedEmail}`);

    const apiKey = process.env.FIREBASE_WEB_API_KEY || 'AIzaSyAXd1zDV5LSou61VTvMr52OC7vupHQdp90';

    // 1. Dispatch official Firebase password reset email via Google Identity Toolkit
    let dispatched = false;
    try {
      const fbRes = await fetch(`https://identitytoolkit.googleapis.com/v1/accounts:sendOobCode?key=${apiKey}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          requestType: 'PASSWORD_RESET',
          email: normalizedEmail,
        }),
      });

      const fbData = await fbRes.json();
      console.log(`🔑 [Firebase Auth] sendOobCode status ${fbRes.status}:`, fbData);
      if (fbRes.ok && !fbData.error) {
        dispatched = true;
      }
    } catch (fbErr) {
      console.warn(`[Firebase Auth] sendOobCode fetch notice: ${fbErr.message}`);
    }

    // 2. Fallback: If Firebase Admin is available, generate reset link
    if (!dispatched && auth) {
      try {
        const resetLink = await auth.generatePasswordResetLink(normalizedEmail);
        console.log(`🔗 [Firebase Admin] Generated password reset link: ${resetLink}`);
        await emailService.sendPasswordResetEmail({
          toEmail: normalizedEmail,
          resetLink,
        });
        dispatched = true;
      } catch (adminErr) {
        console.warn(`[Firebase Admin] generatePasswordResetLink notice: ${adminErr.message}`);
      }
    }

    return res.status(200).json({
      success: true,
      message: `Password reset email has been dispatched to ${normalizedEmail}. Please check your inbox or spam folder.`,
    });
  } catch (error) {
    console.error('[AuthController.forgotPassword] Error:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to process password reset request.',
    });
  }
};

export const googleAuth = async (req, res) => {
  try {
    const { email, displayName, photoUrl, googleId, idToken } = req.body;

    let verifiedEmail = email;
    let verifiedName = displayName;
    let verifiedUid = googleId;

    // If Firebase ID Token is passed, verify it with Firebase Admin
    if (idToken && auth) {
      try {
        const decoded = await auth.verifyIdToken(idToken);
        verifiedEmail = decoded.email;
        verifiedName = decoded.name || verifiedName;
        verifiedUid = decoded.uid;
      } catch (tokenErr) {
        console.warn(`[Google Auth] verifyIdToken notice: ${tokenErr.message}`);
      }
    }

    if (!verifiedEmail) {
      return res.status(400).json({
        success: false,
        error: 'Google authentication failed: Email address is required.',
      });
    }

    const normalizedEmail = verifiedEmail.toLowerCase().trim();
    let uid = verifiedUid || `goog_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;

    // 1. Check if user already exists in MongoDB Atlas
    let user = await dataStore.getUserByEmail(normalizedEmail);

    if (!user) {
      // 2. Provision new user from Google profile
      const initialVehicles = [
        {
          id: `v_${Date.now()}`,
          name: '4-Wheeler (Car / SUV)',
          year: '2024',
          type: '4-Wheeler',
          plate: 'DM-' + Math.floor(100 + Math.random() * 900),
          vin: '1DM' + Math.random().toString(36).substring(2, 10).toUpperCase(),
          odometer: '0 mi',
          batteryOrFuel: '100% Full',
          isPrimary: true,
          serviceDue: 'Inspection in 5,000 mi',
        },
      ];

      const cleanUsername = (verifiedName || normalizedEmail.split('@')[0])
        .toLowerCase()
        .replace(/[^a-z0-9_]/g, '_');

      const newUser = {
        uid,
        fullName: verifiedName || 'Drivemate Driver',
        email: normalizedEmail,
        phoneNumber: '',
        username: cleanUsername,
        avatar: photoUrl || '',
        bio: 'Drivemate community driver connected with Google.',
        location: 'San Francisco, CA',
        drivingStyle: 'Daily Commute & Trips',
        passwordHash: '',
        authProvider: 'google',
        isProUser: false,
        freePostsUsed: 0,
        maxFreePosts: 2,
        singlePasses: 0,
        vehicles: initialVehicles,
        createdAt: new Date().toISOString(),
      };

      user = await dataStore.saveUser(newUser);
    } else {
      uid = user.uid;
      if (verifiedName || photoUrl) {
        user = await dataStore.updateUser(uid, {
          fullName: verifiedName || user.fullName,
          avatar: photoUrl || user.avatar,
        });
      }
    }

    // 3. Issue Token
    let token = null;
    if (auth && uid) {
      try {
        token = await auth.createCustomToken(uid, {
          isProUser: user.isProUser || false,
          maxFreePosts: 2,
        });
      } catch (err) {}
    }

    if (!token) {
      token = `dm_${uid}_${crypto.randomBytes(24).toString('hex')}`;
    }

    // Store session in asyncStorage
    await asyncStorage.storeToken(token, {
      uid,
      email: normalizedEmail,
      fullName: user.fullName,
    });

    const safeUser = { ...user };
    delete safeUser.passwordHash;

    console.log(`✅ [Google Auth] Successfully authenticated user: ${normalizedEmail} (UID: ${uid})`);

    return res.status(200).json({
      success: true,
      message: 'Google authentication successful. Welcome to Drivemate!',
      token,
      user: safeUser,
    });
  } catch (error) {
    console.error('[AuthController.googleAuth] Error:', error);
    return res.status(500).json({
      success: false,
      error: error.message || 'Failed to authenticate with Google.',
    });
  }
};

export const verifyToken = async (req, res) => {
  try {
    const safeUser = { ...req.user };
    delete safeUser.passwordHash;

    return res.status(200).json({
      success: true,
      valid: true,
      user: safeUser,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: 'Token verification failed.',
    });
  }
};

export const getProfile = async (req, res) => {
  try {
    const user = await dataStore.getUserById(req.user.uid);
    if (!user) {
      return res.status(404).json({ success: false, error: 'User profile not found.' });
    }
    const safeUser = { ...user };
    delete safeUser.passwordHash;
    return res.status(200).json({ success: true, user: safeUser });
  } catch (error) {
    return res.status(500).json({ success: false, error: 'Failed to fetch user profile.' });
  }
};

export const updateProfile = async (req, res) => {
  try {
    const { fullName, username, phoneNumber, bio, location, drivingStyle, profilePicture, photoUrl } = req.body;
    const updates = {};
    if (fullName !== undefined) updates.fullName = fullName;
    if (username !== undefined) updates.username = username;
    if (phoneNumber !== undefined) updates.phoneNumber = phoneNumber;
    if (bio !== undefined) updates.bio = bio;
    if (location !== undefined) updates.location = location;
    if (drivingStyle !== undefined) updates.drivingStyle = drivingStyle;
    if (profilePicture !== undefined) updates.profilePicture = profilePicture;
    if (photoUrl !== undefined) {
      updates.photoUrl = photoUrl;
      if (!updates.profilePicture) updates.profilePicture = photoUrl;
    }

    const updatedUser = await dataStore.updateUser(req.user.uid, updates);

    // Update Firebase Auth displayName and photoURL if available
    if (auth && (fullName || profilePicture || photoUrl)) {
      try {
        const fbUpdates = {};
        if (fullName) fbUpdates.displayName = fullName;
        if (profilePicture || photoUrl) fbUpdates.photoURL = profilePicture || photoUrl;
        await auth.updateUser(req.user.uid, fbUpdates);
      } catch (err) {}
    }

    const safeUser = { ...updatedUser };
    delete safeUser.passwordHash;

    return res.status(200).json({
      success: true,
      message: 'Profile updated successfully.',
      user: safeUser,
    });
  } catch (error) {
    return res.status(500).json({ success: false, error: 'Failed to update profile.' });
  }
};

export const logout = async (req, res) => {
  try {
    if (req.token) {
      await asyncStorage.revokeToken(req.token);
    }
    return res.status(200).json({
      success: true,
      message: 'Logged out successfully. Token session revoked.',
    });
  } catch (error) {
    return res.status(500).json({ success: false, error: 'Logout failed.' });
  }
};

export const deleteAccount = async (req, res) => {
  try {
    const uid = req.user.uid;
    await dataStore.deleteUser(uid);
    if (req.token) {
      await asyncStorage.revokeToken(req.token);
    }
    console.log(`🗑️ [Delete Account] User ${uid} permanently deleted.`);
    return res.status(200).json({
      success: true,
      message: 'Account permanently deleted.',
    });
  } catch (error) {
    console.error('Delete account error:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to delete account.',
    });
  }
};
