🏠 SmartHome Control Center

Realtime IoT Dashboard built with:

Node.js + Express

Socket.io (WebSocket)

React + Vite

TanStack Query

Event-driven architecture

🚀 Project Goal

The goal of this project is to simulate and manage a multi-home IoT monitoring system in real-time.

It demonstrates:

Realtime WebSocket communication

REST + WebSocket synchronization

Multi-tenant architecture (multiple homes)

Alert system

Optimistic UI updates

Reconnect-safe socket handling

Manual cache control with React Query

🏗 Architecture Overview
1️⃣ Backend
Responsibilities:

Simulate sensors

Manage alarm logic

Generate alerts

Emit realtime updates via WebSocket

Provide REST snapshot

Technologies:

Express

Socket.io

In-memory state (current version)

Architecture:

REST:

GET /api/home/:id/state

WebSocket Events:

subscribe:home
unsubscribe:home
home:update
alert:new

Each home is isolated in its own Socket.io room:

home:123
home:456
2️⃣ Frontend
Responsibilities:

Fetch snapshot via REST

Subscribe to realtime updates

Synchronize cache with WebSocket events

Display sensors, charts and alerts

Handle alarm control with optimistic update

Technologies:

React

TanStack Query

Socket.io-client

Vite

🔄 Data Flow

Client fetches initial state via REST

Client subscribes to WebSocket room

Backend emits:

home:update

alert:new

Frontend updates React Query cache via setQueryData

UI re-renders automatically

⚡ Realtime Strategy

We use:

REST for initial snapshot

WebSocket for incremental updates

React Query as single source of truth

Manual cache updates instead of refetch

This prevents polling and ensures efficient updates.

🔔 Alert System

Alerts are generated server-side based on:

Temperature thresholds

Door open duration

Alarm trigger logic

Each home maintains its own alert list (max 20 stored).

🧠 Design Decisions

Why React Query instead of Redux?

Better async handling

Built-in caching

Easier manual cache control

Why WebSocket rooms?

Multi-tenant isolation

Prevent cross-home data mixing

Why optimistic updates?

Better UX for alarm toggle

Immediate feedback without waiting for server

🧪 Current Features

✔ Multi-home support
✔ Real-time sensor updates
✔ Alarm arm/disarm
✔ Optimistic update
✔ Alert system
✔ Sound alarm
✔ Live chart
✔ Reconnect-safe socket
✔ Room unsubscribe on home change

🔮 Future Improvements

Planned:

🔐 Authentication (JWT)

🗄 Database persistence (Mongo/Postgres)

📊 Historical data storage

📈 Real historical charts

🐳 Dockerization

☁ Deployment to VPS

🔐 WebSocket authentication handshake

🧑‍💼 Admin panel

🛠 Local Setup
Backend
cd server
npm install
npm run dev
Frontend
cd client
npm install
npm run dev
🌐 Environment Variables

Frontend .env:

VITE_API_URL=http://localhost:4000
VITE_WS_URL=http://localhost:4000

Backend:

PORT=4000
🧑‍💻 Author

Designed as a demonstration of:

Realtime architecture

Event-driven design

Modern frontend data synchronization