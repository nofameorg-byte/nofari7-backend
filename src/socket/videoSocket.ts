import { Server } from "socket.io";

interface Room {
  users: string[];
}

const rooms: Record<string, Room> = {};
const userSockets: Record<string, string> = {};

export const initializeVideoSocket = (io: Server) => {
  io.on("connection", (socket) => {
    console.log("User connected:", socket.id);

    socket.on("register-user", (code: string) => {
      userSockets[code] = socket.id;
      console.log("Registered user:", code);
    });

    socket.on("call-user", ({ from, to }) => {
      const targetSocket = userSockets[to];

      if (!targetSocket) {
        socket.emit("user-offline");
        return;
      }

      const roomId = `${from}-${to}`;

      rooms[roomId] = { users: [socket.id, targetSocket] };

      socket.join(roomId);
      io.sockets.sockets.get(targetSocket)?.join(roomId);

      io.to(targetSocket).emit("incoming-call", {
        from,
        roomId,
      });
    });

    socket.on("accept-call", ({ roomId }) => {
      socket.join(roomId);
      io.to(roomId).emit("user-joined");
    });

    socket.on("signal", ({ roomId, data }) => {
      socket.to(roomId).emit("signal", data);
    });

    socket.on("disconnect", () => {
      for (const code in userSockets) {
        if (userSockets[code] === socket.id) {
          delete userSockets[code];
        }
      }
    });
  });
};