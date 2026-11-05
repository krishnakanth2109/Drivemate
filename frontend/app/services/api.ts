import { Platform } from "react-native";
import Constants from "expo-constants";
import { getAuthToken, saveAuthToken, saveUserProfile, clearAuthSession, StoredUserProfile } from "./storage";

// Helper to auto-detect dev server host IP (e.g. 192.168.0.123 or localhost)
const getDevHost = (): string | null => {
  try {
    if (Platform.OS === "web" && typeof window !== "undefined" && window.location?.hostname) {
      return window.location.hostname;
    }
    const hostUri =
      Constants.expoConfig?.hostUri ||
      (Constants as any).manifest2?.extra?.expoClient?.hostUri ||
      (Constants as any).manifest?.debuggerHost;
    if (hostUri) {
      return hostUri.split(":")[0];
    }
  } catch {
    // ignore
  }
  return null;
};

// Build candidate base URLs in priority order for robust multi-device reachability
const getCandidateBaseUrls = (): string[] => {
  const list: string[] = [];
  const devHost = getDevHost();

  // 1. Dev Host IP from Expo / Browser if available
  if (devHost) {
    list.push(`http://${devHost}:5000/api`);
  }

  // 2. Explicit .env variable if provided
  const envUrl = process.env.EXPO_PUBLIC_API_URL || process.env.EXPO_PUBLIC_SERVER_URL;
  if (envUrl && envUrl.trim().length > 0) {
    const trimmed = envUrl.trim().replace(/\/+$/, "");
    const formatted = trimmed.endsWith("/api") ? trimmed : `${trimmed}/api`;
    if (!list.includes(formatted)) {
      list.push(formatted);
    }
  }

  // 3. Known LAN IP fallback
  const lanUrl = "http://192.168.0.123:5000/api";
  if (!list.includes(lanUrl)) {
    list.push(lanUrl);
  }

  // 4. Android emulator special alias
  if (Platform.OS === "android" && !list.includes("http://10.0.2.2:5000/api")) {
    list.push("http://10.0.2.2:5000/api");
  }

  // 5. Standard localhost
  if (!list.includes("http://localhost:5000/api")) {
    list.push("http://localhost:5000/api");
  }

  return list;
};

// Active working base URL (cached once confirmed)
let activeBaseUrl = getCandidateBaseUrls()[0];

export const getActiveBaseUrl = () => activeBaseUrl;
export const API_BASE_URL = activeBaseUrl;

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
 * Centralized fetch helper with automatic multi-host candidate fallback & Bearer token injection
 */
async function request<T = any>(endpoint: string, options: RequestOptions = {}): Promise<ApiResponse<T>> {
  const { requiresAuth = true, headers = {}, ...rest } = options;
  const cleanEndpoint = endpoint.startsWith("/") ? endpoint : `/${endpoint}`;

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

  const method = (options.method || "GET").toUpperCase();
  let parsedBody: any = undefined;
  if (rest.body && typeof rest.body === "string") {
    try {
      parsedBody = JSON.parse(rest.body);
    } catch {
      parsedBody = rest.body;
    }
  }

  const candidates = [activeBaseUrl, ...getCandidateBaseUrls().filter((u) => u !== activeBaseUrl)];
  let lastError: any = null;

  console.log(`📡 [API 📤 OUTGOING] ${method} ${cleanEndpoint}`, {
    method,
    endpoint: cleanEndpoint,
    requiresAuth,
    payload: parsedBody,
    activeHost: activeBaseUrl,
  });

  const startTime = Date.now();

  for (const candidateBase of candidates) {
    const targetUrl = `${candidateBase}${cleanEndpoint}`;
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 6000);

      const response = await fetch(targetUrl, {
        ...rest,
        headers: requestHeaders,
        signal: controller.signal,
      });

      clearTimeout(timeoutId);
      const durationMs = Date.now() - startTime;

      // Successfully contacted server! Remember working base URL for subsequent calls
      activeBaseUrl = candidateBase;

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        console.error(`❌ [API 📥 ERROR ${response.status}] ${method} ${cleanEndpoint} (${durationMs}ms):`, {
          status: response.status,
          targetUrl,
          responseBody: data,
        });

        return {
          success: false,
          error: data.error || `Server responded with status ${response.status}`,
          ...data,
        };
      }

      console.log(`✅ [API 📥 SUCCESS ${response.status}] ${method} ${cleanEndpoint} (${durationMs}ms):`, {
        status: response.status,
        url: targetUrl,
        responseBody: data,
      });

      return {
        success: true,
        ...data,
      };
    } catch (err: any) {
      lastError = err;
      console.warn(`⚠️ [API 🔄 RETRY CANDIDATE] Candidate ${candidateBase} failed: ${err.message}. Trying next candidate...`);
      continue;
    }
  }

  if (lastError?.name === "AbortError") {
    console.error(`💥 [API ⏱️ TIMEOUT] ${method} ${cleanEndpoint} timed out after 6000ms`);
    return {
      success: false,
      error: "Network request timed out. Please verify backend server is running on port 5000.",
    };
  }

  console.error(`💥 [API 🚫 UNREACHABLE] Could not reach backend server on any candidate:`, {
    endpoint: cleanEndpoint,
    triedCandidates: candidates,
    lastError: lastError?.message || lastError,
  });

  return {
    success: false,
    error: `Could not reach backend server on port 5000 (${candidates.join(", ")}). Please ensure backend is running with 'npm start'.`,
  };
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

export interface DriverProfile {
  uid: string;
  fullName: string;
  username: string;
  email: string;
  location: string;
  drivingStyle: string;
  vehicleName: string;
  connectionStatus?: "none" | "pending" | "accepted" | "declined";
  connectionRequestId?: string;
  isSender?: boolean;
}

export interface ConnectionRequestItem {
  id: string;
  fromUserId: string;
  fromUserName: string;
  fromUserTag: string;
  toUserId: string;
  toUserName: string;
  toUserTag: string;
  status: "pending" | "accepted" | "declined";
  roomId: string;
  createdAt: string;
}

export interface ConversationItem {
  id: string;
  roomId: string;
  name: string;
  tag: string;
  partnerId?: string;
  isGroup: boolean;
  lastMessage: string;
  lastTime: string;
  unreadCount: number;
}

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

  async getDrivers() {
    return await request<{ drivers: DriverProfile[] }>("/messages/drivers", {
      method: "GET",
      requiresAuth: true,
    });
  },

  async getRequests() {
    return await request<{ incoming: ConnectionRequestItem[]; outgoing: ConnectionRequestItem[] }>(
      "/messages/requests",
      {
        method: "GET",
        requiresAuth: true,
      }
    );
  },

  async sendRequest(targetUserId: string) {
    return await request<{ connection: ConnectionRequestItem; message: string }>(
      "/messages/requests/send",
      {
        method: "POST",
        requiresAuth: true,
        body: JSON.stringify({ targetUserId }),
      }
    );
  },

  async respondRequest(requestId: string, action: "accept" | "decline") {
    return await request<{ connection: ConnectionRequestItem; message: string }>(
      "/messages/requests/respond",
      {
        method: "POST",
        requiresAuth: true,
        body: JSON.stringify({ requestId, action }),
      }
    );
  },

  async getConversations() {
    return await request<{ conversations: ConversationItem[] }>("/messages/conversations", {
      method: "GET",
      requiresAuth: true,
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

