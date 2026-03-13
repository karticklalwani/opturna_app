import { Hono } from "hono";
import { prisma } from "../prisma";
import { endStream } from "../live-ws";

type Variables = {
  user: { id: string; name: string; email: string; image?: string | null } | null;
  session: unknown | null;
};

const liveRouter = new Hono<{ Variables: Variables }>();

// GET /api/live - Get all currently live streams
liveRouter.get("/", async (c) => {
  const streams = await prisma.liveStream.findMany({
    where: { status: "live" },
    include: {
      user: {
        select: {
          id: true,
          name: true,
          image: true,
          username: true,
          isVerified: true,
          role: true,
        },
      },
      _count: { select: { liveViewers: true, liveMessages: true } },
    },
    orderBy: { startedAt: "desc" },
  });
  return c.json({ data: streams });
});

// POST /api/live - Start a new live stream
liveRouter.post("/", async (c) => {
  const session = c.get("session");
  const user = c.get("user");
  if (!session || !user) {
    return c.json({ error: { message: "Unauthorized" } }, 401);
  }

  const body = (await c.req.json()) as {
    title: string;
    category?: string;
    thumbnailUrl?: string;
  };

  // End any existing live streams for this user
  await prisma.liveStream.updateMany({
    where: { userId: user.id, status: "live" },
    data: { status: "ended", endedAt: new Date() },
  });

  const stream = await prisma.liveStream.create({
    data: {
      userId: user.id,
      title: body.title,
      category: body.category || "general",
      thumbnailUrl: body.thumbnailUrl,
      status: "live",
    },
    include: {
      user: {
        select: {
          id: true,
          name: true,
          image: true,
          username: true,
          isVerified: true,
        },
      },
    },
  });

  return c.json({ data: stream }, 201);
});

// GET /api/live/:id - Get specific live stream details
liveRouter.get("/:id", async (c) => {
  const streamId = c.req.param("id");
  const stream = await prisma.liveStream.findUnique({
    where: { id: streamId },
    include: {
      user: {
        select: {
          id: true,
          name: true,
          image: true,
          username: true,
          isVerified: true,
          role: true,
        },
      },
      _count: { select: { liveViewers: true, liveMessages: true } },
    },
  });
  if (!stream) return c.json({ error: { message: "Stream not found" } }, 404);
  return c.json({ data: stream });
});

// PATCH /api/live/:id/end - End a live stream
liveRouter.patch("/:id/end", async (c) => {
  const session = c.get("session");
  const user = c.get("user");
  if (!session || !user) {
    return c.json({ error: { message: "Unauthorized" } }, 401);
  }

  const streamId = c.req.param("id");
  const stream = await prisma.liveStream.findUnique({
    where: { id: streamId },
  });

  if (!stream) return c.json({ error: { message: "Stream not found" } }, 404);
  if (stream.userId !== user.id) {
    return c.json({ error: { message: "Forbidden" } }, 403);
  }

  const updated = await prisma.liveStream.update({
    where: { id: streamId },
    data: { status: "ended", endedAt: new Date() },
  });

  // Broadcast stream ended to all WebSocket clients
  endStream(streamId);

  return c.json({ data: updated });
});

// GET /api/live/:id/messages - Get last 50 messages
liveRouter.get("/:id/messages", async (c) => {
  const streamId = c.req.param("id");
  const messages = await prisma.liveMessage.findMany({
    where: { streamId },
    include: {
      user: {
        select: {
          id: true,
          name: true,
          image: true,
          username: true,
        },
      },
    },
    orderBy: { createdAt: "desc" },
    take: 50,
  });
  // Return in chronological order
  return c.json({ data: messages.reverse() });
});

// POST /api/live/:id/messages - Post a message to a stream
liveRouter.post("/:id/messages", async (c) => {
  const session = c.get("session");
  const user = c.get("user");
  if (!session || !user) {
    return c.json({ error: { message: "Unauthorized" } }, 401);
  }

  const streamId = c.req.param("id");
  const stream = await prisma.liveStream.findUnique({
    where: { id: streamId },
  });
  if (!stream) return c.json({ error: { message: "Stream not found" } }, 404);
  if (stream.status !== "live") {
    return c.json({ error: { message: "Stream has ended" } }, 400);
  }

  const body = (await c.req.json()) as { content: string };
  const message = await prisma.liveMessage.create({
    data: {
      streamId,
      userId: user.id,
      content: body.content,
    },
    include: {
      user: {
        select: {
          id: true,
          name: true,
          image: true,
          username: true,
        },
      },
    },
  });

  return c.json({ data: message }, 201);
});

// POST /api/live/:id/join - Join a stream as viewer
liveRouter.post("/:id/join", async (c) => {
  const session = c.get("session");
  const user = c.get("user");
  if (!session || !user) {
    return c.json({ error: { message: "Unauthorized" } }, 401);
  }

  const streamId = c.req.param("id");
  const stream = await prisma.liveStream.findUnique({
    where: { id: streamId },
  });
  if (!stream) return c.json({ error: { message: "Stream not found" } }, 404);

  // Upsert viewer record
  await prisma.liveViewer.upsert({
    where: { streamId_userId: { streamId, userId: user.id } },
    create: { streamId, userId: user.id },
    update: { joinedAt: new Date() },
  });

  // Update viewer count
  const viewerCount = await prisma.liveViewer.count({ where: { streamId } });
  await prisma.liveStream.update({
    where: { id: streamId },
    data: {
      viewerCount,
      peakViewers: { set: Math.max(stream.peakViewers, viewerCount) },
    },
  });

  return c.json({ data: { joined: true, viewerCount } });
});

// POST /api/live/:id/leave - Leave a stream as viewer
liveRouter.post("/:id/leave", async (c) => {
  const session = c.get("session");
  const user = c.get("user");
  if (!session || !user) {
    return c.json({ error: { message: "Unauthorized" } }, 401);
  }

  const streamId = c.req.param("id");

  await prisma.liveViewer.deleteMany({
    where: { streamId, userId: user.id },
  });

  const viewerCount = await prisma.liveViewer.count({ where: { streamId } });
  await prisma.liveStream.updateMany({
    where: { id: streamId },
    data: { viewerCount },
  });

  return c.json({ data: { left: true, viewerCount } });
});

export { liveRouter };
