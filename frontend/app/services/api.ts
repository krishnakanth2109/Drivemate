import { Platform } from "react-native";
import { getAuthToken, saveAuthToken, saveUserProfile, clearAuthSession, StoredUserProfile } from "./storage";

// Determine API base URL from frontend .env with platform fallbacks
const getApiBaseUrl = (): string => {
  const envUrl = process.env.EXPO_PUBLIC_API_URL || process.env.EXPO_PUBLIC_SERVER_URL;
  if (envUrl && envUrl.trim().length > 0) {
    const trimmed = envUrl.trim().replace(/\/+$/, "");
    const formatted = trimmed.endsWith("/api") ? trimmed : `${trimmed}/api`;
    // If running on Android emulator with localhost, translate to 10.0.2.2 loopback alias
    if (Platform.OS === "android" && formatted.includes("localhost")) {
      return formatted.replace("localhost", "10.0.2.2");
    }
    return formatted;
  }

  if (Platform.OS === "android") {
    return "http://10.0.2.2:5000/api";
  }
  return "http://localhost:5000/api";
};

export const API_BASE_URL = getApiBaseUrl();

interface RequestOptions extends RequestInit {
  requiresAuth?: boolean;
}

export interface ApiResponse<T = any> {
  success: boolean;
  message?: string;
  error?: string;
  data?: T;
  [key: string]: any;
}

/**
 * Centralized fetch helper with automatic Bearer token injection
 */
async function request<T = any>(endpoint: string, options: RequestOptions = {}): Promise<ApiResponse<T>> {
  const { requiresAuth = true, headers = {}, ...rest } = options;
  const url = `${API_BASE_URL}${endpoint.startsWith("/") ? endpoint : `/${endpoint}`}`;

  const requestHeaders: Record<string, string> = {
    "Content-Type": "application/json",
    ...(headers as Record<string, string>),
  };

  if (requiresAuth) {
    const token = await getAuthToken();
    if (token) {
      requestHeaders["Authorization"] = `Bearer ${token}`;
    }
  }

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000); // 10s timeout

    const response = await fetch(url, {
      ...rest,
      headers: requestHeaders,
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      return {
        success: false,
        error: data.error || `Server responded with status ${response.status}`,
        ...data,
      };
    }

    return {
      success: true,
      ...data,
    };
  } catch (error: any) {
    if (error.name === "AbortError") {
      return {
        success: false,
        error: "Network request timed out. Please check your backend connection.",
      };
    }
    return {
      success: false,
      error: error.message || "Failed to communicate with server.",
    };
  }
}

// ================= AUTH API =================

export const authAPI = {
  /**
   * Register with 7-step onboarding data and OTP verification
   */
  async register(data: {
    fullName: string;
    email: string;
    phoneNumber: string;
    username: string;
    vehicleType?: string;
    vehicleMake?: string;
    vehicleModel?: string;
    vehicleYear?: string;
    drivingStyle?: string;
    password: string;
    otp?: string;
  }) {
    const res = await request<{ token: string; user: StoredUserProfile }>(
      "/auth/register",
      {
        method: "POST",
        requiresAuth: false,
        body: JSON.stringify(data),
      }
    );

    if (res.success && res.token && res.user) {
      await saveAuthToken(res.token);
      await saveUserProfile(res.user);
    }
    return res;
  },

  /**
   * Dispatch 6-digit OTP code to email / phone
   */
  async sendOtp(params: { email?: string; phoneNumber?: string }) {
    return await request<{ devOtp?: string; target?: string }>(
      "/auth/send-otp",
      {
        method: "POST",
        requiresAuth: false,
        body: JSON.stringify(params),
      }
    );
  },

  /**
   * Verify 6-digit OTP code
   */
  async verifyOtp(params: { email?: string; phoneNumber?: string; otp: string }) {
    return await request(
      "/auth/verify-otp",
      {
        method: "POST",
        requiresAuth: false,
        body: JSON.stringify(params),
      }
    );
  },

  /**
   * Sign in with email and password
   */
  async login(email: string, password: string) {
    const res = await request<{ token: string; user: StoredUserProfile }>(
      "/auth/login",
      {
        method: "POST",
        requiresAuth: false,
        body: JSON.stringify({ email, password }),
      }
    );

    if (res.success && res.token && res.user) {
      await saveAuthToken(res.token);
      await saveUserProfile(res.user);
    }
    return res;
  },

  /**
   * Authenticate / Login with Google account
   */
  async googleLogin(params: {
    email: string;
    displayName?: string;
    photoUrl?: string;
    googleId?: string;
    idToken?: string;
  }) {
    const res = await request<{ token: string; user: StoredUserProfile }>(
      "/auth/google",
      {
        method: "POST",
        requiresAuth: false,
        body: JSON.stringify(params),
      }
    );

    if (res.success && res.token && res.user) {
      await saveAuthToken(res.token);
      await saveUserProfile(res.user);
    }
    return res;
  },

  /**
   * Verify currently stored token with backend
   */
  async verifyToken() {
    const token = await getAuthToken();
    if (!token) return { success: false, error: "No token stored" };

    const res = await request<{ valid: boolean; user: StoredUserProfile }>(
      "/auth/verify",
      { method: "GET", requiresAuth: true }
    );

    if (res.success && res.user) {
      await saveUserProfile(res.user);
    }
    return res;
  },

  /**
   * Get user profile
   */
  async getProfile() {
    const res = await request<{ user: StoredUserProfile }>("/auth/profile", {
      method: "GET",
      requiresAuth: true,
    });
    if (res.success && res.user) {
      await saveUserProfile(res.user);
    }
    return res;
  },

  /**
   * Update profile information
   */
  async updateProfile(updates: Partial<StoredUserProfile>) {
    const res = await request<{ user: StoredUserProfile }>("/auth/profile", {
      method: "PUT",
      requiresAuth: true,
      body: JSON.stringify(updates),
    });
    if (res.success && res.user) {
      await saveUserProfile(res.user);
    }
    return res;
  },

  /**
   * Sign out and clear stored tokens
   */
  async logout() {
    try {
      await request("/auth/logout", {
        method: "POST",
        requiresAuth: true,
      });
    } catch {}
    await clearAuthSession();
    return { success: true };
  },
};

