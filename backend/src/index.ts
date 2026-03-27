import "@vibecodeapp/proxy"; // DO NOT REMOVE OTHERWISE VIBECODE PROXY WILL NOT WORK
import { Hono } from "hono";
import { cors } from "hono/cors";
import { auth } from "./auth";
import { prisma } from "./prisma";
import { env } from "./env";
import { liveRouter } from "./routes/live";
import tasks from "./routes/tasks";
import habits from "./routes/habits";
import projects from "./routes/projects";
import financeToolsRouter from "./routes/finance-tools";
import { signalsRouter } from "./routes/signals";
import contentRouter from "./routes/content";
import researchRouter from "./routes/research";
import inflationRouter from "./routes/inflation";
import advancedFinanceRouter from "./routes/advanced-finance";
import journal from "./routes/journal";
import lifeGoals from "./routes/life-goals";
import { creatorsRouter } from "./routes/creators";
import { mediaRouter } from "./routes/media";
import { joinRoom, leaveRoom, broadcastToRoom } from "./live-ws";
import { joinChatRoom, leaveChatRoom, broadcastToChatRoom, broadcastNewMessage } from "./chat-ws";
import type { ChatWSClient } from "./chat-ws";

type Variables = {
  user: typeof auth.$Infer.Session.user | null;
  session: typeof auth.$Infer.Session.session | null;
};

const app = new Hono<{ Variables: Variables }>();

// ─── Rate Limiter ───────────────────────────────────────────────────────────
const rateLimitMap = new Map<string, { count: number; resetAt: number }>();

function rateLimit(key: string, maxRequests: number, windowMs: number): boolean {
  const now = Date.now();
  const entry = rateLimitMap.get(key);
  if (!entry || now > entry.resetAt) {
    rateLimitMap.set(key, { count: 1, resetAt: now + windowMs });
    return true; // allowed
  }
  if (entry.count >= maxRequests) return false; // blocked
  entry.count++;
  return true;
}

// Clean up old entries every 5 minutes
setInterval(() => {
  const now = Date.now();
  for (const [key, entry] of rateLimitMap.entries()) {
    if (now > entry.resetAt) rateLimitMap.delete(key);
  }
}, 5 * 60 * 1000);

// ─── Input Sanitization Helper ───────────────────────────────────────────────
function sanitizeString(val: unknown, maxLen: number): string | undefined {
  if (typeof val !== "string") return undefined;
  return val.trim().slice(0, maxLen);
}

// CORS
app.use("*", cors({
  origin: (origin) => {
    if (!origin) return origin;
    if (
      /^https:\/\/[a-zA-Z0-9-]+\.vibecode\.run$/.test(origin) ||
      /^https:\/\/[a-zA-Z0-9-]+\.vibecodeapp\.com$/.test(origin) ||
      /^https:\/\/[a-zA-Z0-9-]+\.vibecode\.dev$/.test(origin) ||
      origin === "https://vibecode.dev" ||
      origin.startsWith("http://localhost:") ||
      origin.startsWith("http://127.0.0.1:")
    ) return origin;
    return null; // Block unknown origins
  },
  credentials: true,
  allowHeaders: ["Content-Type", "Authorization"],
  allowMethods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
}));

// Serve uploaded media files
app.get("/uploads/*", async (c) => {
  const filePath = c.req.path.slice(9); // Remove "/uploads/"
  const fullPath = `/home/user/workspace/backend/uploads/${filePath}`;
  try {
    const file = Bun.file(fullPath);
    const exists = await file.exists();
    if (!exists) return c.json({ error: { message: "File not found" } }, 404);
    const ab = await file.arrayBuffer();
    return new Response(ab, {
      headers: {
        "Content-Type": file.type || "application/octet-stream",
        "Cache-Control": "public, max-age=31536000",
      },
    });
  } catch {
    return c.json({ error: { message: "File not found" } }, 404);
  }
});

// Rate limiting middleware
app.use("*", async (c, next) => {
  const ip = c.req.header("x-forwarded-for") ?? c.req.header("x-real-ip") ?? "unknown";
  const path = c.req.path;

  // Strict limit for auth endpoints (10 requests per minute)
  if (path.startsWith("/api/auth/")) {
    if (!rateLimit(`auth:${ip}`, 10, 60_000)) {
      return c.json({ error: { message: "Demasiados intentos. Espera un minuto." } }, 429);
    }
  }

  // General API limit (200 requests per minute)
  if (path.startsWith("/api/")) {
    if (!rateLimit(`api:${ip}`, 200, 60_000)) {
      return c.json({ error: { message: "Demasiadas peticiones. Intenta más tarde." } }, 429);
    }
  }

  await next();
});

// Auth middleware
app.use("*", async (c, next) => {
  const session = await auth.api.getSession({ headers: c.req.raw.headers });
  if (!session) {
    c.set("user", null);
    c.set("session", null);
  } else {
    c.set("user", session.user);
    c.set("session", session.session);
  }
  await next();
});

// Mount auth handler
app.on(["GET", "POST"], "/api/auth/*", (c) => auth.handler(c.req.raw));

// Health
app.get("/health", (c) => c.json({ status: "ok", service: "opturna-api" }));

// ===== USER ROUTES =====
app.get("/api/me", async (c) => {
  const user = c.get("user");
  if (!user) return c.json({ error: { message: "Unauthorized" } }, 401);
  const profile = await prisma.user.findUnique({
    where: { id: user.id },
    select: {
      id: true, name: true, email: true, image: true, username: true,
      bio: true, coverImage: true, mainAmbition: true, currentGoals: true,
      isPublic: true, role: true, isVerified: true, externalLinks: true,
      interests: true, createdAt: true,
      _count: { select: { followers: true, following: true, posts: true } }
    }
  });
  return c.json({ data: profile });
});

