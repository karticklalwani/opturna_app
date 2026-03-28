import { Hono } from "hono";
import { z } from "zod";
import { zValidator } from "@hono/zod-validator";
import { prisma } from "../prisma";

const mediaRouter = new Hono();

const UPLOADS_DIR = "/home/user/workspace/backend/uploads";

// ─── Algorithm Score Calculator ──────────────────────────────────────────────
async function recalculateScore(postId: string) {
  const post = await prisma.mediaPost.findUnique({
    where: { id: postId },
    include: {
      _count: { select: { likes: true, comments: true, saves: true, viewLogs: true } },
      viewLogs: { select: { completed: true, watchTime: true } },
    },
  });
  if (!post) return;

  const likeScore = post._count.likes * 3;
  const commentScore = post._count.comments * 5;
  const saveScore = post._count.saves * 4;
  const watchScore = post.viewLogs.reduce((acc, v) => acc + (v.watchTime || 0), 0) / 10;
  const engagementScore = likeScore + commentScore + saveScore;
  const totalScore = post._count.viewLogs + engagementScore + watchScore;

  await prisma.mediaAlgorithmScore.upsert({
    where: { postId },
    create: { postId, score: totalScore, engagementScore, watchScore, likeScore, commentScore, saveScore },
    update: { score: totalScore, engagementScore, watchScore, likeScore, commentScore, saveScore },
  });

  await prisma.mediaPost.update({
    where: { id: postId },
    data: { score: totalScore },
  });
}

// Seed endpoint removed — users create their own content

