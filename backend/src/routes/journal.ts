import { Hono } from "hono";
import { prisma } from "../prisma";

const journal = new Hono<{ Variables: { user: { id: string } | null; session: unknown | null } }>();

// GET /api/journal
journal.get("/", async (c) => {
  const user = c.get("user");
  if (!user) return c.json({ error: { message: "Unauthorized" } }, 401);

  const limit = parseInt(c.req.query("limit") ?? "50");
  const offset = parseInt(c.req.query("offset") ?? "0");

  const entries = await prisma.journalEntry.findMany({
    where: { userId: user.id },
    orderBy: { date: "desc" },
    take: limit,
    skip: offset,
  });
  return c.json({ data: entries });
});

// POST /api/journal
journal.post("/", async (c) => {
  const user = c.get("user");
  if (!user) return c.json({ error: { message: "Unauthorized" } }, 401);

  const body = await c.req.json() as {
    content?: string;
    mood?: string;
    tags?: string[];
    date?: string;
  };
  const { content, mood, tags, date } = body;

  if (!content?.trim()) return c.json({ error: { message: "Content required" } }, 400);

  const today = new Date().toISOString().split("T")[0] as string;
  const entryDate: string = date ?? today;

  const entry = await prisma.journalEntry.create({
    data: {
      userId: user.id,
      content: content.trim(),
      mood: mood || null,
      tags: tags ? JSON.stringify(tags) : null,
      date: entryDate,
    },
  });
  return c.json({ data: entry });
});

// PATCH /api/journal/:id
journal.patch("/:id", async (c) => {
  const user = c.get("user");
  if (!user) return c.json({ error: { message: "Unauthorized" } }, 401);

  const { id } = c.req.param();
  const body = await c.req.json() as {
    content?: string;
    mood?: string | null;
    tags?: string[] | null;
  };

  const existing = await prisma.journalEntry.findFirst({ where: { id, userId: user.id } });
  if (!existing) return c.json({ error: { message: "Not found" } }, 404);

  const entry = await prisma.journalEntry.update({
    where: { id },
    data: {
      content: body.content ?? existing.content,
      mood: body.mood !== undefined ? body.mood : existing.mood,
      tags: body.tags !== undefined ? (body.tags ? JSON.stringify(body.tags) : null) : existing.tags,
    },
  });
  return c.json({ data: entry });
});

// DELETE /api/journal/:id
journal.delete("/:id", async (c) => {
  const user = c.get("user");
  if (!user) return c.json({ error: { message: "Unauthorized" } }, 401);

  const { id } = c.req.param();

  const existing = await prisma.journalEntry.findFirst({ where: { id, userId: user.id } });
  if (!existing) return c.json({ error: { message: "Not found" } }, 404);

  await prisma.journalEntry.delete({ where: { id } });
  return c.body(null, 204);
});

export default journal;
