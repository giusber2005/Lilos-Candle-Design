import { Router, type IRouter } from "express";
import { db } from "@workspace/db";
import { newsletterSubscribersTable } from "@workspace/db/schema";
import { eq } from "drizzle-orm";

const router: IRouter = Router();

router.post("/", async (req, res) => {
  try {
    const { email, firstName } = req.body;
    if (!email) {
      return res.status(400).json({ error: "Email is required" });
    }

    const [existing] = await db
      .select()
      .from(newsletterSubscribersTable)
      .where(eq(newsletterSubscribersTable.email, email));

    if (existing) {
      return res.json({ success: true, message: "Already subscribed!" });
    }

    await db.insert(newsletterSubscribersTable).values({
      email,
      firstName: firstName || null,
    });

    res.json({ success: true, message: "Successfully subscribed to the newsletter!" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