app.patch("/api/me", async (c) => {
  const user = c.get("user");
  if (!user) return c.json({ error: { message: "Unauthorized" } }, 401);
  const body = await c.req.json() as {
    name?: string; bio?: string; username?: string; mainAmbition?: string;
    currentGoals?: string; isPublic?: boolean; interests?: string[];
    externalLinks?: Array<{ label: string; url: string }>; image?: string; coverImage?: string;
  };
  const name = sanitizeString(body.name, 100);
  const bio = sanitizeString(body.bio, 500);
  const username = sanitizeString(body.username, 50);
  const mainAmbition = sanitizeString(body.mainAmbition, 300);
  const currentGoals = sanitizeString(body.currentGoals, 500);
  const updated = await prisma.user.update({
    where: { id: user.id },
    data: {
      name,
      bio,
      username,
      mainAmbition,
      currentGoals,
      isPublic: body.isPublic,
      interests: body.interests ? JSON.stringify(body.interests) : undefined,
      externalLinks: body.externalLinks ? JSON.stringify(body.externalLinks) : undefined,
      image: body.image,
      coverImage: body.coverImage,
    }
  });
  return c.json({ data: updated });
});

app.get("/api/users/search", async (c) => {
  const q = (c.req.query("q") ?? "").trim().slice(0, 100);
  if (q.length < 2) return c.json({ data: [] });
  const users = await prisma.user.findMany({
    where: {
      OR: [
        { name: { contains: q } },
        { username: { contains: q } },
      ]
    },
    select: { id: true, name: true, image: true, username: true, isVerified: true, role: true },
    take: 20,
  });
  return c.json({ data: users });
});

app.get("/api/users/:id", async (c) => {
  const userId = c.req.param("id");
  const profile = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true, name: true, image: true, username: true, bio: true,
      coverImage: true, mainAmbition: true, currentGoals: true, isPublic: true,
      role: true, isVerified: true, interests: true, createdAt: true,
      _count: { select: { followers: true, following: true, posts: true } }
    }
  });
  if (!profile) return c.json({ error: { message: "User not found" } }, 404);
  return c.json({ data: profile });
});

// Follow
app.post("/api/users/:id/follow", async (c) => {
  const user = c.get("user");
  if (!user) return c.json({ error: { message: "Unauthorized" } }, 401);
  const followingId = c.req.param("id");
  const existing = await prisma.follow.findUnique({
    where: { followerId_followingId: { followerId: user.id, followingId } }
  });
  if (existing) {
    await prisma.follow.delete({ where: { id: existing.id } });
    return c.json({ data: { following: false } });
  }
  await prisma.follow.create({ data: { followerId: user.id, followingId } });
  try {
    await prisma.notification.create({
      data: {
        userId: followingId,
        type: "follow",
        title: "Nuevo seguidor",
        body: `${user.name} ha empezado a seguirte`,
        data: JSON.stringify({ followerId: user.id, followerName: user.name }),
      }
    });
  } catch {
    // Notification failure should not break the main action
  }
  return c.json({ data: { following: true } });
});

// ===== POSTS ROUTES =====
app.get("/api/posts", async (c) => {
  const user = c.get("user");
  const category = c.req.query("category");
  const cursor = c.req.query("cursor");
  const limit = 20;

  const posts = await prisma.post.findMany({
    where: {
      ...(category && { category }),
      isPublic: true,
    },
    orderBy: { createdAt: "desc" },
    take: limit,
    ...(cursor && { skip: 1, cursor: { id: cursor } }),
    include: {
      author: { select: { id: true, name: true, image: true, username: true, isVerified: true, role: true } },
      _count: { select: { comments: true, reactions: true } },
      ...(user ? { reactions: { where: { userId: user.id } } } : {}),
    }
  });
  return c.json({ data: posts });
});

app.post("/api/posts", async (c) => {
  const user = c.get("user");
  if (!user) return c.json({ error: { message: "Unauthorized" } }, 401);
  const body = await c.req.json() as {
    content?: string; type?: string; category?: string;
    mediaUrls?: string[]; pollData?: unknown; hashtags?: string[]; isPublic?: boolean;
  };
  if (!body.content || typeof body.content !== "string") {
    return c.json({ error: { message: "Contenido requerido" } }, 400);
  }
  const content = body.content.trim().slice(0, 5000);
  if (!content) return c.json({ error: { message: "El contenido no puede estar vacío" } }, 400);
  const post = await prisma.post.create({
    data: {
      authorId: user.id,
      content,
      type: body.type || "text",
      category: body.category || "progress",
      mediaUrls: body.mediaUrls ? JSON.stringify(body.mediaUrls) : null,
      pollData: body.pollData ? JSON.stringify(body.pollData) : null,
      hashtags: body.hashtags ? JSON.stringify(body.hashtags) : null,
      isPublic: body.isPublic ?? true,
    },
    include: {
      author: { select: { id: true, name: true, image: true, username: true, isVerified: true } }
    }
  });
  return c.json({ data: post }, 201);
});

app.delete("/api/posts/:id", async (c) => {
  const user = c.get("user");
  if (!user) return c.json({ error: { message: "Unauthorized" } }, 401);
  const post = await prisma.post.findUnique({ where: { id: c.req.param("id") }, select: { authorId: true } });
  if (!post) return c.json({ error: { message: "Post no encontrado" } }, 404);
  if (post.authorId !== user.id) return c.json({ error: { message: "No autorizado" } }, 403);
  await prisma.post.delete({ where: { id: c.req.param("id") } });
  return c.body(null, 204);
});

