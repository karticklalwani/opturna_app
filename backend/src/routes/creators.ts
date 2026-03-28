import { Hono } from "hono";
import { z } from "zod";
import { zValidator } from "@hono/zod-validator";
import { prisma } from "../prisma";

const creatorsRouter = new Hono();

// GET /api/creators - list with filters
creatorsRouter.get(
  "/",
  zValidator(
    "query",
    z.object({
      category: z.string().optional(),
      type: z.string().optional(),
      featured: z.string().optional(),
      partner: z.string().optional(),
      search: z.string().optional(),
      limit: z.string().optional(),
      offset: z.string().optional(),
    })
  ),
  async (c) => {
    const { category, type, featured, partner, search, limit, offset } = c.req.valid("query");

    const where: any = { status: "published" };
    if (category) where.category = category;
    if (type) where.type = type;
    if (featured === "true") where.featured = true;
    if (partner === "true") where.officialPartner = true;
    if (search) {
      where.OR = [
        { name: { contains: search } },
        { shortBio: { contains: search } },
        { tags: { contains: search } },
      ];
    }

    const take = parseInt(limit || "20");
    const skip = parseInt(offset || "0");

    const [creators, total] = await Promise.all([
      prisma.creatorProfile.findMany({
        where,
        take,
        skip,
        orderBy: [{ featured: "desc" }, { followersCount: "desc" }, { createdAt: "desc" }],
        include: {
          _count: { select: { follows: true, posts: true, videos: true } },
        },
      }),
      prisma.creatorProfile.count({ where }),
    ]);

    return c.json({ data: { creators, total } });
  }
);

// GET /api/creators/categories - all categories
creatorsRouter.get("/categories", async (c) => {
  const categories = [
    { slug: "business", name: "Negocios", icon: "briefcase" },
    { slug: "finance", name: "Finanzas", icon: "trending-up" },
    { slug: "trading", name: "Trading", icon: "bar-chart-2" },
    { slug: "startups", name: "Startups", icon: "rocket" },
    { slug: "ai", name: "Inteligencia Artificial", icon: "cpu" },
    { slug: "creator", name: "Creadores", icon: "star" },
    { slug: "education", name: "Educación", icon: "book-open" },
    { slug: "mindset", name: "Mindset", icon: "brain" },
    { slug: "productivity", name: "Productividad", icon: "zap" },
    { slug: "investing", name: "Inversión", icon: "dollar-sign" },
  ];
  return c.json({ data: categories });
});

// GET /api/creators/interviews - featured interviews
creatorsRouter.get("/interviews", async (c) => {
  const interviews = await prisma.creatorInterview.findMany({
    take: 20,
    orderBy: [{ featured: "desc" }, { publishedAt: "desc" }],
    include: { creator: { select: { name: true, slug: true, avatarUrl: true, verified: true } } },
  });
  return c.json({ data: interviews });
});

// GET /api/creators/lives - upcoming lives
creatorsRouter.get("/lives", async (c) => {
  const lives = await prisma.creatorLive.findMany({
    where: { status: { in: ["upcoming", "live"] } },
    orderBy: [{ status: "asc" }, { scheduledAt: "asc" }],
    include: { creator: { select: { name: true, slug: true, avatarUrl: true, verified: true } } },
  });
  return c.json({ data: lives });
});

// GET /api/creators/:slug - creator profile
creatorsRouter.get("/:slug", async (c) => {
  const { slug } = c.req.param();

  const creator = await prisma.creatorProfile.findUnique({
    where: { slug },
    include: {
      posts: { where: { visibility: "public" }, orderBy: [{ isPinned: "desc" }, { publishedAt: "desc" }], take: 10 },
      videos: { orderBy: [{ featured: "desc" }, { publishedAt: "desc" }], take: 10 },
      interviews: { orderBy: [{ featured: "desc" }, { publishedAt: "desc" }], take: 10 },
      lives: { orderBy: [{ scheduledAt: "asc" }], take: 10 },
      projects: { orderBy: [{ featured: "desc" }, { createdAt: "desc" }] },
      collaborations: { where: { status: { in: ["active", "completed"] } }, orderBy: [{ featured: "desc" }, { createdAt: "desc" }] },
      _count: { select: { follows: true, posts: true, videos: true } },
    },
  });

  if (!creator) return c.json({ error: { message: "Creator not found" } }, 404);

  return c.json({ data: creator });
});

// GET /api/creators/:slug/posts
creatorsRouter.get("/:slug/posts", async (c) => {
  const { slug } = c.req.param();
  const creator = await prisma.creatorProfile.findUnique({ where: { slug } });
  if (!creator) return c.json({ error: { message: "Creator not found" } }, 404);

  const posts = await prisma.creatorPost.findMany({
    where: { creatorProfileId: creator.id, visibility: "public" },
    orderBy: [{ isPinned: "desc" }, { publishedAt: "desc" }],
  });
  return c.json({ data: posts });
});

// GET /api/creators/:slug/videos
creatorsRouter.get("/:slug/videos", async (c) => {
  const { slug } = c.req.param();
  const creator = await prisma.creatorProfile.findUnique({ where: { slug } });
  if (!creator) return c.json({ error: { message: "Creator not found" } }, 404);

  const videos = await prisma.creatorVideo.findMany({
    where: { creatorProfileId: creator.id },
    orderBy: [{ featured: "desc" }, { publishedAt: "desc" }],
  });
  return c.json({ data: videos });
});

// GET /api/creators/:slug/interviews
creatorsRouter.get("/:slug/interviews", async (c) => {
  const { slug } = c.req.param();
  const creator = await prisma.creatorProfile.findUnique({ where: { slug } });
  if (!creator) return c.json({ error: { message: "Creator not found" } }, 404);

  const interviews = await prisma.creatorInterview.findMany({
    where: { creatorProfileId: creator.id },
    orderBy: [{ featured: "desc" }, { publishedAt: "desc" }],
  });
  return c.json({ data: interviews });
});

// Seed endpoint removed — users create their own content

export { creatorsRouter };
