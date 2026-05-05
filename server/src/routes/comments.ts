import { Router, type IRouter } from "express";
import { db } from "../db/index.js";
import { commentsTable } from "../db/schema/index.js";
import { desc } from "drizzle-orm";

const router: IRouter = Router();

router.get("/", async (_req, res) => {
  try {
    const comments = await db
      .select()
      .from(commentsTable)
      .orderBy(desc(commentsTable.createdAt))
      .limit(20);
    res.json(comments);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.post("/", async (req, res) => {
  try {
    const rawName = typeof req.body?.name === "string" ? req.body.name.trim() : "";
    const rawMessage = typeof req.body?.message === "string" ? req.body.message.trim() : "";
    const rawRating = Number(req.body?.rating);

    if (!rawMessage) {
      return res.status(400).json({ error: "Message is required" });
    }
    if (rawMessage.length > 600) {
      return res.status(400).json({ error: "Message is too long" });
    }
    if (rawName.length > 80) {
      return res.status(400).json({ error: "Name is too long" });
    }
    if (!Number.isInteger(rawRating) || rawRating < 1 || rawRating > 5) {
      return res.status(400).json({ error: "Rating must be an integer from 1 to 5" });
    }

    const [createdComment] = await db
      .insert(commentsTable)
      .values({
        name: rawName || "Cliente",
        message: rawMessage,
        rating: rawRating,
      })
      .returning();

    res.status(201).json(createdComment);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