// Post reactions
app.post("/api/posts/:id/react", async (c) => {
  const user = c.get("user");
  if (!user) return c.json({ error: { message: "Unauthorized" } }, 401);
  const { type } = await c.req.json() as { type: string };
  const postId = c.req.param("id");
  const existing = await prisma.reaction.findUnique({
    where: { postId_userId: { postId, userId: user.id } }
  });
  if (existing) {
    if (existing.type === type) {
      await prisma.reaction.delete({ where: { id: existing.id } });
      return c.json({ data: { reacted: false } });
    }
    await prisma.reaction.update({ where: { id: existing.id }, data: { type } });
  } else {
    await prisma.reaction.create({ data: { postId, userId: user.id, type } });
  }
  try {
    const reactedPost = await prisma.post.findUnique({ where: { id: postId }, select: { authorId: true } });
    if (reactedPost && reactedPost.authorId !== user.id) {
      await prisma.notification.create({
        data: {
          userId: reactedPost.authorId,
          type: "reaction",
          title: "Nueva reacción",
          body: `${user.name} reaccionó a tu publicación`,
          data: JSON.stringify({ postId, reactorId: user.id, reactorName: user.name, type }),
        }
      });
    }
  } catch {
    // Notification failure should not break the main action
  }
  return c.json({ data: { reacted: true, type } });
});

// Post comments
app.get("/api/posts/:id/comments", async (c) => {
  const comments = await prisma.comment.findMany({
    where: { postId: c.req.param("id"), parentId: null },
    include: {
      author: { select: { id: true, name: true, image: true, username: true } },
      replies: {
        include: { author: { select: { id: true, name: true, image: true, username: true } } }
      }
    },
    orderBy: { createdAt: "asc" },
  });
  return c.json({ data: comments });
});

app.post("/api/posts/:id/comments", async (c) => {
  const user = c.get("user");
  if (!user) return c.json({ error: { message: "Unauthorized" } }, 401);
  const body = await c.req.json() as { content: string; parentId?: string };
  const content = sanitizeString(body.content, 1000);
  if (!content) return c.json({ error: { message: "Comentario requerido" } }, 400);
  const comment = await prisma.comment.create({
    data: { postId: c.req.param("id"), authorId: user.id, content, parentId: body.parentId },
    include: { author: { select: { id: true, name: true, image: true, username: true } } }
  });
  try {
    const commentedPost = await prisma.post.findUnique({ where: { id: c.req.param("id") }, select: { authorId: true } });
    if (commentedPost && commentedPost.authorId !== user.id) {
      await prisma.notification.create({
        data: {
          userId: commentedPost.authorId,
          type: "comment",
          title: "Nuevo comentario",
          body: `${user.name} comentó en tu publicación`,
          data: JSON.stringify({ postId: c.req.param("id"), commenterId: user.id, commenterName: user.name }),
        }
      });
    }
  } catch {
    // Notification failure should not break the main action
  }
  return c.json({ data: comment }, 201);
});

app.delete("/api/posts/:id/comments/:commentId", async (c) => {
  const session = await auth.api.getSession({ headers: c.req.raw.headers });
  if (!session?.user) return c.json({ error: { message: "No autorizado" } }, 401);

  const comment = await prisma.comment.findUnique({
    where: { id: c.req.param("commentId") },
    select: { authorId: true, postId: true }
  });
  if (!comment) return c.json({ error: { message: "Comentario no encontrado" } }, 404);
  if (comment.authorId !== session.user.id) return c.json({ error: { message: "No autorizado" } }, 403);
  if (comment.postId !== c.req.param("id")) return c.json({ error: { message: "No encontrado" } }, 404);

  await prisma.comment.delete({ where: { id: c.req.param("commentId") } });
  return c.body(null, 204);
});

// Save post
app.post("/api/posts/:id/save", async (c) => {
  const user = c.get("user");
  if (!user) return c.json({ error: { message: "Unauthorized" } }, 401);
  const postId = c.req.param("id");
  const existing = await prisma.savedPost.findUnique({
    where: { userId_postId: { userId: user.id, postId } }
  });
  if (existing) {
    await prisma.savedPost.delete({ where: { id: existing.id } });
    return c.json({ data: { saved: false } });
  }
  await prisma.savedPost.create({ data: { userId: user.id, postId } });
  return c.json({ data: { saved: true } });
});

// ===== GOALS ROUTES =====
app.get("/api/goals", async (c) => {
  const user = c.get("user");
  if (!user) return c.json({ error: { message: "Unauthorized" } }, 401);
  const goals = await prisma.goal.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: "desc" }
  });
  return c.json({ data: goals });
});

app.post("/api/goals", async (c) => {
  const user = c.get("user");
  if (!user) return c.json({ error: { message: "Unauthorized" } }, 401);
  const body = await c.req.json() as {
    title: string; description?: string; category?: string;
    dueDate?: string; milestones?: Array<{ title: string; done: boolean }>;
  };
  const goal = await prisma.goal.create({
    data: {
      userId: user.id,
      title: body.title,
      description: body.description,
      category: body.category,
      dueDate: body.dueDate ? new Date(body.dueDate) : null,
      milestones: body.milestones ? JSON.stringify(body.milestones) : null,
    }
  });
  return c.json({ data: goal }, 201);
});

