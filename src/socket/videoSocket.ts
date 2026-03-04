import { Server } from "socket.io";

interface Room {
  users: string[];
}

const rooms: Record<string, Room> = {};
const users: Record<string, string> = {};

export const initializeVideoSocket = (io: Server) => {
  io.on("connection", (socket) => {
    console.log("User connected:", socket.id);

    socket.on("register-user", (code: string) => {
      users[code] = socket.id;
      console.log("User registered:", code);
    });

    socket.on("call-user", (targetCode: string) => {
      const targetSocket = users[targetCode];

      if (!targetSocket) {
        socket.emit("user-offline");
        return;
      }

      const roomId = `${socket.id}-${targetSocket}`;

      rooms[roomId] = { users: [socket.id, targetSocket] };

      socket.join(roomId);
      io.sockets.sockets.get(targetSocket)?.join(roomId);

      io.to(roomId).emit("user-joined");
    });

    socket.on("create-room", (roomId: string) => {
      const room = rooms[roomId];

      if (room) {
        socket.emit("room-exists", roomId);
        return;
      }

      rooms[roomId] = { users: [socket.id] };
      socket.join(roomId);

      socket.emit("room-created", roomId);
    });

    socket.on("join-room", (roomId: string) => {
      const room = rooms[roomId];

      if (!room) {
        socket.emit("room-not-found");
        return;
      }

      if (room.users.length >= 2) {
        socket.emit("room-full");
        return;
      }

      room.users.push(socket.id);
      socket.join(roomId);

      socket.to(roomId).emit("user-joined");
    });

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

      for (const roomId in rooms) {
        const room = rooms[roomId];
        room.users = room.users.filter((id) => id !== socket.id);

        if (room.users.length === 0) {
          delete rooms[roomId];
        }
      }
    });
  });
};