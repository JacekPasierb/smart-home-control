import http from "http";
import app from "./app";
import {startSimulator, getHomeState} from "./store/homeStore";
import {Server} from "socket.io";

const PORT = process.env.PORT ? Number(process.env.PORT) : 4000;

const httpServer = http.createServer(app);

const io = new Server(httpServer, {
  cors: {origin: "http://localhost:5173"},
});

io.on("connection", (socket) => {
  socket.on("subscribe:home", (homeId: string) => {
    socket.join(`home:${homeId}`);

    // opcjonalnie: wyślij snapshot zaraz po subskrypcji
    socket.emit("home:update", getHomeState(homeId));
  });
  socket.on("unsubscribe:home", (homeId: string) => {
    socket.leave(`home:${homeId}`);
  });
});

startSimulator(
  (homeId) => {
    io.to(`home:${homeId}`).emit("home:update", getHomeState(homeId));
  },
  (homeId, alert) => {
    io.to(`home:${homeId}`).emit("alert:new", {homeId, alert});
  }
);

httpServer.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