app.patch("/api/goals/:id", async (c) => {
  const user = c.get("user");
  if (!user) return c.json({ error: { message: "Unauthorized" } }, 401);
  const goalId = c.req.param("id");
  const existingGoal = await prisma.goal.findUnique({ where: { id: goalId }, select: { userId: true } });
  if (!existingGoal) return c.json({ error: { message: "Meta no encontrada" } }, 404);
  if (existingGoal.userId !== user.id) return c.json({ error: { message: "No autorizado" } }, 403);
  const body = await c.req.json() as {
    title?: string; description?: string; progress?: number;
    isCompleted?: boolean; milestones?: Array<{ title: string; done: boolean }>;
  };
  const goal = await prisma.goal.update({
    where: { id: goalId },
    data: {
      title: body.title,
      description: body.description,
      progress: body.progress,
      isCompleted: body.isCompleted,
      milestones: body.milestones ? JSON.stringify(body.milestones) : undefined,
    }
  });
  return c.json({ data: goal });
});

app.delete("/api/goals/:id", async (c) => {
  const user = c.get("user");
  if (!user) return c.json({ error: { message: "Unauthorized" } }, 401);
  const existingGoal = await prisma.goal.findUnique({ where: { id: c.req.param("id") }, select: { userId: true } });
  if (!existingGoal) return c.json({ error: { message: "Meta no encontrada" } }, 404);
  if (existingGoal.userId !== user.id) return c.json({ error: { message: "No autorizado" } }, 403);
  await prisma.goal.delete({ where: { id: c.req.param("id") } });
  return c.body(null, 204);
});

// ===== SPRINTS ROUTES =====
app.get("/api/sprints", async (c) => {
  const user = c.get("user");
  if (!user) return c.json({ error: { message: "Unauthorized" } }, 401);
  const sprints = await prisma.sprint.findMany({
    where: {
      members: { some: { userId: user.id } }
    },
    include: {
      creator: { select: { id: true, name: true, image: true } },
      _count: { select: { members: true, checkIns: true } },
      members: { where: { userId: user.id } }
    },
    orderBy: { createdAt: "desc" }
  });
  return c.json({ data: sprints });
});

app.post("/api/sprints", async (c) => {
  const user = c.get("user");
  if (!user) return c.json({ error: { message: "Unauthorized" } }, 401);
  const body = await c.req.json() as {
    title: string; description?: string; duration?: number; isPublic?: boolean;
  };
  const startDate = new Date();
  const endDate = new Date(startDate);
  endDate.setDate(endDate.getDate() + (body.duration || 7));

  const sprint = await prisma.sprint.create({
    data: {
      creatorId: user.id,
      title: body.title,
      description: body.description,
      duration: body.duration || 7,
      startDate,
      endDate,
      isPublic: body.isPublic ?? false,
      members: { create: { userId: user.id, role: "creator" } }
    },
    include: {
      creator: { select: { id: true, name: true, image: true } },
      _count: { select: { members: true, checkIns: true } }
    }
  });
  return c.json({ data: sprint }, 201);
});

app.post("/api/sprints/:id/checkin", async (c) => {
  const user = c.get("user");
  if (!user) return c.json({ error: { message: "Unauthorized" } }, 401);
  const sprintId = c.req.param("id");
  const sprintMembership = await prisma.sprintMember.findFirst({ where: { sprintId, userId: user.id }, select: { id: true } });
  if (!sprintMembership) return c.json({ error: { message: "Sprint no encontrado o no autorizado" } }, 404);
  const body = await c.req.json() as {
    content: string; evidence?: { url: string; type: string }; mood?: number;
  };
  const checkIn = await prisma.checkIn.create({
    data: {
      sprintId,
      userId: user.id,
      content: body.content,
      evidence: body.evidence ? JSON.stringify(body.evidence) : null,
      mood: body.mood,
    }
  });
  // Update streak
  await prisma.sprintMember.updateMany({
    where: { sprintId, userId: user.id },
    data: { streak: { increment: 1 } }
  });
  return c.json({ data: checkIn }, 201);
});

// Delete sprint
app.delete("/api/sprints/:id", async (c) => {
  const user = c.get("user");
  if (!user) return c.json({ error: { message: "Unauthorized" } }, 401);
  const sprint = await prisma.sprint.findUnique({ where: { id: c.req.param("id") }, select: { creatorId: true } });
  if (!sprint) return c.json({ error: { message: "Sprint no encontrado" } }, 404);
  if (sprint.creatorId !== user.id) return c.json({ error: { message: "No autorizado" } }, 403);
  await prisma.sprint.delete({ where: { id: c.req.param("id") } });
  return c.body(null, 204);
});

app.get("/api/sprints/:id/checkins", async (c) => {
  const user = c.get("user");
  if (!user) return c.json({ error: { message: "Unauthorized" } }, 401);
  const checkIns = await prisma.checkIn.findMany({
    where: { sprintId: c.req.param("id"), userId: user.id },
    orderBy: { createdAt: "desc" }
  });
  return c.json({ data: checkIns });
});

// ===== NOTIFICATIONS ROUTES =====
app.get("/api/notifications", async (c) => {
  const user = c.get("user");
  if (!user) return c.json({ error: { message: "Unauthorized" } }, 401);
  const notifications = await prisma.notification.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: "desc" },
    take: 50,
  });
  return c.json({ data: notifications });
});

app.patch("/api/notifications/read-all", async (c) => {
  const user = c.get("user");
  if (!user) return c.json({ error: { message: "Unauthorized" } }, 401);
  await prisma.notification.updateMany({
    where: { userId: user.id, isRead: false },
    data: { isRead: true }
  });
  return c.json({ data: { success: true } });
});

