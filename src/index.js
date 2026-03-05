import express from "express";
import http from "http";
import { Server } from "socket.io";
import { createClient } from "@supabase/supabase-js";

const app = express();
app.use(express.json());

const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

/*
=================================
 BASIC SERVER ROUTE
=================================
*/

app.get("/", (req, res) => {
  res.send("NOFARI backend running");
});

/*
=================================
 SUPABASE
=================================
*/

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

/*
=================================
 SOCKET CONNECTION (SAFE)
=================================
*/

io.on("connection", (socket) => {

  console.log("User connected:", socket.id);

  socket.on("disconnect", () => {
    console.log("User disconnected:", socket.id);
  });

});

/*
=================================
 SERVER START
=================================
*/

const PORT = process.env.PORT || 10000;

server.listen(PORT, () => {
  console.log(`NOFARI backend running on port ${PORT}`);
});