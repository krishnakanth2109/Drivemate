import AsyncStorage from "@react-native-async-storage/async-storage";

const STORAGE_KEYS = {
  AUTH_TOKEN: "@drivemate_auth_token",
  USER_PROFILE: "@drivemate_user_profile",
  POST_QUOTA: "@drivemate_post_quota",
  THEME_MODE: "@drivemate_theme_mode",
};

export interface StoredUserProfile {
  uid: string;
  fullName: string;
  email: string;
  phoneNumber?: string;
  username?: string;
  profilePicture?: string;
  photoUrl?: string;
  bio?: string;
  location?: string;
  drivingStyle?: string;
  isProUser: boolean;
  freePostsUsed: number;
  maxFreePosts: number;
  singlePasses: number;
  vehicles?: any[];
  isVerified?: boolean;
  emailVerified?: boolean;
}

/**
 * Persist authentication token to AsyncStorage
 */
export async function saveAuthToken(token: string): Promise<void> {
  try {
    console.log("💾 [Storage 🔑 saveAuthToken] Persisting token:", `${token.slice(0, 16)}...`);
    await AsyncStorage.setItem(STORAGE_KEYS.AUTH_TOKEN, token);
  } catch (error) {
    console.error("❌ [Storage] Failed to save auth token:", error);
  }
}

/**
 * Retrieve authentication token from AsyncStorage
 */
export async function getAuthToken(): Promise<string | null> {
  try {
    const token = await AsyncStorage.getItem(STORAGE_KEYS.AUTH_TOKEN);
    return token;
  } catch (error) {
    console.error("❌ [Storage] Failed to get auth token:", error);
    return null;
  }
}

/**
 * Remove authentication token from AsyncStorage
 */
export async function removeAuthToken(): Promise<void> {
  try {
    console.log("💾 [Storage 🗑️ removeAuthToken] Cleared token");
    await AsyncStorage.removeItem(STORAGE_KEYS.AUTH_TOKEN);
  } catch (error) {
    console.error("❌ [Storage] Failed to remove auth token:", error);
  }
}

/**
 * Persist user profile to AsyncStorage
 */
export async function saveUserProfile(profile: StoredUserProfile): Promise<void> {
  try {
    console.log("💾 [Storage 👤 saveUserProfile] Caching profile:", {
      fullName: profile.fullName,
      email: profile.email,
      isProUser: profile.isProUser,
      freePostsUsed: profile.freePostsUsed,
      singlePasses: profile.singlePasses,
    });
    await AsyncStorage.setItem(STORAGE_KEYS.USER_PROFILE, JSON.stringify(profile));
  } catch (error) {
    console.error("❌ [Storage] Failed to save user profile:", error);
  }
}

export const setUserProfile = saveUserProfile;

/**
 * Retrieve user profile from AsyncStorage
 */
export async function getUserProfile(): Promise<StoredUserProfile | null> {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEYS.USER_PROFILE);
    const parsed = raw ? JSON.parse(raw) : null;
    if (parsed) {
      console.log("💾 [Storage 👤 getUserProfile] Retrieved profile:", {
        fullName: parsed.fullName,
        email: parsed.email,
        isProUser: parsed.isProUser,
      });
    }
    return parsed;
  } catch (error) {
    console.error("❌ [Storage] Failed to get user profile:", error);
    return null;
  }
}

/**
 * Clear all authentication data from AsyncStorage (for logout)
 */
export async function clearAuthSession(): Promise<void> {
  try {
    console.log("💾 [Storage 🧹 clearAuthSession] Purging auth session from storage");
    await AsyncStorage.multiRemove([
      STORAGE_KEYS.AUTH_TOKEN,
      STORAGE_KEYS.USER_PROFILE,
      STORAGE_KEYS.POST_QUOTA,
    ]);
  } catch (error) {
    console.error("❌ [Storage] Failed to clear auth session:", error);
  }
}

/**
 * Persist dark mode theme setting
 */
export async function saveThemeMode(isDark: boolean): Promise<void> {
  try {
    await AsyncStorage.setItem(STORAGE_KEYS.THEME_MODE, isDark ? "dark" : "light");
  } catch (error) {
    console.error("❌ [Storage] Failed to save theme mode:", error);
  }
}

/**
 * Get dark mode theme setting
 */
export async function getThemeMode(): Promise<boolean> {
  try {
    const mode = await AsyncStorage.getItem(STORAGE_KEYS.THEME_MODE);
    return mode === "dark";
  } catch (error) {
    console.error("❌ [Storage] Failed to get theme mode:", error);
    return false;
  }
}

export default {
  saveAuthToken,
  getAuthToken,
  removeAuthToken,
  saveUserProfile,
  getUserProfile,
  clearAuthSession,
  saveThemeMode,
  getThemeMode,
};

