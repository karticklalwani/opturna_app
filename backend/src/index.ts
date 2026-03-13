import "@vibecodeapp/proxy"; // DO NOT REMOVE OTHERWISE VIBECODE PROXY WILL NOT WORK
import { Hono } from "hono";
import { cors } from "hono/cors";
import { auth } from "./auth";
import { prisma } from "./prisma";
import { env } from "./env";
import { liveRouter } from "./routes/live";
import { joinRoom, leaveRoom, broadcastToRoom } from "./live-ws";
import { joinChatRoom, leaveChatRoom, broadcastToChatRoom, broadcastNewMessage } from "./chat-ws";
import type { ChatWSClient } from "./chat-ws";

type Variables = {
  user: typeof auth.$Infer.Session.user | null;
  session: typeof auth.$Infer.Session.session | null;
};

const app = new Hono<{ Variables: Variables }>();

// CORS
app.use("*", cors({
  origin: (origin) => {
    if (!origin) return origin;
    if (
      origin.includes(".vibecode.run") ||
      origin.includes(".vibecodeapp.com") ||
      origin.includes(".vibecode.dev") ||
      origin.startsWith("http://localhost") ||
      origin.startsWith("http://127.0.0.1")
    ) return origin;
    return origin;
  },
  allowHeaders: ["Content-Type", "Authorization", "Cookie"],
  allowMethods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
  exposeHeaders: ["Set-Cookie"],
  credentials: true,
}));

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
  const updated = await prisma.user.update({
    where: { id: user.id },
    data: {
      name: body.name,
      bio: body.bio,
      username: body.username,
      mainAmbition: body.mainAmbition,
      currentGoals: body.currentGoals,
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
  const q = c.req.query("q") || "";
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
  const post = await prisma.post.create({
    data: {
      authorId: user.id,
      content: body.content,
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
  const post = await prisma.post.findUnique({ where: { id: c.req.param("id") } });
  if (!post || post.authorId !== user.id) return c.json({ error: { message: "Forbidden" } }, 403);
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
  const { content, parentId } = await c.req.json() as { content: string; parentId?: string };
  const comment = await prisma.comment.create({
    data: { postId: c.req.param("id"), authorId: user.id, content, parentId },
    include: { author: { select: { id: true, name: true, image: true, username: true } } }
  });
  return c.json({ data: comment }, 201);
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
  const body = await c.req.json() as {
    title?: string; description?: string; progress?: number;
    isCompleted?: boolean; milestones?: Array<{ title: string; done: boolean }>;
  };
  const goal = await prisma.goal.update({
    where: { id: c.req.param("id") },
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
  const body = await c.req.json() as {
    content: string; evidence?: { url: string; type: string }; mood?: number;
  };
  const checkIn = await prisma.checkIn.create({
    data: {
      sprintId: c.req.param("id"),
      userId: user.id,
      content: body.content,
      evidence: body.evidence ? JSON.stringify(body.evidence) : null,
      mood: body.mood,
    }
  });
  // Update streak
  await prisma.sprintMember.updateMany({
    where: { sprintId: c.req.param("id"), userId: user.id },
    data: { streak: { increment: 1 } }
  });
  return c.json({ data: checkIn }, 201);
});

// Delete sprint
app.delete("/api/sprints/:id", async (c) => {
  const user = c.get("user");
  if (!user) return c.json({ error: { message: "Unauthorized" } }, 401);
  const sprint = await prisma.sprint.findUnique({ where: { id: c.req.param("id") } });
  if (!sprint || sprint.creatorId !== user.id) return c.json({ error: { message: "Forbidden" } }, 403);
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
  const messages = await prisma.message.findMany({
    where: { chatId: c.req.param("id") },
    include: { sender: { select: { id: true, name: true, image: true, username: true } } },
    orderBy: { createdAt: "asc" },
    take: 100,
  });
  return c.json({ data: messages });
});

app.post("/api/chats/:id/messages", async (c) => {
  const user = c.get("user");
  if (!user) return c.json({ error: { message: "Unauthorized" } }, 401);
  const body = await c.req.json() as { content?: string; type?: string; fileUrl?: string; fileName?: string; fileMimeType?: string };
  const chatId = c.req.param("id");
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

  const SYSTEM_PROMPT = `You are Opturna AI — an expert financial and business intelligence assistant with deep, comprehensive knowledge of global taxation systems, tax law, tax planning, and fiscal strategy.

TAXATION EXPERTISE (Global Coverage):
- United States: Federal income tax (all brackets), capital gains tax (short/long-term), corporate tax (21%), pass-through entities (S-Corp, LLC, Partnership), estate/gift tax, AMT, SALT deduction, QBI deduction (199A), depreciation (MACRS, bonus depreciation, Section 179), R&D tax credits, foreign tax credits, FATCA, FBAR requirements, IRS audit procedures, installment agreements, OIC
- European Union: VAT/IVA system (EU-wide), DAC6 reporting, EU Anti-Tax Avoidance Directive (ATAD), transfer pricing rules; Germany (Lohnsteuer, Körperschaftsteuer), France (IS, TVA, IFI), Spain (IRPF, IS, IVA), Italy (IRPEF, IRES, IVA), Netherlands (VPB, BTW, participation exemption), Ireland (12.5% corporate rate)
- United Kingdom: Income tax bands, National Insurance, Corporation Tax, VAT, CGT, IHT, R&D tax relief, EMI options, EIS/SEIS
- Latin America: Mexico (ISR, IVA, CFDI, SAT), Argentina (Ganancias, IVA, Bienes Personales), Brazil (IRPF, IRPJ, CSLL, PIS, COFINS, ICMS, Simples Nacional), Colombia (Renta, IVA), Chile (Impuesto a la Renta), Peru (IR, IGV)
- Asia-Pacific: China (IIT, CIT, VAT), Japan (所得税, 法人税), Singapore (17% corporate, GST, no CGT), Hong Kong (profits tax, no CGT/VAT), Australia (income tax, CGT discount, franking credits, GST), India (new vs old regime, GST, TDS/TCS)
- Middle East: UAE (0% personal tax, 9% corporate since 2023, VAT 5%), Saudi Arabia (zakat, WHT, VAT 15%), Israel (income tax, VAT)
- International: OECD BEPS, Pillar One/Two global minimum tax (15%), tax treaties, CFC rules, transfer pricing (arm's length, OECD Guidelines), permanent establishment, digital services taxes, crypto taxation globally

FINANCIAL & BUSINESS EXPERTISE:
- Personal finance, budgeting, investment strategies, retirement planning
- Business finance, cash flow, financial modeling, startup funding
- Real estate investing, 1031 exchanges, depreciation strategies
- Cryptocurrency & DeFi taxation
- Business strategy, growth hacking, CAC/LTV, fundraising

STYLE: Be direct and actionable. Use numbered lists. Cite specific laws, rates, and thresholds. Always remind users to consult a licensed professional for their specific situation. Mention jurisdiction and tax year when relevant.`;

  // Build input array
  const inputMessages = [
    { role: "system" as const, content: SYSTEM_PROMPT },
    ...messages.map((m) => ({ role: m.role as "user" | "assistant", content: m.content })),
  ];

  if (stream) {
    const openaiRes = await fetch("https://api.openai.com/v1/responses", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${env.OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: "gpt-4o",
        input: inputMessages,
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
    const openaiRes = await fetch("https://api.openai.com/v1/responses", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${env.OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: "gpt-4o",
        input: inputMessages,
      }),
    });

    if (!openaiRes.ok) {
      const errText = await openaiRes.text();
      return c.json({ error: { message: `OpenAI error: ${errText}` } }, 500);
    }

    const result = await openaiRes.json() as {
      output: Array<{ content: Array<{ text: string }> }>;
    };
    const content = result.output?.[0]?.content?.[0]?.text ?? "";
    return c.json({ data: { content } });
  }
});

// ===== LIVE STREAMING ROUTES =====
app.route("/api/live", liveRouter);

const port = Number(env.PORT) || 3000;
console.log(`Opturna API running on port ${port}`);

export default {
  port,
  fetch(req: Request, server: import("bun").Server) {
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
      const chatId = url.pathname.split("/ws/chat/")[1] || "";
      const userId = url.searchParams.get("userId") || "anonymous";
      const userName = url.searchParams.get("userName") || "Usuario";
      const userImage = url.searchParams.get("userImage") || undefined;

      const success = server.upgrade(req, {
        data: { type: "chat", chatId, userId, userName, userImage },
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
