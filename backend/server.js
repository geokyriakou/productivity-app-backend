const express = require("express");
const dotenv = require("dotenv").config();
const colors = require("colors");
const port = process.env.PORT || 5000;
const connectDB = require("./config/db");
const http = require("http"); // access directly for socket io
const cors = require("cors");
const { errorHandler } = require("./middleware/errorMiddleware");

connectDB();

const app = express();

app.use(cors());
app.use(express.json());
app.use(express.urlencoded());

app.use("/api/users", require("./routes/userRouter"));
app.use("/api/tasks", require("./routes/taskRouter"));
app.use("/api/rooms", require("./routes/roomRouter"));
app.use("/api/leaderboard", require("./routes/leaderboardRouter"));

app.use(errorHandler);

const server = http.createServer(app);

server.listen(port, () => {
  console.log(`Server started on port ${port}`);
});

const { Server } = require("socket.io");

const io = new Server(server, {
  cors: {
    origin: "https://pomoshare.onrender.com",
  },
});

io.on("connection", (socket) => {
  socket.on("new-user", (room, name) => {
    socket.join(room);
    socket.to(room).emit("user-connected", name);
    socket.on("update-timer", (newSeconds, newType, newPlaying) => {
      socket.to(room).emit("timer", newSeconds, newType, newPlaying);
    });
    console.log(`Joined ${room} with name ${name}`);
  });

  socket.on("send-message", (message, room) => {
    const name = socket.handshake.query.username;
    socket.to(room).emit("receive-message", message, name); //broadcast is assumed
  });

  socket.on("disconnect-user", (room) => {
    const name = socket.handshake.query.username;
    socket.to(room).emit("user-disconnected", name);
    console.log(`left ${room} with name ${name}`);
  });

  socket.on("settings-change", (room, setting, value) => {
    const name = socket.handshake.query.username;
    socket.to(room).emit("changed-room", setting, value, name);
    console.log(`${setting} ${value} ${name}`);
  });

  socket.on("play-pause", (room, play) => {
    socket.to(room).emit("new-isPlaying", play);
  });
});