// Get unread count only (lightweight for badge polling)
app.get("/api/notifications/unread-count", async (c) => {
  const session = await auth.api.getSession({ headers: c.req.raw.headers });
  if (!session?.user) return c.json({ error: { message: "No autorizado" } }, 401);

  const count = await prisma.notification.count({
    where: { userId: session.user.id, isRead: false }
  });
  return c.json({ data: { count } });
});

// Mark single notification as read
app.patch("/api/notifications/:id/read", async (c) => {
  const session = await auth.api.getSession({ headers: c.req.raw.headers });
  if (!session?.user) return c.json({ error: { message: "No autorizado" } }, 401);

  const notif = await prisma.notification.findUnique({
    where: { id: c.req.param("id") },
    select: { userId: true }
  });
  if (!notif) return c.json({ error: { message: "Notificación no encontrada" } }, 404);
  if (notif.userId !== session.user.id) return c.json({ error: { message: "No autorizado" } }, 403);

  await prisma.notification.update({
    where: { id: c.req.param("id") },
    data: { isRead: true }
  });
  return c.json({ data: { success: true } });
});

// Delete notification
app.delete("/api/notifications/:id", async (c) => {
  const session = await auth.api.getSession({ headers: c.req.raw.headers });
  if (!session?.user) return c.json({ error: { message: "No autorizado" } }, 401);

  const notif = await prisma.notification.findUnique({
    where: { id: c.req.param("id") },
    select: { userId: true }
  });
  if (!notif) return c.json({ error: { message: "Notificación no encontrada" } }, 404);
  if (notif.userId !== session.user.id) return c.json({ error: { message: "No autorizado" } }, 403);

  await prisma.notification.delete({ where: { id: c.req.param("id") } });
  return c.body(null, 204);
});

// ===== CHATS ROUTES =====
app.get("/api/chats", async (c) => {
  const user = c.get("user");
  if (!user) return c.json({ error: { message: "Unauthorized" } }, 401);
  const chats = await prisma.chat.findMany({
    where: { members: { some: { userId: user.id } } },
    include: {
      members: {
        include: { user: { select: { id: true, name: true, image: true, username: true } } }
      },
      messages: { orderBy: { createdAt: "desc" }, take: 1 }
    },
    orderBy: { updatedAt: "desc" }
  });
  return c.json({ data: chats });
});

app.post("/api/chats", async (c) => {
  const user = c.get("user");
  if (!user) return c.json({ error: { message: "Unauthorized" } }, 401);
  const body = await c.req.json() as {
    type?: string; recipientId?: string; name?: string; memberIds?: string[];
  };

  // Check if DM already exists
  if (body.type === "direct" && body.recipientId) {
    const existing = await prisma.chat.findFirst({
      where: {
        type: "direct",
        AND: [
          { members: { some: { userId: user.id } } },
          { members: { some: { userId: body.recipientId } } }
        ]
      },
      include: { members: { include: { user: { select: { id: true, name: true, image: true } } } } }
    });
    if (existing) return c.json({ data: existing });
  }

  const memberIds = body.type === "direct"
    ? [user.id, body.recipientId!]
    : [user.id, ...(body.memberIds || [])];

  const chat = await prisma.chat.create({
    data: {
      type: body.type || "direct",
      name: body.name,
      members: {
        create: memberIds.map((id: string) => ({
          userId: id,
          role: id === user.id ? "admin" : "member"
        }))
      }
    },
    include: { members: { include: { user: { select: { id: true, name: true, image: true } } } } }
  });
  return c.json({ data: chat }, 201);
});

app.get("/api/chats/:id/messages", async (c) => {
  const user = c.get("user");
  if (!user) return c.json({ error: { message: "Unauthorized" } }, 401);
  const chatId = c.req.param("id");
  const membership = await prisma.chatMember.findFirst({ where: { chatId, userId: user.id } });
  if (!membership) return c.json({ error: { message: "No autorizado" } }, 403);
  const messages = await prisma.message.findMany({
    where: { chatId },
    include: { sender: { select: { id: true, name: true, image: true, username: true } } },
    orderBy: { createdAt: "asc" },
    take: 100,
  });
  return c.json({ data: messages });
});

app.post("/api/chats/:id/messages", async (c) => {
  const user = c.get("user");
  if (!user) return c.json({ error: { message: "Unauthorized" } }, 401);
  const chatId = c.req.param("id");
  const membership = await prisma.chatMember.findFirst({ where: { chatId, userId: user.id } });
  if (!membership) return c.json({ error: { message: "No autorizado" } }, 403);
  const body = await c.req.json() as { content?: string; type?: string; fileUrl?: string; fileName?: string; fileMimeType?: string };
  const message = await prisma.message.create({
    data: {
      chatId,
      senderId: user.id,
      content: body.content,
      type: body.type || "text",
      fileUrl: body.fileUrl,
      fileName: body.fileName,
      fileMimeType: body.fileMimeType,
    },
    include: { sender: { select: { id: true, name: true, image: true, username: true } } }
  });
  await prisma.chat.update({ where: { id: chatId }, data: { updatedAt: new Date() } });

  try {
    const chatMembers = await prisma.chatMember.findMany({
      where: { chatId, userId: { not: user.id } },
      select: { userId: true }
    });
    for (const member of chatMembers) {
      await prisma.notification.create({
        data: {
          userId: member.userId,
          type: "message",
          title: "Nuevo mensaje",
          body: `${user.name}: ${typeof body.content === 'string' ? body.content.substring(0, 60) : 'Te envió un archivo'}`,
          data: JSON.stringify({ chatId, senderId: user.id, senderName: user.name }),
        }
      });
    }
  } catch {
    // Notification failure should not break the main action
  }

  // Broadcast to all WebSocket clients in the chat room
  broadcastNewMessage(chatId, {
    id: message.id,
    content: message.content ?? undefined,
    type: message.type,
    fileUrl: message.fileUrl ?? undefined,
    fileName: message.fileName ?? undefined,
    fileMimeType: message.fileMimeType ?? undefined,
    createdAt: message.createdAt.toISOString(),
    isRead: false,
    sender: {
      id: user.id,
      name: user.name,
      image: user.image ?? undefined,
    },
  });

  return c.json({ data: message }, 201);
});