// ─── POST /api/media/upload ───────────────────────────────────────────────────
mediaRouter.post("/upload", async (c) => {

  const videoPosts = [
    {
      userId: "user_alex",
      type: "reel",
      url: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerFun.mp4",
      thumbnailUrl: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=600&h=900&fit=crop",
      caption: "El secreto de los empresarios exitosos: no es el capital, es la mentalidad. En 60 segundos te explico cómo cambié mi perspectiva y tripliqué mis ingresos 🚀 #emprendimiento #mindset #negocios",
      duration: 60,
      category: "business",
      tags: JSON.stringify(["emprendimiento", "mindset", "negocios"]),
      authorName: "Alejandro Martín",
      authorAvatar: "https://images.unsplash.com/photo-1560250097-0b93528c311a?w=100&h=100&fit=crop&crop=face",
      authorUsername: "alejandro_martin",
      views: 12400,
      likesCount: 3200,
      commentsCount: 145,
      score: 28500,
    },
    {
      userId: "user_sofia",
      type: "reel",
      url: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4",
      thumbnailUrl: "https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?w=600&h=900&fit=crop",
      caption: "📈 El patrón gráfico que he usado esta semana para ganar un 8.4% en EUR/USD. Análisis técnico real, sin humo. ¿Lo conocías? #trading #forex #analisisTecnico",
      duration: 45,
      category: "trading",
      tags: JSON.stringify(["trading", "forex", "análisis técnico"]),
      authorName: "Sofía Vega",
      authorAvatar: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=100&h=100&fit=crop&crop=face",
      authorUsername: "sofia_vega",
      views: 8900,
      likesCount: 2100,
      commentsCount: 89,
      score: 21000,
    },
    {
      userId: "user_carlos",
      type: "reel",
      url: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerEscapes.mp4",
      thumbnailUrl: "https://images.unsplash.com/photo-1677442135703-1787eea5ce01?w=600&h=900&fit=crop",
      caption: "La IA que ya está sustituyendo trabajos y nadie habla de ello 👀 Te explico qué está pasando realmente en Silicon Valley #IA #tecnología #futuro",
      duration: 90,
      category: "ai",
      tags: JSON.stringify(["inteligencia artificial", "tecnología", "futuro"]),
      authorName: "Carlos Rueda",
      authorAvatar: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&h=100&fit=crop&crop=face",
      authorUsername: "carlos_rueda",
      views: 22300,
      likesCount: 5600,
      commentsCount: 312,
      score: 51000,
    },
    {
      userId: "user_maria",
      type: "video",
      url: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4",
      thumbnailUrl: "https://images.unsplash.com/photo-1519389950473-47ba0277781c?w=600&h=900&fit=crop",
      caption: "Por qué el 95% de las startups fallan en los primeros 2 años (y cómo evitarlo). Habla con usuarios ANTES de construir el producto 🎯 #startup #emprendimiento #producto",
      duration: 120,
      category: "startups",
      tags: JSON.stringify(["startup", "emprendimiento", "producto"]),
      authorName: "María Torres",
      authorAvatar: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=100&h=100&fit=crop&crop=face",
      authorUsername: "maria_torres",
      views: 15600,
      likesCount: 4100,
      commentsCount: 203,
      score: 38000,
    },
    {
      userId: "user_luis",
      type: "reel",
      url: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/SubaruOutbackOnStreetAndDirt.mp4",
      thumbnailUrl: "https://images.unsplash.com/photo-1551434678-e076c223a692?w=600&h=900&fit=crop",
      caption: "3 libros que cambiaron mi forma de pensar sobre el dinero 💰 Los leo cada año. ¿Cuál es tu favorito? #finanzas #educaciónFinanciera #libros #mentalidadRica",
      duration: 30,
      category: "finance",
      tags: JSON.stringify(["finanzas", "educación financiera", "libros"]),
      authorName: "Luis García",
      authorAvatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop&crop=face",
      authorUsername: "luis_garcia",
      views: 9800,
      likesCount: 2800,
      commentsCount: 156,
      score: 25000,
    },
    {
      userId: "user_alex",
      type: "image",
      url: "https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=1080&h=1350&fit=crop",
      thumbnailUrl: "https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=600&h=900&fit=crop",
      caption: "Mi setup de trabajo en 2024. Minimalismo + productividad máxima. ¿Qué herramienta no puede faltar en tu escritorio? 👨‍💻 #setup #productividad #workspace",
      category: "productivity",
      tags: JSON.stringify(["setup", "productividad", "workspace"]),
      authorName: "Alejandro Martín",
      authorAvatar: "https://images.unsplash.com/photo-1560250097-0b93528c311a?w=100&h=100&fit=crop&crop=face",
      authorUsername: "alejandro_martin",
      views: 6700,
      likesCount: 1900,
      commentsCount: 78,
      score: 16000,
    },
    {
      userId: "user_sofia",
      type: "image",
      url: "https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?w=1080&h=1350&fit=crop",
      thumbnailUrl: "https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?w=600&h=900&fit=crop",
      caption: "Chart del día 📊 Confluencia de niveles clave en SPX. Vigilad este soporte esta semana. #trading #SPX #análisis",
      category: "trading",
      tags: JSON.stringify(["trading", "análisis", "SPX"]),
      authorName: "Sofía Vega",
      authorAvatar: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=100&h=100&fit=crop&crop=face",
      authorUsername: "sofia_vega",
      views: 4500,
      likesCount: 1200,
      commentsCount: 45,
      score: 11000,
    },
  ];

  const createdPosts: Array<{ id: string }> = [];
  for (const postData of videoPosts) {
    const post = await prisma.mediaPost.create({ data: postData });
    await prisma.mediaAlgorithmScore.create({
      data: {
        postId: post.id,
        score: postData.score,
        likeScore: postData.likesCount * 3,
        commentScore: postData.commentsCount * 5,
        saveScore: 0,
        watchScore: postData.views * 0.5,
        engagementScore: postData.likesCount * 3 + postData.commentsCount * 5,
      },
    });
    createdPosts.push(post);
  }

  // Seed comments for first post
  if (createdPosts[0]) {
    await prisma.mediaComment.createMany({
      data: [
        { postId: createdPosts[0].id, userId: "user_sofia", content: "Completamente de acuerdo. La mentalidad lo es todo 🔥", authorName: "Sofía Vega", authorAvatar: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=100&h=100&fit=crop&crop=face" },
        { postId: createdPosts[0].id, userId: "user_carlos", content: "¿Puedes hacer un vídeo más largo explicando cómo empezaste?", authorName: "Carlos Rueda", authorAvatar: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&h=100&fit=crop&crop=face" },
        { postId: createdPosts[0].id, userId: "user_maria", content: "Me llega esto justo cuando lo necesitaba 🙏 Gracias!", authorName: "María Torres", authorAvatar: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=100&h=100&fit=crop&crop=face" },
      ],
    });
  }

  // Seed stories (valid for next 24h)
  const storyExpiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);
  await prisma.story.createMany({
    data: [
      {
        userId: "user_alex",
        url: "https://images.unsplash.com/photo-1560250097-0b93528c311a?w=600&h=1067&fit=crop",
        type: "image",
        caption: "Día productivo en Madrid 🚀",
        authorName: "Alejandro Martín",
        authorAvatar: "https://images.unsplash.com/photo-1560250097-0b93528c311a?w=100&h=100&fit=crop&crop=face",
        authorUsername: "alejandro_martin",
        expiresAt: storyExpiresAt,
        views: 432,
      },
      {
        userId: "user_sofia",
        url: "https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?w=600&h=1067&fit=crop",
        type: "image",
        caption: "Analizando los mercados 📈",
        authorName: "Sofía Vega",
        authorAvatar: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=100&h=100&fit=crop&crop=face",
        authorUsername: "sofia_vega",
        expiresAt: storyExpiresAt,
        views: 287,
      },
      {
        userId: "user_carlos",
        url: "https://images.unsplash.com/photo-1677442135703-1787eea5ce01?w=600&h=1067&fit=crop",
        type: "image",
        caption: "Nuevo modelo de IA probado 🤖",
        authorName: "Carlos Rueda",
        authorAvatar: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&h=100&fit=crop&crop=face",
        authorUsername: "carlos_rueda",
        expiresAt: storyExpiresAt,
        views: 198,
      },
      {
        userId: "user_maria",
        url: "https://images.unsplash.com/photo-1519389950473-47ba0277781c?w=600&h=1067&fit=crop",
        type: "image",
        caption: "Pitch day en Barcelona 🎯",
        authorName: "María Torres",
        authorAvatar: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=100&h=100&fit=crop&crop=face",
        authorUsername: "maria_torres",
        expiresAt: storyExpiresAt,
        views: 154,
      },
    ],
  });

  return c.json({ data: { message: "Media seed complete", posts: createdPosts.length } });
});

// ─── POST /api/media/upload ───────────────────────────────────────────────────
mediaRouter.post("/upload", async (c) => {
  try {
    const formData = await c.req.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return c.json({ error: { message: "No file provided" } }, 400);
    }

    const allowedTypes = ["video/mp4", "video/quicktime", "video/webm", "image/jpeg", "image/png", "image/webp", "image/gif"];
    if (!allowedTypes.includes(file.type)) {
      return c.json({ error: { message: "Invalid file type" } }, 400);
    }

    const maxSize = file.type.startsWith("video/") ? 100 * 1024 * 1024 : 10 * 1024 * 1024;
    if (file.size > maxSize) {
      return c.json({ error: { message: "File too large" } }, 400);
    }

    const ext = file.name.split(".").pop() || (file.type.startsWith("video/") ? "mp4" : "jpg");
    const filename = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
    const subdir = file.type.startsWith("video/") ? "videos" : "images";
    const dirPath = `${UPLOADS_DIR}/${subdir}`;

    await Bun.write(`${dirPath}/.keep`, "");

    const filePath = `${dirPath}/${filename}`;
    await Bun.write(filePath, await file.arrayBuffer());

    const backendUrl = process.env.BACKEND_URL || `http://localhost:3000`;
    const url = `${backendUrl}/uploads/${subdir}/${filename}`;

    return c.json({ data: { url, filename, size: file.size, mimeType: file.type } });
  } catch (err) {
    console.error("Upload error:", err);
    return c.json({ error: { message: "Upload failed" } }, 500);
  }
});

// ─── POST /api/media/stories ──────────────────────────────────────────────────
mediaRouter.post(
  "/stories",
  zValidator("json", z.object({
    userId: z.string(),
    url: z.string().url(),
    type: z.enum(["image", "video"]).default("image"),
    caption: z.string().optional(),
    authorName: z.string().optional(),
    authorAvatar: z.string().optional(),
    authorUsername: z.string().optional(),
  })),
  async (c) => {
    const data = c.req.valid("json");
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24h
    const story = await prisma.story.create({ data: { ...data, expiresAt } });
    return c.json({ data: story }, 201);
  }
);

// ─── GET /api/media/feed ──────────────────────────────────────────────────────
mediaRouter.get(
  "/feed",
  zValidator("query", z.object({ limit: z.string().optional(), offset: z.string().optional(), category: z.string().optional() })),
  async (c) => {
    const { limit, offset, category } = c.req.valid("query");
    const take = parseInt(limit || "10");
    const skip = parseInt(offset || "0");

    const where: { isPublic: boolean; category?: string } = { isPublic: true };
    if (category) where.category = category;

    const posts = await prisma.mediaPost.findMany({
      where,
      take,
      skip,
      orderBy: [{ score: "desc" }, { createdAt: "desc" }],
      include: { _count: { select: { likes: true, comments: true, saves: true } } },
    });
    const total = await prisma.mediaPost.count({ where });

    return c.json({ data: { posts, total } });
  }
);

// ─── GET /api/media/reels ─────────────────────────────────────────────────────
mediaRouter.get(
  "/reels",
  zValidator("query", z.object({ limit: z.string().optional(), offset: z.string().optional() })),
  async (c) => {
    const { limit, offset } = c.req.valid("query");
    const take = parseInt(limit || "20");
    const skip = parseInt(offset || "0");

    const posts = await prisma.mediaPost.findMany({
      where: { isPublic: true, type: { in: ["reel", "video"] } },
      take,
      skip,
      orderBy: [{ score: "desc" }, { createdAt: "desc" }],
      include: { _count: { select: { likes: true, comments: true } } },
    });

    return c.json({ data: { posts, total: posts.length } });
  }
);

// ─── GET /api/media/discover ──────────────────────────────────────────────────
mediaRouter.get("/discover", async (c) => {
  const [trending, recent, images] = await Promise.all([
    prisma.mediaPost.findMany({
      where: { isPublic: true },
      take: 6,
      orderBy: { score: "desc" },
      include: { _count: { select: { likes: true } } },
    }),
    prisma.mediaPost.findMany({
      where: { isPublic: true },
      take: 10,
      orderBy: { createdAt: "desc" },
      include: { _count: { select: { likes: true } } },
    }),
    prisma.mediaPost.findMany({
      where: { isPublic: true, type: "image" },
      take: 6,
      orderBy: { score: "desc" },
      include: { _count: { select: { likes: true } } },
    }),
  ]);

  return c.json({ data: { trending, recent, images } });
});

// ─── GET /api/media/stories ───────────────────────────────────────────────────
mediaRouter.get("/stories", async (c) => {
  const now = new Date();
  const stories = await prisma.story.findMany({
    where: { expiresAt: { gt: now } },
    orderBy: { createdAt: "desc" },
    include: { _count: { select: { storyViews: true } } },
  });
  return c.json({ data: stories });
});

// ─── POST /api/media ──────────────────────────────────────────────────────────
mediaRouter.post(
  "/",
  zValidator("json", z.object({
    userId: z.string(),
    type: z.enum(["video", "image", "reel"]).default("video"),
    url: z.string().url(),
    thumbnailUrl: z.string().optional(),
    caption: z.string().max(2200).optional(),
    duration: z.number().optional(),
    category: z.string().optional(),
    tags: z.string().optional(),
    authorName: z.string().optional(),
    authorAvatar: z.string().optional(),
    authorUsername: z.string().optional(),
  })),
  async (c) => {
    const data = c.req.valid("json");
    const post = await prisma.mediaPost.create({ data });

    await prisma.mediaAlgorithmScore.create({
      data: { postId: post.id, score: 0, engagementScore: 0, watchScore: 0, likeScore: 0, commentScore: 0, saveScore: 0 },
    });

    return c.json({ data: post }, 201);
  }
);

// ─── GET /api/media/:id ───────────────────────────────────────────────────────
mediaRouter.get("/:id", async (c) => {
  const { id } = c.req.param();
  const post = await prisma.mediaPost.findUnique({
    where: { id },
    include: {
      _count: { select: { likes: true, comments: true, saves: true } },
      algorithm: true,
    },
  });
  if (!post) return c.json({ error: { message: "Post not found" } }, 404);
  return c.json({ data: post });
});

// ─── POST /api/media/:id/like ─────────────────────────────────────────────────
mediaRouter.post("/:id/like", async (c) => {
  const { id } = c.req.param();
  const body = await c.req.json().catch(() => ({}));
  const userId = (body as { userId?: string }).userId || "anonymous";

  const existing = await prisma.mediaLike.findUnique({
    where: { userId_postId: { userId, postId: id } },
  });

  let liked: boolean;
  if (existing) {
    await prisma.mediaLike.delete({ where: { userId_postId: { userId, postId: id } } });
    await prisma.mediaPost.update({ where: { id }, data: { likesCount: { decrement: 1 } } });
    liked = false;
  } else {
    await prisma.mediaLike.create({ data: { userId, postId: id } });
    await prisma.mediaPost.update({ where: { id }, data: { likesCount: { increment: 1 } } });
    liked = true;
  }

  const post = await prisma.mediaPost.findUnique({ where: { id }, select: { likesCount: true } });
  await recalculateScore(id);

  return c.json({ data: { liked, likesCount: post?.likesCount ?? 0 } });
});

// ─── POST /api/media/:id/view ─────────────────────────────────────────────────
mediaRouter.post("/:id/view", async (c) => {
  const { id } = c.req.param();
  const body = await c.req.json().catch(() => ({}));
  const { userId, watchTime, completed } = body as { userId?: string; watchTime?: number; completed?: boolean };

  await prisma.mediaView.create({
    data: { postId: id, userId: userId || null, watchTime: watchTime || 0, completed: completed || false },
  });
  await prisma.mediaPost.update({ where: { id }, data: { views: { increment: 1 } } });
  await recalculateScore(id);

  return c.json({ data: { success: true } });
});

// ─── GET /api/media/:id/comments ─────────────────────────────────────────────
mediaRouter.get("/:id/comments", async (c) => {
  const { id } = c.req.param();
  const comments = await prisma.mediaComment.findMany({
    where: { postId: id },
    orderBy: { createdAt: "desc" },
    take: 50,
  });
  return c.json({ data: comments });
});

// ─── POST /api/media/:id/comment ─────────────────────────────────────────────
mediaRouter.post(
  "/:id/comment",
  zValidator("json", z.object({
    userId: z.string(),
    content: z.string().min(1).max(500),
    authorName: z.string().optional(),
    authorAvatar: z.string().optional(),
  })),
  async (c) => {
    const { id } = c.req.param();
    const { userId, content, authorName, authorAvatar } = c.req.valid("json");

    const comment = await prisma.mediaComment.create({
      data: { postId: id, userId, content, authorName, authorAvatar },
    });
    await prisma.mediaPost.update({ where: { id }, data: { commentsCount: { increment: 1 } } });
    await recalculateScore(id);

    return c.json({ data: comment });
  }
);

// ─── POST /api/media/:id/save ─────────────────────────────────────────────────
mediaRouter.post("/:id/save", async (c) => {
  const { id } = c.req.param();
  const body = await c.req.json().catch(() => ({}));
  const userId = (body as { userId?: string }).userId || "anonymous";

  const existing = await prisma.mediaSave.findUnique({
    where: { userId_postId: { userId, postId: id } },
  });

  let saved: boolean;
  if (existing) {
    await prisma.mediaSave.delete({ where: { userId_postId: { userId, postId: id } } });
    await prisma.mediaPost.update({ where: { id }, data: { savesCount: { decrement: 1 } } });
    saved = false;
  } else {
    await prisma.mediaSave.create({ data: { userId, postId: id } });
    await prisma.mediaPost.update({ where: { id }, data: { savesCount: { increment: 1 } } });
    saved = true;
  }

  return c.json({ data: { saved } });
});

export { mediaRouter };
