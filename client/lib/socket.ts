import { io, Socket } from "socket.io-client";

let socket: Socket | null = null;

export const getSocket = (): Socket => {
  if (!socket) {
    const url =
      typeof window !== "undefined"
        ? process.env.NEXT_PUBLIC_APP_URL || window.location.origin
        : process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

    socket = io(url, {
      transports: ["websocket", "polling"],
      reconnectionAttempts: 3,
      reconnectionDelay: 2000,
      autoConnect: typeof window !== "undefined",
    });

    socket.on("connect_error", (err) => {
      console.warn("[Socket] Connection notice:", err.message);
    });
  }
  return socket;
};
