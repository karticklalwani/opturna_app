import { Hono } from "hono";
import { prisma } from "../prisma";

const habits = new Hono<{ Variables: { user: { id: string } | null; session: unknown | null } }>();

// GET /api/habits
habits.get("/", async (c) => {
  const user = c.get("user");
  if (!user) return c.json({ error: { message: "Unauthorized" } }, 401);

  const items = await prisma.habit.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: "desc" },
    include: {
      checkIns: {
        orderBy: { date: "desc" },
        take: 60,
      },
    },
  });
  return c.json({ data: items });
});

// POST /api/habits
habits.post("/", async (c) => {
  const user = c.get("user");
  if (!user) return c.json({ error: { message: "Unauthorized" } }, 401);

  const body = await c.req.json() as {
    title?: string;
    description?: string;
    category?: string;
    color?: string;
  };
  const { title, description, category, color } = body;

  if (!title?.trim()) return c.json({ error: { message: "Title required" } }, 400);

  const habit = await prisma.habit.create({
    data: {
      userId: user.id,
      title: title.trim(),
      description: description || null,
      category: category || null,
      color: color || "#4ADE80",
    },
    include: { checkIns: true },
  });
  return c.json({ data: habit });
});

// PATCH /api/habits/:id
habits.patch("/:id", async (c) => {
  const user = c.get("user");
  if (!user) return c.json({ error: { message: "Unauthorized" } }, 401);

  const { id } = c.req.param();
  const body = await c.req.json() as {
    title?: string;
    description?: string;
    category?: string;
    color?: string;
    isActive?: boolean;
  };

  const existing = await prisma.habit.findFirst({ where: { id, userId: user.id } });
  if (!existing) return c.json({ error: { message: "Not found" } }, 404);

  const habit = await prisma.habit.update({
    where: { id },
    data: {
      title: body.title ?? existing.title,
      description: body.description !== undefined ? body.description : existing.description,
      category: body.category !== undefined ? body.category : existing.category,
      color: body.color ?? existing.color,
      isActive: body.isActive !== undefined ? body.isActive : existing.isActive,
    },
    include: { checkIns: { orderBy: { date: "desc" }, take: 60 } },
  });
  return c.json({ data: habit });
});

// DELETE /api/habits/:id
habits.delete("/:id", async (c) => {
  const user = c.get("user");
  if (!user) return c.json({ error: { message: "Unauthorized" } }, 401);

  const { id } = c.req.param();

  const existing = await prisma.habit.findFirst({ where: { id, userId: user.id } });
  if (!existing) return c.json({ error: { message: "Not found" } }, 404);

  await prisma.habit.delete({ where: { id } });
  return c.body(null, 204);
});

// POST /api/habits/:id/checkin — toggle today's check-in
habits.post("/:id/checkin", async (c) => {
  const user = c.get("user");
  if (!user) return c.json({ error: { message: "Unauthorized" } }, 401);

  const { id } = c.req.param();

  const habit = await prisma.habit.findFirst({ where: { id, userId: user.id } });
  if (!habit) return c.json({ error: { message: "Not found" } }, 404);

  const todayDate = new Date();
  todayDate.setHours(0, 0, 0, 0);
  const today = todayDate.toISOString().slice(0, 10); // YYYY-MM-DD

  const existing = await prisma.habitCheckIn.findUnique({
    where: { habitId_date: { habitId: id, date: today } },
  });

  if (existing) {
    // Toggle off
    await prisma.habitCheckIn.delete({ where: { id: existing.id } });
  } else {
    // Check in today
    await prisma.habitCheckIn.create({
      data: { habitId: id, userId: user.id, date: today },
    });
  }

  // Recalculate streak
  const checkIns = await prisma.habitCheckIn.findMany({
    where: { habitId: id },
    orderBy: { date: "desc" },
  });

  let streak = 0;
  let dayOffset = 0;

  for (const checkIn of checkIns) {
    const checkDate = new Date(checkIn.date);
    const expectedDate = new Date(todayDate);
    expectedDate.setDate(todayDate.getDate() - dayOffset);

    if (checkDate.toISOString().slice(0, 10) === expectedDate.toISOString().slice(0, 10)) {
      streak++;
      dayOffset++;
    } else {
      break;
    }
  }

  const bestStreak = Math.max(habit.bestStreak, streak);

  const updated = await prisma.habit.update({
    where: { id },
    data: { streak, bestStreak },
    include: { checkIns: { orderBy: { date: "desc" }, take: 60 } },
  });

  return c.json({ data: updated });
});

export default habits;
