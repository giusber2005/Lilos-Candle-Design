import { Router, type IRouter } from "express";
import { db } from "../db/index.js";
import { commentsTable, ordersTable } from "../db/schema/index.js";
import { desc, eq } from "drizzle-orm";

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

router.get("/check-purchase", async (req, res) => {
  try {
    const email = typeof req.query?.email === "string" ? req.query.email.trim().toLowerCase() : "";
    if (!email) {
      return res.status(400).json({ error: "Email is required" });
    }
    const [order] = await db
      .select({ id: ordersTable.id })
      .from(ordersTable)
      .where(eq(ordersTable.customerEmail, email))
      .limit(1);
    res.json({ hasPurchased: !!order });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.post("/", async (req, res) => {
  try {
    const rawEmail = typeof req.body?.email === "string" ? req.body.email.trim().toLowerCase() : "";
    const rawName = typeof req.body?.name === "string" ? req.body.name.trim() : "";
    const rawMessage = typeof req.body?.message === "string" ? req.body.message.trim() : "";
    const rawRating = Number(req.body?.rating);

    if (!rawEmail) {
      return res.status(400).json({ error: "Email is required" });
    }
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

    const [order] = await db
      .select({ id: ordersTable.id })
      .from(ordersTable)
      .where(eq(ordersTable.customerEmail, rawEmail))
      .limit(1);

    if (!order) {
      return res.status(403).json({ error: "Devi aver effettuato un acquisto per lasciare un commento." });
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
