import Fastify from "fastify";
import cors from "@fastify/cors";
import { Server as SocketIOServer } from "socket.io";

/**
 * TriForge Community — real-time chat relay (scaffold).
 *
 * This service does NOT own any data: Postgres (via the Next.js app's API
 * routes) remains the single source of truth for channels/messages, matching
 * the modular-monolith decision in CLAUDE.md. This process's only job is to
 * push already-persisted messages to connected clients over WebSockets so
 * the chat UI doesn't have to rely on polling.
 *
 * Today (MVP1), the Next.js app's chat at app/(community) works standalone
 * via polling — see app/api/channels/[channelId]/messages/route.ts. Swapping
 * in this service is a drop-in upgrade for the client (subscribe to socket
 * events instead of polling) with no schema changes required.
 *
 * NOT production-ready yet:
 *  - Socket auth below is a placeholder (trusts a userId/role passed in the
 *    handshake). Replace with real Auth.js session/JWT verification before
 *    deploying.
 *  - Runs as a single instance. For >1 instance on Railway, add the Redis
 *    Socket.io adapter (`@socket.io/redis-adapter` + `redis`) so broadcasts
 *    fan out across all instances — see CLAUDE.md's "Realtime scaling" note.
 */

const PORT = Number(process.env.PORT ?? 4001);
const APP_ORIGIN = process.env.APP_ORIGIN ?? "http://localhost:3000";
const INTERNAL_BROADCAST_SECRET = process.env.INTERNAL_BROADCAST_SECRET ?? "dev-only-secret";

const app = Fastify({ logger: true });

await app.register(cors, { origin: APP_ORIGIN, credentials: true });

app.get("/healthz", async () => ({ ok: true }));

/**
 * Called by the Next.js app (server-side, after it persists a message to
 * Postgres in app/api/channels/[channelId]/messages/route.ts) to fan the
 * message out to everyone currently connected to that channel's room.
 *
 * TODO: swap the shared-secret header for something stronger (mTLS, signed
 * request, or a private network) once this is actually deployed.
 */
app.post<{ Params: { channelId: string }; Body: unknown }>(
  "/internal/channels/:channelId/broadcast",
  async (req, reply) => {
    if (req.headers["x-internal-secret"] !== INTERNAL_BROADCAST_SECRET) {
      return reply.code(401).send({ error: "unauthorized" });
    }
    io.to(roomForChannel(req.params.channelId)).emit("message:new", req.body);
    return { ok: true };
  }
);

function roomForChannel(channelId: string) {
  return `channel:${channelId}`;
}

const httpServer = app.server;
const io = new SocketIOServer(httpServer, {
  cors: { origin: APP_ORIGIN, credentials: true },
});

// TODO: for multi-instance deployments, wire up the Redis adapter here:
//   import { createAdapter } from "@socket.io/redis-adapter";
//   import { createClient } from "redis";
//   const pubClient = createClient({ url: process.env.REDIS_URL });
//   const subClient = pubClient.duplicate();
//   await Promise.all([pubClient.connect(), subClient.connect()]);
//   io.adapter(createAdapter(pubClient, subClient));

io.on("connection", (socket) => {
  // TODO: replace with real auth — verify the Auth.js session/JWT passed in
  // socket.handshake.auth, look up the user's role, and only let them join
  // rooms for channels whose minRole they meet (mirror lib/rbac.ts).
  const userId = socket.handshake.auth?.userId as string | undefined;
  app.log.info({ userId, socketId: socket.id }, "socket connected");

  socket.on("channel:join", (channelId: string) => {
    socket.join(roomForChannel(channelId));
  });

  socket.on("channel:leave", (channelId: string) => {
    socket.leave(roomForChannel(channelId));
  });

  socket.on("disconnect", () => {
    app.log.info({ userId, socketId: socket.id }, "socket disconnected");
  });
});

app
  .listen({ port: PORT, host: "0.0.0.0" })
  .then(() => app.log.info(`realtime server listening on :${PORT}`))
  .catch((err) => {
    app.log.error(err);
    process.exit(1);
  });
