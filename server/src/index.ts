import "dotenv/config";
import http from "http";
import app from "./app";
import {startSimulator, getHomeState} from "./store/homeStore";
import {Server} from "socket.io";
import jwt from "jsonwebtoken";
import type { Role } from "./auth/homeAccess";
import { canAccessHome } from "./auth/homeAccess";

const PORT = process.env.PORT ? Number(process.env.PORT) : 4000;

const httpServer = http.createServer(app);

const io = new Server(httpServer, {
  cors: {origin: "http://localhost:5173"},
});

io.use((socket, next) => {
  try {
    const token = socket.handshake.auth?.token as string | undefined;
    if (!token) return next(new Error("UNAUTHORIZED"));

    const payload = jwt.verify(token, process.env.JWT_SECRET as string) as {
      sub: string;
      role: Role;
    };

    // zapisujemy usera na socket (przyda się w kolejnym kroku: room authorization)
    (socket as any).user = {id: payload.sub, role: payload.role};

    return next();
  } catch {
    return next(new Error("UNAUTHORIZED"));
  }
});

io.on("connection", (socket) => {
  socket.on("subscribe:home", (homeId: string) => {
     const user = (socket as any).user as
       | {id: string; role: "user" | "admin"}
      | undefined;
    
     if (!user || !canAccessHome(user, homeId)) {
       socket.emit("home:forbidden", {homeId});
       return;
    }
    socket.join(`home:${homeId}`);
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