app.patch("/api/chats/:id/messages/read", async (c) => {
  const session = c.get("session");
  if (!session) return c.json({ error: { message: "Unauthorized" } }, 401);
  const user = c.get("user")!;

  const chatId = c.req.param("id");
  const membership = await prisma.chatMember.findFirst({ where: { chatId, userId: user.id } });
  if (!membership) return c.json({ error: { message: "No autorizado" } }, 403);

  // Get all messages in this chat not sent by the current user
  const messages = await prisma.message.findMany({
    where: { chatId, NOT: { senderId: user.id } }
  });

  // Upsert read receipts for each message
  for (const msg of messages) {
    await prisma.messageRead.upsert({
      where: { messageId_userId: { messageId: msg.id, userId: user.id } },
      create: { messageId: msg.id, userId: user.id },
      update: {}
    });
  }

  return c.json({ data: { ok: true } });
});

// ===== COURSES ROUTES =====
app.get("/api/courses", async (c) => {
  const courses = await prisma.course.findMany({
    where: { isPublished: true },
    include: {
      creator: { select: { id: true, name: true, image: true, isVerified: true } },
      _count: { select: { lessons: true, enrollments: true } }
    },
    orderBy: { createdAt: "desc" }
  });
  return c.json({ data: courses });
});

app.get("/api/courses/:id", async (c) => {
  const course = await prisma.course.findUnique({
    where: { id: c.req.param("id") },
    include: {
      creator: { select: { id: true, name: true, image: true, isVerified: true } },
      lessons: { orderBy: { order: "asc" } },
      _count: { select: { enrollments: true } }
    }
  });
  if (!course) return c.json({ error: { message: "Not found" } }, 404);
  return c.json({ data: course });
});

app.post("/api/courses", async (c) => {
  const user = c.get("user");
  if (!user) return c.json({ error: { message: "Unauthorized" } }, 401);
  const body = await c.req.json() as {
    title: string; description?: string; category?: string; access?: string; thumbnail?: string;
  };
  const course = await prisma.course.create({
    data: {
      creatorId: user.id,
      title: body.title,
      description: body.description,
      category: body.category,
      access: body.access || "free",
      thumbnail: body.thumbnail,
    }
  });
  return c.json({ data: course }, 201);
});

// ===== EVENTS ROUTES =====
app.get("/api/events", async (c) => {
  const events = await prisma.event.findMany({
    where: { isPublic: true, startAt: { gte: new Date() } },
    include: {
      creator: { select: { id: true, name: true, image: true } },
      _count: { select: { rsvps: true } }
    },
    orderBy: { startAt: "asc" }
  });
  return c.json({ data: events });
});

app.post("/api/events", async (c) => {
  const user = c.get("user");
  if (!user) return c.json({ error: { message: "Unauthorized" } }, 401);
  const body = await c.req.json() as {
    title: string; description?: string; type?: string; startAt: string;
    endAt?: string; location?: string; isPublic?: boolean;
  };
  const event = await prisma.event.create({
    data: {
      creatorId: user.id,
      title: body.title,
      description: body.description,
      type: body.type || "online",
      startAt: new Date(body.startAt),
      endAt: body.endAt ? new Date(body.endAt) : null,
      location: body.location,
      isPublic: body.isPublic ?? true,
    }
  });
  return c.json({ data: event }, 201);
});

app.post("/api/events/:id/rsvp", async (c) => {
  const user = c.get("user");
  if (!user) return c.json({ error: { message: "Unauthorized" } }, 401);
  const { status } = await c.req.json() as { status: string };
  const rsvp = await prisma.eventRsvp.upsert({
    where: { eventId_userId: { eventId: c.req.param("id"), userId: user.id } },
    create: { eventId: c.req.param("id"), userId: user.id, status },
    update: { status }
  });
  return c.json({ data: rsvp });
});

// ===== CIRCLES ROUTES =====
app.get("/api/circles", async (c) => {
  const circles = await prisma.circle.findMany({
    where: { isPrivate: false },
    include: { _count: { select: { members: true } } },
    orderBy: { createdAt: "desc" }
  });
  return c.json({ data: circles });
});

app.post("/api/circles", async (c) => {
  const user = c.get("user");
  if (!user) return c.json({ error: { message: "Unauthorized" } }, 401);
  const body = await c.req.json() as {
    name: string; description?: string; topic?: string; city?: string; isPrivate?: boolean;
  };
  const circle = await prisma.circle.create({
    data: {
      name: body.name,
      description: body.description,
      topic: body.topic,
      city: body.city,
      isPrivate: body.isPrivate ?? false,
      members: { create: { userId: user.id, role: "admin" } }
    }
  });
  return c.json({ data: circle }, 201);
});

