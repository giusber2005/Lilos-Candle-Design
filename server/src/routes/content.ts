import { Router, type IRouter } from "express";
import { db } from "../db/index.js";
import { siteContentTable } from "../db/schema/index.js";

const router: IRouter = Router();

// Public endpoint — returns all site content as a key→value map
router.get("/", async (_req, res) => {
  try {
    const rows = await db.select().from(siteContentTable);
    const map: Record<string, string> = {};
    for (const row of rows) {
      map[row.key] = row.value;
    }
    res.json(map);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
