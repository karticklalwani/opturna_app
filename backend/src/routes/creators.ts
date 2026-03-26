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

// POST /api/creators/seed - Seed demo data (dev only)
creatorsRouter.post("/seed", async (c) => {
  // Delete existing seed data
  await prisma.creatorBookmark.deleteMany({});
  await prisma.creatorFollow.deleteMany({});
  await prisma.collaboration.deleteMany({});
  await prisma.creatorProject.deleteMany({});
  await prisma.creatorLive.deleteMany({});
  await prisma.creatorInterview.deleteMany({});
  await prisma.creatorVideo.deleteMany({});
  await prisma.creatorPost.deleteMany({});
  await prisma.creatorProfile.deleteMany({});

  // Seed creators
  const alex = await prisma.creatorProfile.create({
    data: {
      type: "person",
      name: "Alejandro Martín",
      username: "alejandro_martin",
      slug: "alejandro-martin",
      avatarUrl: "https://images.unsplash.com/photo-1560250097-0b93528c311a?w=400&h=400&fit=crop",
      bannerUrl: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=1200&h=400&fit=crop",
      shortBio: "Empresario, podcaster y fundador. Construyendo el futuro desde cero.",
      fullBio: "Alejandro Martín es empresario serial, podcaster con más de 500k oyentes y fundador de tres startups en el sector fintech y edtech. Su misión: democratizar el acceso al conocimiento financiero y empresarial en España y Latinoamérica.",
      category: "business",
      tags: JSON.stringify(["emprendimiento", "finanzas", "podcast", "startups", "mindset"]),
      verified: true,
      featured: true,
      officialPartner: true,
      websiteUrl: "https://alejandromartin.com",
      youtubeUrl: "https://youtube.com/@alejandromartin",
      podcastUrl: "https://podcasts.apple.com/alejandromartin",
      instagramUrl: "https://instagram.com/alejandro_martin",
      xUrl: "https://x.com/alejandro_martin",
      linkedinUrl: "https://linkedin.com/in/alejandromartin",
      location: "Madrid, España",
      companyName: "Opturna Partner",
      followersCount: 52400,
      status: "published",
    },
  });

  const sofia = await prisma.creatorProfile.create({
    data: {
      type: "person",
      name: "Sofía Vega",
      username: "sofia_vega",
      slug: "sofia-vega",
      avatarUrl: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=400&h=400&fit=crop",
      bannerUrl: "https://images.unsplash.com/photo-1611532736597-de2d4265fba3?w=1200&h=400&fit=crop",
      shortBio: "Inversora, trader profesional y fundadora de una academia de trading.",
      fullBio: "Sofía Vega es trader profesional con 10 años de experiencia en mercados financieros globales. Fundó su academia de trading donde ha formado a más de 8.000 alumnos. Especialista en análisis técnico, gestión del riesgo y psicología del trading.",
      category: "trading",
      tags: JSON.stringify(["trading", "inversión", "academia", "forex", "cripto", "finanzas"]),
      verified: true,
      featured: true,
      officialPartner: false,
      websiteUrl: "https://sofiavega.com",
      youtubeUrl: "https://youtube.com/@sofiavegaTrading",
      instagramUrl: "https://instagram.com/sofia_vega_trading",
      xUrl: "https://x.com/sofiavega",
      location: "Barcelona, España",
      followersCount: 31200,
      status: "published",
    },
  });

  const carlos = await prisma.creatorProfile.create({
    data: {
      type: "person",
      name: "Carlos Rueda",
      username: "carlos_rueda",
      slug: "carlos-rueda",
      avatarUrl: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=400&h=400&fit=crop",
      bannerUrl: "https://images.unsplash.com/photo-1519389950473-47ba0277781c?w=1200&h=400&fit=crop",
      shortBio: "Fundador de startup, experto en IA y divulgador tecnológico.",
      fullBio: "Carlos Rueda es fundador de una startup de inteligencia artificial con presencia en 12 países. Anteriormente trabajo en Google y Meta. Cree firmemente que la IA transformará cada industria en los próximos 5 años.",
      category: "ai",
      tags: JSON.stringify(["inteligencia artificial", "tecnología", "startups", "innovación", "futuro"]),
      verified: true,
      featured: false,
      officialPartner: false,
      websiteUrl: "https://carlosrueda.io",
      youtubeUrl: "https://youtube.com/@carlosruedaai",
      xUrl: "https://x.com/carlos_rueda",
      linkedinUrl: "https://linkedin.com/in/carlosrueda",
      location: "San Francisco, USA",
      followersCount: 18900,
      status: "published",
    },
  });

  const nexoFin = await prisma.creatorProfile.create({
    data: {
      type: "company",
      name: "NexoFin",
      username: "nexofin",
      slug: "nexofin",
      avatarUrl: "https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?w=400&h=400&fit=crop",
      bannerUrl: "https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?w=1200&h=400&fit=crop",
      shortBio: "Plataforma de educación financiera premium para inversores modernos.",
      fullBio: "NexoFin es una plataforma educativa financiera que ofrece cursos, análisis de mercado, señales de trading y comunidad activa para inversores de todos los niveles.",
      category: "finance",
      tags: JSON.stringify(["educación financiera", "inversión", "bolsa", "cursos", "análisis"]),
      verified: true,
      featured: true,
      officialPartner: true,
      websiteUrl: "https://nexofin.com",
      youtubeUrl: "https://youtube.com/@nexofin",
      instagramUrl: "https://instagram.com/nexofin_oficial",
      location: "Madrid, España",
      companyName: "NexoFin S.L.",
      followersCount: 87500,
      status: "published",
    },
  });

  const apexProp = await prisma.creatorProfile.create({
    data: {
      type: "propfirm",
      name: "Apex Prop Trading",
      username: "apex_prop",
      slug: "apex-prop",
      avatarUrl: "https://images.unsplash.com/photo-1611532736597-de2d4265fba3?w=400&h=400&fit=crop",
      bannerUrl: "https://images.unsplash.com/photo-1611532736597-de2d4265fba3?w=1200&h=400&fit=crop",
      shortBio: "Prop firm líder. Financia a traders con capital de hasta $500K.",
      fullBio: "Apex Prop Trading es una de las prop firms más reconocidas del mundo. Financiamos a traders verificados con capital real para operar en los mercados. Evaluación transparente, splits competitivos y soporte 24/7.",
      category: "trading",
      tags: JSON.stringify(["prop firm", "trading", "capital", "forex", "futuros", "financiación"]),
      verified: true,
      featured: false,
      officialPartner: true,
      websiteUrl: "https://apexproptrading.com",
      instagramUrl: "https://instagram.com/apexproptrading",
      xUrl: "https://x.com/apexprop",
      location: "Chicago, USA",
      companyName: "Apex Prop Trading LLC",
      followersCount: 42300,
      status: "published",
    },
  });

  // Seed posts for Alejandro
  await prisma.creatorPost.createMany({
    data: [
      {
        creatorProfileId: alex.id,
        title: "El error más común al emprender",
        content: "Después de fundar tres startups, he aprendido que el mayor error no es técnico ni financiero. Es no validar el mercado antes de construir. Habla con 100 clientes antes de escribir una línea de código.",
        isPinned: true,
        isFeatured: true,
        publishedAt: new Date("2024-01-10"),
      },
      {
        creatorProfileId: alex.id,
        title: "Por qué lancé mi podcast",
        content: "Empecé el podcast porque no encontraba contenido en español que mezclara negocios reales con mentalidad ganadora. Hoy, 3 años después, tenemos 500k oyentes mensuales y seguimos creciendo.",
        publishedAt: new Date("2024-01-05"),
      },
      {
        creatorProfileId: alex.id,
        content: "El 90% de las startups no mueren por falta de capital. Mueren por falta de tracción y por equipos que no saben adaptarse. Cuida a tu equipo antes que a tu producto.",
        publishedAt: new Date("2023-12-28"),
      },
    ],
  });

  // Seed videos
  await prisma.creatorVideo.createMany({
    data: [
      {
        creatorProfileId: alex.id,
        title: "Cómo construí mi primera startup con €0",
        description: "La historia completa de cómo arranqué mi primer negocio desde cero, sin inversión inicial y con muchos errores por el camino.",
        thumbnailUrl: "https://images.unsplash.com/photo-1551434678-e076c223a692?w=600&h=340&fit=crop",
        videoUrl: "https://www.youtube.com/watch?v=example1",
        sourcePlatform: "youtube",
        duration: "42:15",
        featured: true,
        publishedAt: new Date("2024-01-08"),
      },
      {
        creatorProfileId: sofia.id,
        title: "Los 5 errores que destruyen a los traders novatos",
        description: "En este video analizo los errores más comunes que cometen los nuevos traders y cómo evitarlos.",
        thumbnailUrl: "https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?w=600&h=340&fit=crop",
        videoUrl: "https://www.youtube.com/watch?v=example2",
        sourcePlatform: "youtube",
        duration: "28:40",
        featured: true,
        publishedAt: new Date("2024-01-06"),
      },
      {
        creatorProfileId: carlos.id,
        title: "GPT-5 cambiará todo: lo que nadie te está diciendo",
        description: "Mi análisis profundo sobre las implicaciones de los modelos de lenguaje avanzados para el futuro del trabajo y los negocios.",
        thumbnailUrl: "https://images.unsplash.com/photo-1677442135703-1787eea5ce01?w=600&h=340&fit=crop",
        videoUrl: "https://www.youtube.com/watch?v=example3",
        sourcePlatform: "youtube",
        duration: "35:20",
        featured: false,
        publishedAt: new Date("2024-01-03"),
      },
    ],
  });

  // Seed interviews
  await prisma.creatorInterview.createMany({
    data: [
      {
        creatorProfileId: alex.id,
        title: "Alejandro Martín × Opturna: El futuro del emprendimiento digital",
        description: "Entrevista exclusiva donde Alejandro nos habla de su visión del emprendimiento, sus próximos proyectos y por qué se convirtió en partner oficial de Opturna.",
        thumbnailUrl: "https://images.unsplash.com/photo-1560250097-0b93528c311a?w=600&h=340&fit=crop",
        mediaUrl: "https://www.youtube.com/watch?v=example_interview1",
        interviewType: "video",
        partnerName: "Opturna",
        featured: true,
        publishedAt: new Date("2024-01-12"),
      },
      {
        creatorProfileId: sofia.id,
        title: "Sofía Vega: Cómo convertirse en trader profesional",
        description: "Podcast exclusivo con Sofía Vega donde desgrana su metodología de trading, su gestión emocional y sus consejos para traders en formación.",
        thumbnailUrl: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=600&h=340&fit=crop",
        mediaUrl: "https://podcasts.apple.com/example",
        interviewType: "podcast",
        partnerName: "Opturna",
        featured: true,
        publishedAt: new Date("2024-01-09"),
      },
      {
        creatorProfileId: carlos.id,
        title: "Carlos Rueda: La IA que viene y cómo prepararte",
        description: "Carlos nos explica qué tecnologías de IA debemos vigilar, cómo está afectando ya a los negocios y qué habilidades necesitarás en 2025.",
        thumbnailUrl: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=600&h=340&fit=crop",
        mediaUrl: "https://www.youtube.com/watch?v=example_interview3",
        interviewType: "video",
        partnerName: "Opturna",
        featured: false,
        publishedAt: new Date("2024-01-04"),
      },
      {
        creatorProfileId: nexoFin.id,
        title: "NexoFin × Opturna: Alianza para la educación financiera",
        description: "Presentación de la colaboración entre NexoFin y Opturna para llevar educación financiera de calidad a toda la comunidad.",
        thumbnailUrl: "https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?w=600&h=340&fit=crop",
        mediaUrl: "https://www.youtube.com/watch?v=example_interview4",
        interviewType: "video",
        partnerName: "Opturna",
        featured: false,
        publishedAt: new Date("2023-12-20"),
      },
    ],
  });

  // Seed lives
  await prisma.creatorLive.createMany({
    data: [
      {
        creatorProfileId: alex.id,
        title: "AMA: Pregúntame todo sobre startups y emprendimiento",
        description: "Sesión de preguntas y respuestas en vivo. Trae tus dudas sobre emprendimiento, negocios, captación de inversión y mucho más.",
        thumbnailUrl: "https://images.unsplash.com/photo-1560250097-0b93528c311a?w=600&h=340&fit=crop",
        status: "upcoming",
        scheduledAt: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000),
        featured: true,
      },
      {
        creatorProfileId: sofia.id,
        title: "Análisis de mercado en vivo — Sesión semanal",
        description: "Análisis técnico en vivo de los principales activos. Forex, índices, criptomonedas y más. Interacción en tiempo real con la comunidad.",
        thumbnailUrl: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=600&h=340&fit=crop",
        status: "upcoming",
        scheduledAt: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000),
        featured: false,
      },
    ],
  });

  // Seed collaborations
  await prisma.collaboration.createMany({
    data: [
      {
        creatorProfileId: alex.id,
        title: "Partner Oficial Opturna × Alejandro Martín",
        description: "Colaboración estratégica entre Opturna y Alejandro Martín para crear contenido exclusivo sobre emprendimiento, finanzas y mentalidad para la comunidad de Opturna.",
        collaborationType: "featured_profile",
        status: "active",
        startDate: new Date("2024-01-01"),
        ctaLabel: "Ver podcast de Alejandro",
        ctaUrl: "https://alejandromartin.com/podcast",
        featured: true,
      },
      {
        creatorProfileId: nexoFin.id,
        title: "NexoFin × Opturna — Educación Financiera",
        description: "Acuerdo estratégico entre NexoFin y Opturna para integrar recursos educativos financieros premium dentro de la plataforma.",
        collaborationType: "education",
        status: "active",
        startDate: new Date("2024-01-10"),
        ctaLabel: "Visitar NexoFin",
        ctaUrl: "https://nexofin.com",
        featured: true,
      },
      {
        creatorProfileId: apexProp.id,
        title: "Apex Prop Trading × Opturna — Partner Exclusivo",
        description: "Apex Prop Trading, partner oficial de Opturna, ofrece condiciones exclusivas para los traders de la comunidad Opturna.",
        collaborationType: "startup_partner",
        status: "active",
        startDate: new Date("2024-01-05"),
        ctaLabel: "Conocer Apex",
        ctaUrl: "https://apexproptrading.com",
        featured: false,
      },
    ],
  });

  return c.json({ data: { message: "Seed data created successfully" } });
});

export { creatorsRouter };
