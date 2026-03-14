import { Hono } from "hono";
import { prisma } from "../prisma";

const tasks = new Hono<{ Variables: { user: { id: string } | null; session: unknown | null } }>();

// GET /api/tasks
tasks.get("/", async (c) => {
  const user = c.get("user");
  if (!user) return c.json({ error: { message: "Unauthorized" } }, 401);

  const goalId = c.req.query("goalId");

  const where: { userId: string; goalId?: string } = { userId: user.id };
  if (goalId) where.goalId = goalId;

  const items = await prisma.task.findMany({
    where,
    orderBy: [{ isCompleted: "asc" }, { createdAt: "desc" }],
    include: { goal: { select: { id: true, title: true } } },
  });
  return c.json({ data: items });
});

// POST /api/tasks
tasks.post("/", async (c) => {
  const user = c.get("user");
  if (!user) return c.json({ error: { message: "Unauthorized" } }, 401);

  const body = await c.req.json() as {
    title?: string;
    description?: string;
    goalId?: string;
    dueDate?: string;
    priority?: string;
  };
  const { title, description, goalId, dueDate, priority } = body;

  if (!title?.trim()) return c.json({ error: { message: "Title required" } }, 400);

  const task = await prisma.task.create({
    data: {
      userId: user.id,
      title: title.trim(),
      description: description || null,
      goalId: goalId || null,
      dueDate: dueDate ? new Date(dueDate) : null,
      priority: priority || "medium",
    },
    include: { goal: { select: { id: true, title: true } } },
  });
  return c.json({ data: task });
});

// PATCH /api/tasks/:id
tasks.patch("/:id", async (c) => {
  const user = c.get("user");
  if (!user) return c.json({ error: { message: "Unauthorized" } }, 401);

  const { id } = c.req.param();
  const body = await c.req.json() as {
    title?: string;
    description?: string;
    isCompleted?: boolean;
    goalId?: string | null;
    dueDate?: string | null;
    priority?: string;
  };

  const existing = await prisma.task.findFirst({ where: { id, userId: user.id } });
  if (!existing) return c.json({ error: { message: "Not found" } }, 404);

  const task = await prisma.task.update({
    where: { id },
    data: {
      title: body.title ?? existing.title,
      description: body.description !== undefined ? body.description : existing.description,
      isCompleted: body.isCompleted !== undefined ? body.isCompleted : existing.isCompleted,
      goalId: body.goalId !== undefined ? (body.goalId || null) : existing.goalId,
      dueDate: body.dueDate !== undefined ? (body.dueDate ? new Date(body.dueDate) : null) : existing.dueDate,
      priority: body.priority ?? existing.priority,
    },
    include: { goal: { select: { id: true, title: true } } },
  });
  return c.json({ data: task });
});

// DELETE /api/tasks/:id
tasks.delete("/:id", async (c) => {
  const user = c.get("user");
  if (!user) return c.json({ error: { message: "Unauthorized" } }, 401);

  const { id } = c.req.param();

  const existing = await prisma.task.findFirst({ where: { id, userId: user.id } });
  if (!existing) return c.json({ error: { message: "Not found" } }, 404);

  await prisma.task.delete({ where: { id } });
  return c.body(null, 204);
});

export default tasks;