// ================= POSTS API =================

export const postsAPI = {
  /**
   * Fetch all community posts
   */
  async getPosts() {
    return await request<{ posts: any[] }>("/posts", {
      method: "GET",
      requiresAuth: false,
    });
  },

  /**
   * Create a post (strictly enforces 2-free-posts quota and supports route / cities / timings)
   */
  async createPost(postData: {
    content: string;
    fromCity?: string;
    toCity?: string;
    departureTime?: string;
    availableSeats?: number;
    pricePerSeat?: string;
    link?: string;
    linkTitle?: string;
    tag?: string;
  }) {
    return await request("/posts", {
      method: "POST",
      requiresAuth: true,
      body: JSON.stringify(postData),
    });
  },

  /**
   * Toggle like on a community post
   */
  async toggleLike(postId: string) {
    return await request(`/posts/${postId}/like`, {
      method: "POST",
      requiresAuth: true,
    });
  },
};

// ================= VEHICLES API =================

export const vehiclesAPI = {
  /**
   * List all user garage vehicles
   */
  async getVehicles() {
    return await request<{ vehicles: any[] }>("/vehicles", {
      method: "GET",
      requiresAuth: true,
    });
  },

  /**
   * Add vehicle to garage
   */
  async addVehicle(vehicle: {
    name: string;
    year?: string;
    type?: string;
    plate?: string;
    vin?: string;
  }) {
    return await request("/vehicles", {
      method: "POST",
      requiresAuth: true,
      body: JSON.stringify(vehicle),
    });
  },

  /**
   * Delete vehicle from garage
   */
  async removeVehicle(vehicleId: string) {
    return await request(`/vehicles/${vehicleId}`, {
      method: "DELETE",
      requiresAuth: true,
    });
  },
};

// ================= BILLING API =================

export const billingAPI = {
  /**
   * Get quota and membership status
   */
  async getStatus() {
    return await request<{ billing: any }>("/billing/status", {
      method: "GET",
      requiresAuth: true,
    });
  },

  /**
   * Upgrade account to Pro tier
   */
  async upgradePro() {
    return await request("/billing/upgrade-pro", {
      method: "POST",
      requiresAuth: true,
    });
  },

  /**
   * Purchase Single Post Pass
   */
  async buySinglePass() {
    return await request("/billing/buy-single-pass", {
      method: "POST",
      requiresAuth: true,
    });
  },
};

// ================= MESSAGES API =================

export const messagesAPI = {
  async getMessages(roomId = "drivemate-hq") {
    return await request<{ messages: any[] }>(`/messages?roomId=${roomId}`, {
      method: "GET",
      requiresAuth: false,
    });
  },

  async sendMessage(text: string, roomId = "drivemate-hq") {
    return await request("/messages", {
      method: "POST",
      requiresAuth: true,
      body: JSON.stringify({ text, roomId }),
    });
  },
};

// ================= FIREBASE ANALYTICS API =================

export const analyticsAPI = {
  async logEvent(eventName: string, params: Record<string, any> = {}) {
    try {
      return await request("/analytics/event", {
        method: "POST",
        requiresAuth: false,
        body: JSON.stringify({ eventName, params, platform: Platform.OS }),
      });
    } catch {
      return { success: false };
    }
  },
};

export default {
  auth: authAPI,
  posts: postsAPI,
  vehicles: vehiclesAPI,
  billing: billingAPI,
  messages: messagesAPI,
  analytics: analyticsAPI,
};

