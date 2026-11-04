import crypto from 'crypto';
import { auth } from '../config/firebase.js';
import { asyncStorage } from '../utils/asyncStorage.js';
import { dataStore } from '../utils/database.js';

function hashPassword(password) {
  return crypto.createHash('sha256').update(password).digest('hex');
}

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
    } = req.body;

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
    const { fullName, username, phoneNumber, bio, location, drivingStyle } = req.body;
    const updates = {};
    if (fullName !== undefined) updates.fullName = fullName;
    if (username !== undefined) updates.username = username;
    if (phoneNumber !== undefined) updates.phoneNumber = phoneNumber;
    if (bio !== undefined) updates.bio = bio;
    if (location !== undefined) updates.location = location;
    if (drivingStyle !== undefined) updates.drivingStyle = drivingStyle;

    const updatedUser = await dataStore.updateUser(req.user.uid, updates);

    // Update Firebase Auth displayName if available
    if (auth && fullName) {
      try {
        await auth.updateUser(req.user.uid, { displayName: fullName });
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
