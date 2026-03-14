import { Hono } from "hono";
import { prisma } from "../prisma";

const lifeGoals = new Hono<{ Variables: { user: { id: string } | null; session: unknown | null } }>();

// GET /api/life-goals
lifeGoals.get("/", async (c) => {
  const user = c.get("user");
  if (!user) return c.json({ error: { message: "Unauthorized" } }, 401);

  const items = await prisma.lifeGoal.findMany({
    where: { userId: user.id },
    orderBy: [{ isCompleted: "asc" }, { createdAt: "desc" }],
  });
  return c.json({ data: items });
});

// POST /api/life-goals
lifeGoals.post("/", async (c) => {
  const user = c.get("user");
  if (!user) return c.json({ error: { message: "Unauthorized" } }, 401);

  const body = await c.req.json() as {
    title?: string;
    description?: string;
    category?: string;
    progress?: number;
    isPublic?: boolean;
    targetDate?: string;
    emoji?: string;
  };
  const { title, description, category, progress, isPublic, targetDate, emoji } = body;

  if (!title?.trim()) return c.json({ error: { message: "Title required" } }, 400);

  const goal = await prisma.lifeGoal.create({
    data: {
      userId: user.id,
      title: title.trim(),
      description: description || null,
      category: category || null,
      progress: progress ?? 0,
      isPublic: isPublic ?? false,
      targetDate: targetDate ? new Date(targetDate) : null,
      emoji: emoji || null,
    },
  });
  return c.json({ data: goal });
});

// PATCH /api/life-goals/:id
lifeGoals.patch("/:id", async (c) => {
  const user = c.get("user");
  if (!user) return c.json({ error: { message: "Unauthorized" } }, 401);

  const { id } = c.req.param();
  const body = await c.req.json() as {
    title?: string;
    description?: string | null;
    category?: string | null;
    progress?: number;
    isCompleted?: boolean;
    isPublic?: boolean;
    targetDate?: string | null;
    emoji?: string | null;
  };

  const existing = await prisma.lifeGoal.findFirst({ where: { id, userId: user.id } });
  if (!existing) return c.json({ error: { message: "Not found" } }, 404);

  const goal = await prisma.lifeGoal.update({
    where: { id },
    data: {
      title: body.title ?? existing.title,
      description: body.description !== undefined ? body.description : existing.description,
      category: body.category !== undefined ? body.category : existing.category,
      progress: body.progress !== undefined ? body.progress : existing.progress,
      isCompleted: body.isCompleted !== undefined ? body.isCompleted : existing.isCompleted,
      isPublic: body.isPublic !== undefined ? body.isPublic : existing.isPublic,
      targetDate: body.targetDate !== undefined ? (body.targetDate ? new Date(body.targetDate) : null) : existing.targetDate,
      emoji: body.emoji !== undefined ? body.emoji : existing.emoji,
    },
  });
  return c.json({ data: goal });
});

// DELETE /api/life-goals/:id
lifeGoals.delete("/:id", async (c) => {
  const user = c.get("user");
  if (!user) return c.json({ error: { message: "Unauthorized" } }, 401);

  const { id } = c.req.param();

  const existing = await prisma.lifeGoal.findFirst({ where: { id, userId: user.id } });
  if (!existing) return c.json({ error: { message: "Not found" } }, 404);

  await prisma.lifeGoal.delete({ where: { id } });
  return c.body(null, 204);
});

export default lifeGoals;
