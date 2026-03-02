import { Server } from "socket.io";

interface Room {
  users: string[];
}

const rooms: Record<string, Room> = {};

export const initializeVideoSocket = (io: Server) => {
  io.on("connection", (socket) => {
    console.log("User connected:", socket.id);

    socket.on("create-room", (roomId: string) => {
      rooms[roomId] = { users: [socket.id] };
      socket.join(roomId);
      socket.emit("room-created", roomId);
    });

    socket.on("join-room", (roomId: string) => {
      const room = rooms[roomId];
      if (room && room.users.length === 1) {
        room.users.push(socket.id);
        socket.join(roomId);
        socket.to(roomId).emit("user-joined");
      } else {
        socket.emit("room-full");
      }
    });

    socket.on("signal", ({ roomId, data }) => {
      socket.to(roomId).emit("signal", data);
    });

    socket.on("disconnect", () => {
      console.log("User disconnected:", socket.id);
    });
  });
};