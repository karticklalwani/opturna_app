import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { z } from "zod";
import { prisma } from "../prisma";

type Variables = {
  user: { id: string; name: string; image: string | null } | null;
  session: unknown | null;
};

const communitiesRouter = new Hono<{ Variables: Variables }>();

// ─── GET / — List all public communities (with search & category filter) ─────
communitiesRouter.get("/", async (c) => {
  const search = c.req.query("search")?.trim();
  const category = c.req.query("category")?.trim();
  const limit = Math.min(parseInt(c.req.query("limit") || "50", 10), 100);
  const offset = parseInt(c.req.query("offset") || "0", 10);

  const where: Record<string, unknown> = { isPublic: true };

  if (search) {
    where.OR = [
      { name: { contains: search } },
      { description: { contains: search } },
    ];
  }
  if (category) {
    where.category = category;
  }

  const [communities, total] = await Promise.all([
    prisma.circle.findMany({
      where: where as any,
      orderBy: { createdAt: "desc" },
      take: limit,
      skip: offset,
      include: {
        _count: { select: { members: true, messages: true } },
      },
    }),
    prisma.circle.count({ where: where as any }),
  ]);

  // If the user is authenticated, include their membership status
  const user = c.get("user");
  let membershipMap: Record<string, string> = {};
  if (user) {
    const memberships = await prisma.circleMember.findMany({
      where: {
        userId: user.id,
        circleId: { in: communities.map((c) => c.id) },
      },
      select: { circleId: true, role: true },
    });
    membershipMap = Object.fromEntries(memberships.map((m) => [m.circleId, m.role]));
  }

  const data = communities.map((community) => ({
    id: community.id,
    name: community.name,
    description: community.description,
    image: community.image,
    category: community.category,
    topic: community.topic,
    city: community.city,
    isPublic: community.isPublic,
    creatorId: community.creatorId,
    createdAt: community.createdAt.toISOString(),
    memberCount: community._count.members,
    messageCount: community._count.messages,
    myRole: membershipMap[community.id] || null,
  }));

  return c.json({ data: { communities: data, total } });
});

// ─── POST / — Create a community ────────────────────────────────────────────
const createSchema = z.object({
  name: z.string().min(1).max(100),
  description: z.string().max(2000).optional(),
  category: z.string().max(50).optional(),
  isPublic: z.boolean().optional().default(true),
  image: z.string().url().optional(),
  topic: z.string().max(200).optional(),
  city: z.string().max(100).optional(),
});

communitiesRouter.post("/", zValidator("json", createSchema), async (c) => {
  const user = c.get("user");
  if (!user) return c.json({ error: { message: "No autorizado" } }, 401);

  const body = c.req.valid("json");

  const community = await prisma.circle.create({
    data: {
      creatorId: user.id,
      name: body.name,
      description: body.description || null,
      category: body.category || null,
      isPublic: body.isPublic,
      image: body.image || null,
      topic: body.topic || null,
      city: body.city || null,
      members: {
        create: {
          userId: user.id,
          role: "admin",
        },
      },
    },
    include: {
      _count: { select: { members: true, messages: true } },
    },
  });

  return c.json({
    data: {
      id: community.id,
      name: community.name,
      description: community.description,
      image: community.image,
      category: community.category,
      topic: community.topic,
      city: community.city,
      isPublic: community.isPublic,
      creatorId: community.creatorId,
      createdAt: community.createdAt.toISOString(),
      memberCount: community._count.members,
      messageCount: community._count.messages,
      myRole: "admin" as const,
    },
  });
});

// ─── GET /:id — Get community details ───────────────────────────────────────
communitiesRouter.get("/:id", async (c) => {
  const { id } = c.req.param();

  const community = await prisma.circle.findUnique({
    where: { id },
    include: {
      _count: { select: { members: true, messages: true } },
      members: {
        take: 20,
        orderBy: { joinedAt: "asc" },
        include: {
          user: { select: { id: true, name: true, image: true, username: true } },
        },
      },
    },
  });

  if (!community) {
    return c.json({ error: { message: "Comunidad no encontrada" } }, 404);
  }

  // Check if current user is a member
  const user = c.get("user");
  let myRole: string | null = null;
  if (user) {
    const membership = await prisma.circleMember.findUnique({
      where: { circleId_userId: { circleId: id, userId: user.id } },
    });
    myRole = membership?.role || null;
  }

  // If community is private and user is not a member, restrict info
  if (!community.isPublic && !myRole) {
    return c.json({
      data: {
        id: community.id,
        name: community.name,
        description: community.description,
        image: community.image,
        category: community.category,
        isPublic: community.isPublic,
        creatorId: community.creatorId,
        createdAt: community.createdAt.toISOString(),
        memberCount: community._count.members,
        messageCount: 0,
        myRole: null,
        members: [],
      },
    });
  }

  return c.json({
    data: {
      id: community.id,
      name: community.name,
      description: community.description,
      image: community.image,
      category: community.category,
      topic: community.topic,
      city: community.city,
      isPublic: community.isPublic,
      creatorId: community.creatorId,
      createdAt: community.createdAt.toISOString(),
      memberCount: community._count.members,
      messageCount: community._count.messages,
      myRole,
      members: community.members.map((m) => ({
        id: m.id,
        userId: m.user.id,
        name: m.user.name,
        image: m.user.image,
        username: m.user.username,
        role: m.role,
        joinedAt: m.joinedAt.toISOString(),
      })),
    },
  });
});