// Reports
app.post("/api/reports", async (c) => {
  const user = c.get("user");
  if (!user) return c.json({ error: { message: "Unauthorized" } }, 401);
  const body = await c.req.json() as {
    reportedUserId?: string; postId?: string; reason: string; description?: string;
  };
  const report = await prisma.report.create({
    data: {
      reporterId: user.id,
      reportedUserId: body.reportedUserId,
      postId: body.postId,
      reason: body.reason,
      description: body.description,
    }
  });
  return c.json({ data: report }, 201);
});

// ===== FILE UPLOAD =====
app.post("/api/upload", async (c) => {
  const user = c.get("user");
  if (!user) return c.json({ error: { message: "Unauthorized" } }, 401);

  const formData = await c.req.formData();
  const file = formData.get("file");

  if (!file || !(file instanceof File)) {
    return c.json({ error: { message: "No file provided" } }, 400);
  }

  const storageForm = new FormData();
  storageForm.append("file", file);

  const response = await fetch("https://storage.vibecodeapp.com/v1/files/upload", {
    method: "POST",
    body: storageForm,
  });

  if (!response.ok) {
    const error = await response.json() as { error?: string };
    return c.json({ error: { message: error.error || "Upload failed" } }, 500);
  }

  const result = await response.json() as {
    file: {
      url: string;
      originalFilename: string;
      sizeBytes: number;
      contentType: string;
    };
  };

  // Save to DB
  const asset = await prisma.uploadedFile.create({
    data: {
      uploaderId: user.id,
      url: result.file.url,
      name: result.file.originalFilename,
      size: result.file.sizeBytes,
      mimeType: result.file.contentType,
      type: result.file.contentType?.startsWith("image/") ? "image"
        : result.file.contentType?.startsWith("video/") ? "video"
        : result.file.contentType?.startsWith("audio/") ? "audio"
        : result.file.contentType === "application/pdf" ? "pdf"
        : "file",
    },
  });

  return c.json({ data: { id: asset.id, url: asset.url, name: asset.name, mimeType: asset.mimeType, type: asset.type } });
});

// ===== AI CHAT ROUTE =====
app.post("/api/ai/chat", async (c) => {
  const user = c.get("user");
  if (!user) return c.json({ error: { message: "Unauthorized" } }, 401);

  const body = await c.req.json() as {
    messages: Array<{ role: "user" | "assistant"; content: string }>;
    stream?: boolean;
  };

  const { messages, stream = false } = body;

  const SYSTEM_PROMPT = `Eres Opturna AI, un asistente inteligente avanzado. Eres experto en negocios, finanzas, inversiones, estrategia empresarial, productividad, trading, impuestos globales, filosofía, desarrollo personal y cualquier tema que el usuario quiera explorar.

Personalidad y estilo de comunicación:
- Habla de manera natural, fluida y conversacional, como lo haría ChatGPT
- Responde en el mismo idioma que el usuario (español o inglés)
- Sé directo, claro y útil. Evita ser excesivamente formal o robótico
- Cuando sea apropiado, usa listas numeradas o con viñetas para mayor claridad
- Puedes hacer preguntas de seguimiento para entender mejor lo que necesita el usuario
- Sé empático y personaliza tus respuestas según el contexto de la conversación
- No empieces siempre con "¡Claro!" o frases muy repetitivas. Varía tus inicios
- Mantén el hilo de la conversación y recuerda el contexto de mensajes anteriores

Conocimiento especializado:
- Fiscalidad global: EEUU, Europa, LATAM, Asia, Medio Oriente, OCDE/BEPS, Pillar Two
- Finanzas personales: presupuestos, inversión, retiro, ahorro, deuda
- Mercados financieros: análisis técnico y fundamental, cripto, acciones, forex
- Negocios: startups, estrategia, marketing, operaciones, fundraising, OKRs
- Productividad: GTD, Pomodoro, gestión del tiempo, hábitos, mentalidad de crecimiento
- Filosofía y desarrollo personal: estoicismo, ikigai, mentalidad de abundancia

Cuando des información financiera o fiscal específica, siempre aclara que es orientativa y recomienda consultar a un profesional para situaciones específicas.`;

  const chatMessages = [
    { role: "system" as const, content: SYSTEM_PROMPT },
    ...messages.map((m) => ({ role: m.role as "user" | "assistant", content: m.content })),
  ];

  if (stream) {
    const openaiRes = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${env.OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: "gpt-5.2",
        messages: chatMessages,
        max_completion_tokens: 1500,
        temperature: 1,
        stream: true,
      }),
    });

    if (!openaiRes.ok) {
      const err = await openaiRes.text();
      return c.json({ error: { message: `OpenAI error: ${err}` } }, 500);
    }

    return new Response(openaiRes.body, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        "X-Accel-Buffering": "no",
      },
    });
  } else {
    const openaiRes = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${env.OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: "gpt-5.2",
        messages: chatMessages,
        max_completion_tokens: 1500,
        temperature: 1,
      }),
    });

    if (!openaiRes.ok) {
      const errText = await openaiRes.text();
      return c.json({ error: { message: `OpenAI error: ${errText}` } }, 500);
    }

    const result = await openaiRes.json() as {
      choices: Array<{ message: { content: string } }>;
    };
    const content = result.choices?.[0]?.message?.content ?? "";
    return c.json({ data: { content } });
  }
});

// ===== LIVE STREAMING ROUTES =====
app.route("/api/live", liveRouter);

// ===== TASKS ROUTES =====
app.route("/api/tasks", tasks);

// ===== HABITS ROUTES =====
app.route("/api/habits", habits);

// ===== PROJECTS ROUTES =====
app.route("/api/projects", projects);

// ===== FINANCE TOOLS ROUTES =====
app.route("/api/finance", financeToolsRouter);

