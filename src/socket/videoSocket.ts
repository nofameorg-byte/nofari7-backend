import { Server } from "socket.io";

interface Room {
  users: string[];
}

const rooms: Record<string, Room> = {};
const users: Record<string, string> = {};

export const initializeVideoSocket = (io: Server) => {
  io.on("connection", (socket) => {
    console.log("User connected:", socket.id);

    // REGISTER USER CODE
    socket.on("register-user", (code: string) => {
      users[code] = socket.id;
      console.log("Registered user:", code);
    });

    // CALL USER
    socket.on("call-user", ({ from, to }) => {
      const target = users[to];

      if (!target) {
        socket.emit("user-unavailable");
        return;
      }

      const roomId = `${from}-${to}-${Date.now()}`;

      rooms[roomId] = {
        users: [socket.id, target],
      };

      socket.join(roomId);
      io.sockets.sockets.get(target)?.join(roomId);

      io.to(target).emit("incoming-call", {
        from,
        roomId,
      });
    });

    // ACCEPT CALL
    socket.on("accept-call", ({ roomId }) => {
      io.to(roomId).emit("call-accepted", roomId);
    });

    // WEBRTC SIGNALING
    socket.on("signal", ({ roomId, data }) => {
      socket.to(roomId).emit("signal", data);
    });

    socket.on("disconnect", () => {
      console.log("User disconnected:", socket.id);

      for (const code in users) {
        if (users[code] === socket.id) {
          delete users[code];
        }
      }
    });
  });
};