🏠 SmartHome Control Center

Realtime IoT Dashboard built with:

Node.js + Express

Socket.io (WebSocket)

React + Vite

TanStack Query

🎯 Project Goal

SmartHome Control Center simulates a multi-home IoT monitoring system.

The goal of this project is to demonstrate:

Realtime communication using WebSockets

REST + WebSocket synchronization

Multi-tenant architecture (multiple homes)

Server-side alert system

Optimistic UI updates

Manual cache synchronization with React Query

This project focuses on architecture and data flow, not just UI.

🏗 System Architecture
Backend

Responsibilities:

Simulate IoT sensors

Manage alarm logic

Generate alerts

Emit realtime updates

Provide REST snapshot endpoint

REST Endpoint

GET /api/home/:id/state

Returns current snapshot of selected home.

WebSocket Events

Client → Server:

subscribe:home

unsubscribe:home

Server → Client:

home:update

alert:new

Each home uses a dedicated Socket.io room:

home:123

home:456

This prevents cross-home data mixing.

Frontend

Responsibilities:

Fetch initial state via REST

Subscribe to WebSocket room

Synchronize data using React Query cache

Display sensors, alerts, and live charts

Handle alarm control (optimistic updates)

Technologies:

React

TanStack Query

Socket.io client

Vite

🔄 Data Flow

Client fetches initial snapshot via REST.

Client subscribes to WebSocket room.

Backend emits updates (home:update, alert:new).

Frontend updates React Query cache using setQueryData.

UI re-renders automatically.

No polling is used.

⚡ Realtime Strategy

We use:

REST for initial data

WebSocket for incremental updates

React Query as single source of truth

Manual cache updates instead of refetching

This ensures efficient, event-driven updates.

🔔 Alert System

Alerts are generated server-side based on:

Temperature thresholds

Door open duration

Alarm trigger logic

Each home stores a maximum of 20 alerts.

✅ Implemented Features

Multi-home support

Realtime sensor updates

Alarm arm/disarm

Optimistic updates

Alert feed

Sound alarm notification

Live chart visualization

Reconnect-safe WebSocket handling

Room-based subscription system

🔮 Planned Improvements

Authentication (JWT)

Database persistence (MongoDB / PostgreSQL)

Historical data storage

Docker setup

VPS deployment

WebSocket authentication handshake

Admin panel

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

Frontend .env

VITE_API_URL=http://localhost:4000
VITE_WS_URL=http://localhost:4000

Backend

PORT=4000
🧠 Design Philosophy

This project was built to demonstrate:

Event-driven architecture

Proper separation of REST and realtime layers

Cache synchronization strategy

Multi-tenant room isolation

Production-oriented thinking

📌 Author

Designed as a demonstration of realtime system architecture using modern web technologies.