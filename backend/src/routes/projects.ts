import { Hono } from "hono";
import { prisma } from "../prisma";

const projects = new Hono<{ Variables: { user: { id: string } | null; session: unknown | null } }>();

// GET /api/projects
projects.get("/", async (c) => {
  const user = c.get("user");
  if (!user) return c.json({ error: { message: "Unauthorized" } }, 401);

  const items = await prisma.project.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: "desc" },
  });
  return c.json({ data: items });
});

// POST /api/projects
projects.post("/", async (c) => {
  const user = c.get("user");
  if (!user) return c.json({ error: { message: "Unauthorized" } }, 401);

  const body = await c.req.json() as {
    title?: string;
    description?: string;
    status?: string;
    progress?: number;
    url?: string;
    isPublic?: boolean;
  };
  const { title, description, status, progress, url, isPublic } = body;

  if (!title?.trim()) return c.json({ error: { message: "Title required" } }, 400);

  const project = await prisma.project.create({
    data: {
      userId: user.id,
      title: title.trim(),
      description: description || null,
      status: status || "active",
      progress: progress ?? 0,
      url: url || null,
      isPublic: isPublic ?? false,
    },
  });
  return c.json({ data: project });
});

// PATCH /api/projects/:id
projects.patch("/:id", async (c) => {
  const user = c.get("user");
  if (!user) return c.json({ error: { message: "Unauthorized" } }, 401);

  const { id } = c.req.param();
  const body = await c.req.json() as {
    title?: string;
    description?: string;
    status?: string;
    progress?: number;
    url?: string;
    isPublic?: boolean;
  };

  const existing = await prisma.project.findFirst({ where: { id, userId: user.id } });
  if (!existing) return c.json({ error: { message: "Not found" } }, 404);

  const project = await prisma.project.update({
    where: { id },
    data: {
      title: body.title ?? existing.title,
      description: body.description !== undefined ? body.description : existing.description,
      status: body.status ?? existing.status,
      progress: body.progress !== undefined ? body.progress : existing.progress,
      url: body.url !== undefined ? body.url : existing.url,
      isPublic: body.isPublic !== undefined ? body.isPublic : existing.isPublic,
    },
  });
  return c.json({ data: project });
});

// DELETE /api/projects/:id
projects.delete("/:id", async (c) => {
  const user = c.get("user");
  if (!user) return c.json({ error: { message: "Unauthorized" } }, 401);

  const { id } = c.req.param();

  const existing = await prisma.project.findFirst({ where: { id, userId: user.id } });
  if (!existing) return c.json({ error: { message: "Not found" } }, 404);

  await prisma.project.delete({ where: { id } });
  return c.body(null, 204);
});

export default projects;
