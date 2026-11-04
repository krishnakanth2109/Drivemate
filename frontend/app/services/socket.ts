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