// ===== SIGNALS ROUTES =====
app.route("/api/signals", signalsRouter);

// ===== CONTENT ROUTES =====
app.route("/api/content", contentRouter);

// ===== RESEARCH ROUTES =====
app.route("/api/research", researchRouter);
app.route("/api/inflation", inflationRouter);
app.route("/api/advanced", advancedFinanceRouter);

// ===== JOURNAL ROUTES =====
app.route("/api/journal", journal);

// ===== LIFE GOALS ROUTES =====
app.route("/api/life-goals", lifeGoals);

// ===== CREATORS / PARTNERS HUB ROUTES =====
app.route("/api/creators", creatorsRouter);

// ===== MEDIA / REELS / STORIES ROUTES =====
app.route("/api/media", mediaRouter);

const port = Number(env.PORT) || 3000;
console.log(`Opturna API running on port ${port}`);

export default {
  port,
  async fetch(req: Request, server: import("bun").Server) {
    const url = new URL(req.url);

    // Live stream WebSocket
    if (url.pathname.startsWith("/ws/live/")) {
      const pathParts = url.pathname.split("/ws/live/");
      const streamId = pathParts[1] || "";
      const userId = url.searchParams.get("userId") || "anonymous";
      const userName = url.searchParams.get("userName") || "Usuario";
      const userImage = url.searchParams.get("userImage") || undefined;

      const success = server.upgrade(req, {
        data: { type: "live", streamId, userId, userName, userImage },
      });
      if (success) return undefined as unknown as Response;
    }

    // Chat WebSocket
    if (url.pathname.startsWith("/ws/chat/")) {
      // Verify user session from cookie header
      const session = await auth.api.getSession({ headers: req.headers as unknown as Headers }).catch(() => null);
      const verifiedUserId = session?.user?.id;
      const verifiedUserName = session?.user?.name ?? "Usuario";

      if (!verifiedUserId) {
        return new Response("Unauthorized", { status: 401 });
      }

      const chatId = url.pathname.split("/ws/chat/")[1] || "";
      // Verify membership
      const membership = await prisma.chatMember.findFirst({
        where: { chatId, userId: verifiedUserId }
      }).catch(() => null);

      if (!membership) {
        return new Response("Forbidden", { status: 403 });
      }

      const success = server.upgrade(req, {
        data: { type: "chat", chatId, userId: verifiedUserId, userName: verifiedUserName, userImage: session?.user?.image ?? "" },
      });
      if (success) return undefined as unknown as Response;
      return new Response("WebSocket upgrade failed", { status: 400 });
    }

    return app.fetch(req, { server });
  },
  websocket: {
    open(ws: import("bun").ServerWebSocket<{ type: string; streamId?: string; chatId?: string; userId: string; userName: string; userImage?: string }>) {
      if (ws.data.type === "live") {
        const { streamId, userId, userName, userImage } = ws.data as { type: string; streamId: string; userId: string; userName: string; userImage?: string };
        joinRoom(streamId, { ws, userId, userName, userImage });
      } else if (ws.data.type === "chat") {
        const { chatId, userId, userName, userImage } = ws.data as { type: string; chatId: string; userId: string; userName: string; userImage?: string };
        joinChatRoom(chatId, { ws, userId, userName, userImage, chatId });
      }
    },
    message(
      ws: import("bun").ServerWebSocket<{ type: string; streamId?: string; chatId?: string; userId: string; userName: string; userImage?: string }>,
      message: string | Buffer
    ) {
      if (ws.data.type === "live") {
        const { streamId, userId, userName, userImage } = ws.data as { type: string; streamId: string; userId: string; userName: string; userImage?: string };
        try {
          const data = JSON.parse(message as string) as { type: string; content?: string };
          if (data.type === "chat" && data.content) {
            broadcastToRoom(streamId, {
              type: "chat",
              content: data.content,
              userId,
              userName,
              userImage,
              timestamp: new Date().toISOString(),
            });
          }
        } catch {
          // ignore malformed messages
        }
      } else if (ws.data.type === "chat") {
        const { chatId, userId, userName, userImage } = ws.data as { type: string; chatId: string; userId: string; userName: string; userImage?: string };
        // Build a reference to the current client for exclusion in broadcasts
        const currentClient: ChatWSClient = { ws, userId, userName, userImage, chatId };
        try {
          const payload = JSON.parse(message as string) as { type: string; messageId?: string };
          if (payload.type === "typing_start") {
            broadcastToChatRoom(chatId, { type: "typing", userId, userName, typing: true }, currentClient);
          } else if (payload.type === "typing_stop") {
            broadcastToChatRoom(chatId, { type: "typing", userId, userName, typing: false }, currentClient);
          }
          // Actual messages are sent via REST POST /api/chats/:id/messages
          // which calls broadcastNewMessage after persisting to DB
        } catch {
          // ignore malformed messages
        }
      }
    },
    close(ws: import("bun").ServerWebSocket<{ type: string; streamId?: string; chatId?: string; userId: string; userName: string; userImage?: string }>) {
      if (ws.data.type === "live") {
        const { streamId, userId, userName, userImage } = ws.data as { type: string; streamId: string; userId: string; userName: string; userImage?: string };
        leaveRoom(streamId, { ws, userId, userName, userImage });
      } else if (ws.data.type === "chat") {
        const { chatId, userId, userName, userImage } = ws.data as { type: string; chatId: string; userId: string; userName: string; userImage?: string };
        leaveChatRoom(chatId, { ws, userId, userName, userImage, chatId });
      }
    },
  },
};
