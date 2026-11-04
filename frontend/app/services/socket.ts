import { io, Socket } from "socket.io-client";
import { Platform } from "react-native";

let socket: Socket | null = null;

export const getSocketUrl = (): string => {
  const envUrl = process.env.EXPO_PUBLIC_BACKEND_URL || process.env.EXPO_PUBLIC_API_URL;
  if (envUrl && envUrl.trim().length > 0) {
    let clean = envUrl.trim().replace(/\/api\/?$/, "").replace(/\/+$/, "");
    if (Platform.OS === "android" && clean.includes("localhost")) {
      clean = clean.replace("localhost", "10.0.2.2");
    }
    return clean;
  }
  return Platform.OS === "android" ? "http://10.0.2.2:5000" : "http://localhost:5000";
};

export function getSocket(): Socket {
  if (!socket) {
    const socketUrl = getSocketUrl();
    console.log("🔌 [Socket.io Client] Connecting to:", socketUrl);

    socket = io(socketUrl, {
      transports: ["websocket", "polling"],
      autoConnect: true,
      reconnectionAttempts: 10,
      reconnectionDelay: 1000,
    });

    socket.on("connect", () => {
      console.log("🔌 [Socket.io Client] Connected successfully with ID:", socket?.id);
    });

    socket.on("connect_error", (err) => {
      console.warn("🔌 [Socket.io Client] Connection note:", err.message);
    });
  }

  return socket;
}

export function disconnectSocket() {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
}

export default {
  getSocket,
  disconnectSocket,
  getSocketUrl,
};