// ─── POST /:id/join — Join a community ──────────────────────────────────────
communitiesRouter.post("/:id/join", async (c) => {
  const user = c.get("user");
  if (!user) return c.json({ error: { message: "No autorizado" } }, 401);

  const { id } = c.req.param();

  const community = await prisma.circle.findUnique({ where: { id } });
  if (!community) {
    return c.json({ error: { message: "Comunidad no encontrada" } }, 404);
  }

  // Check if already a member
  const existing = await prisma.circleMember.findUnique({
    where: { circleId_userId: { circleId: id, userId: user.id } },
  });
  if (existing) {
    return c.json({ error: { message: "Ya eres miembro de esta comunidad" } }, 409);
  }

  const member = await prisma.circleMember.create({
    data: {
      circleId: id,
      userId: user.id,
      role: "member",
    },
  });

  return c.json({
    data: {
      id: member.id,
      circleId: member.circleId,
      userId: member.userId,
      role: member.role,
      joinedAt: member.joinedAt.toISOString(),
    },
  });
});

// ─── POST /:id/leave — Leave a community ───────────────────────────────────
communitiesRouter.post("/:id/leave", async (c) => {
  const user = c.get("user");
  if (!user) return c.json({ error: { message: "No autorizado" } }, 401);

  const { id } = c.req.param();

  const membership = await prisma.circleMember.findUnique({
    where: { circleId_userId: { circleId: id, userId: user.id } },
  });

  if (!membership) {
    return c.json({ error: { message: "No eres miembro de esta comunidad" } }, 404);
  }

  // Prevent the creator/sole admin from leaving
  const community = await prisma.circle.findUnique({ where: { id } });
  if (community && community.creatorId === user.id) {
    // Check if there are other admins
    const adminCount = await prisma.circleMember.count({
      where: { circleId: id, role: "admin" },
    });
    if (adminCount <= 1) {
      return c.json({
        error: { message: "No puedes salir siendo el unico administrador. Transfiere el rol primero." },
      }, 400);
    }
  }

  await prisma.circleMember.delete({
    where: { circleId_userId: { circleId: id, userId: user.id } },
  });

  return c.json({ data: { success: true } });
});

// ─── GET /:id/messages — Get paginated messages ─────────────────────────────
communitiesRouter.get("/:id/messages", async (c) => {
  const user = c.get("user");
  if (!user) return c.json({ error: { message: "No autorizado" } }, 401);

  const { id } = c.req.param();
  const limit = Math.min(parseInt(c.req.query("limit") || "50", 10), 100);
  const cursor = c.req.query("cursor"); // message ID for cursor-based pagination

  // Verify membership
  const membership = await prisma.circleMember.findUnique({
    where: { circleId_userId: { circleId: id, userId: user.id } },
  });
  if (!membership) {
    // Allow reading public community messages
    const community = await prisma.circle.findUnique({ where: { id } });
    if (!community || !community.isPublic) {
      return c.json({ error: { message: "No tienes acceso a esta comunidad" } }, 403);
    }
  }

  const where: Record<string, unknown> = { circleId: id };
  if (cursor) {
    const cursorMessage = await prisma.circleMessage.findUnique({ where: { id: cursor } });
    if (cursorMessage) {
      where.createdAt = { lt: cursorMessage.createdAt };
    }
  }

  const messages = await prisma.circleMessage.findMany({
    where: where as any,
    orderBy: { createdAt: "desc" },
    take: limit + 1, // Fetch one extra to check if there are more
  });

  const hasMore = messages.length > limit;
  const result = hasMore ? messages.slice(0, limit) : messages;
  const nextCursor = hasMore && result.length > 0 ? result[result.length - 1]!.id : null;

  return c.json({
    data: {
      messages: result.map((m) => ({
        id: m.id,
        circleId: m.circleId,
        userId: m.userId,
        content: m.content,
        fileUrl: m.fileUrl,
        fileType: m.fileType,
        userName: m.userName,
        userImage: m.userImage,
        createdAt: m.createdAt.toISOString(),
      })),
      nextCursor,
    },
  });
});

// ─── POST /:id/messages — Send a message ────────────────────────────────────
const messageSchema = z.object({
  content: z.string().min(1).max(5000),
  fileUrl: z.string().url().optional(),
  fileType: z.enum(["image", "video", "audio", "file"]).optional(),
});

communitiesRouter.post("/:id/messages", zValidator("json", messageSchema), async (c) => {
  const user = c.get("user");
  if (!user) return c.json({ error: { message: "No autorizado" } }, 401);

  const { id } = c.req.param();

  // Verify membership
  const membership = await prisma.circleMember.findUnique({
    where: { circleId_userId: { circleId: id, userId: user.id } },
  });
  if (!membership) {
    return c.json({ error: { message: "Debes ser miembro para enviar mensajes" } }, 403);
  }

  const body = c.req.valid("json");

  const message = await prisma.circleMessage.create({
    data: {
      circleId: id,
      userId: user.id,
      content: body.content,
      fileUrl: body.fileUrl || null,
      fileType: body.fileType || null,
      userName: user.name,
      userImage: user.image || null,
    },
  });

  return c.json({
    data: {
      id: message.id,
      circleId: message.circleId,
      userId: message.userId,
      content: message.content,
      fileUrl: message.fileUrl,
      fileType: message.fileType,
      userName: message.userName,
      userImage: message.userImage,
      createdAt: message.createdAt.toISOString(),
    },
  });
});

export { communitiesRouter };
