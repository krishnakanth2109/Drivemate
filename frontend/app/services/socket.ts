import { io, Socket } from "socket.io-client";
import { getActiveBaseUrl } from "./api";

let socket: Socket | null = null;

export const getSocketUrl = (): string => {
  const apiBase = getActiveBaseUrl();
  return apiBase.replace(/\/api\/?$/, "");
};

export function getSocket(): Socket {
  if (!socket) {
    const socketUrl = getSocketUrl();
    console.log("🔌 [Socket.io Client] Connecting to:", socketUrl);

    socket = io(socketUrl, {
      transports: ["websocket", "polling"],
      autoConnect: true,
      reconnectionAttempts: 30, // 30 attempts to reliably connect while Render wakes from sleep
      reconnectionDelay: 2000,
      timeout: 60000, // 60s socket connection timeout matching API layer
    });

    socket.on("connect", () => {
      console.log("🔌 [Socket.io Client] Connected successfully with ID:", socket?.id);
    });

    socket.onAny((event, ...args) => {
      console.log(`🔌 [Socket.io 📥 ${event}] Payload:`, args.length === 1 ? args[0] : args);
    });

    socket.on("disconnect", (reason) => {
      console.log("🔌 [Socket.io Client] Disconnected:", reason);
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

