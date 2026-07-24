# TriForge realtime server (scaffold)

Standalone Fastify + Socket.io service for pushing chat messages to clients
in real time, deployed separately from the Next.js app (Railway, per
`CLAUDE.md`) since Vercel serverless functions can't hold long-lived
WebSocket connections.

**Status: scaffold, not wired up yet.** The chat feature in the main app
(`app/(community)`) works today via polling — see
`app/api/channels/[channelId]/messages/route.ts`. This service is a drop-in
upgrade path: swap the client's polling loop (`components/chat/ChatView.tsx`)
for a socket subscription once this is deployed, no schema changes needed.

## Design

- This service owns **no data**. Postgres, via the Next.js app, stays the
  single source of truth for channels/messages (matches the modular-monolith
  decision in `CLAUDE.md` — no separate database for chat).
- Next.js persists a message (`POST /api/channels/:id/messages`), then calls
  `POST /internal/channels/:id/broadcast` on this service with the saved
  message. This service fans it out to everyone in that channel's Socket.io
  room. It never reads/writes Postgres itself.
- Clients connect, authenticate (see TODO below), and `channel:join` the
  rooms for channels they can see; they receive `message:new` events.

## Not production-ready — TODO before deploying

1. **Auth**: `socket.handshake.auth` is trusted as-is right now. Replace with
   real verification of the Auth.js session/JWT, and only allow joining a
   channel's room if the user's role meets `Channel.minRole` (mirror the
   logic in `lib/rbac.ts`).
2. **Internal broadcast auth**: the shared-secret header
   (`INTERNAL_BROADCAST_SECRET`) is a placeholder. Use a private network,
   mTLS, or signed requests between the two Railway services instead.
3. **Horizontal scaling**: this runs as a single instance. For >1 instance,
   add the Redis Socket.io adapter (`@socket.io/redis-adapter` + `redis`,
   already noted as a Railway addon in `CLAUDE.md`) — see the commented-out
   block in `src/index.ts`.

## Local dev

```bash
cd server
npm install
cp .env.example .env
npm run dev
```
