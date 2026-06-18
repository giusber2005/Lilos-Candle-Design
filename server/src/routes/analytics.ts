import { Router, type IRouter } from "express";
import { db } from "../db/index.js";
import { pageVisitsTable } from "../db/schema/index.js";
import { requireAdmin } from "../middleware/auth.js";
import { sql, count, desc } from "drizzle-orm";

const router: IRouter = Router();

router.post("/track", async (req, res) => {
  try {
    const { path, sessionId, deviceType, referrer } = req.body;
    if (!path || typeof path !== "string") return res.status(400).json({ ok: false });
    await db.insert(pageVisitsTable).values({
      path: path.slice(0, 255),
      sessionId: typeof sessionId === "string" ? sessionId.slice(0, 64) : null,
      userAgent: req.headers["user-agent"]?.slice(0, 300) ?? null,
      referrer: typeof referrer === "string" && referrer ? referrer.slice(0, 255) : null,
      deviceType: typeof deviceType === "string" ? deviceType : null,
    });
    res.json({ ok: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ ok: false });
  }
});

router.get("/", requireAdmin, async (_req, res) => {
  try {
    const now = Math.floor(Date.now() / 1000);
    const dayAgo = now - 86400;
    const weekAgo = now - 7 * 86400;
    const monthAgo = now - 30 * 86400;

    const [todayRow] = await db
      .select({ count: count() })
      .from(pageVisitsTable)
      .where(sql`${pageVisitsTable.createdAt} >= ${dayAgo}`);

    const [weekRow] = await db
      .select({ count: count() })
      .from(pageVisitsTable)
      .where(sql`${pageVisitsTable.createdAt} >= ${weekAgo}`);

    const [monthRow] = await db
      .select({ count: count() })
      .from(pageVisitsTable)
      .where(sql`${pageVisitsTable.createdAt} >= ${monthAgo}`);

    const weekSessionRows = await db
      .select({ sessionId: pageVisitsTable.sessionId })
      .from(pageVisitsTable)
      .where(sql`${pageVisitsTable.createdAt} >= ${weekAgo} AND ${pageVisitsTable.sessionId} IS NOT NULL`);
    const sessions7d = new Set(weekSessionRows.map((r) => r.sessionId)).size;

    const timeseries = await db
      .select({
        date: sql<string>`strftime('%Y-%m-%d', datetime(${pageVisitsTable.createdAt}, 'unixepoch'))`.as("date"),
        visits: count(),
      })
      .from(pageVisitsTable)
      .where(sql`${pageVisitsTable.createdAt} >= ${monthAgo}`)
      .groupBy(sql`strftime('%Y-%m-%d', datetime(${pageVisitsTable.createdAt}, 'unixepoch'))`)
      .orderBy(sql`strftime('%Y-%m-%d', datetime(${pageVisitsTable.createdAt}, 'unixepoch')) ASC`);

    const topPages = await db
      .select({ path: pageVisitsTable.path, visits: count() })
      .from(pageVisitsTable)
      .groupBy(pageVisitsTable.path)
      .orderBy(desc(count()))
      .limit(10);

    const totalForPct = topPages.reduce((s, p) => s + p.visits, 0);
    const topPagesWithPct = topPages.map((p) => ({
      path: p.path,
      visits: p.visits,
      pct: totalForPct > 0 ? Math.round((p.visits / totalForPct) * 1000) / 10 : 0,
    }));

    const deviceRows = await db
      .select({ deviceType: pageVisitsTable.deviceType, count: count() })
      .from(pageVisitsTable)
      .groupBy(pageVisitsTable.deviceType);

    const deviceTotal = deviceRows.reduce((s, r) => s + r.count, 0);
    const devices = deviceRows.map((d) => ({
      type: d.deviceType || "other",
      count: d.count,
      pct: deviceTotal > 0 ? Math.round((d.count / deviceTotal) * 1000) / 10 : 0,
    }));

    const referrerRows = await db
      .select({ referrer: pageVisitsTable.referrer, count: count() })
      .from(pageVisitsTable)
      .where(sql`${pageVisitsTable.referrer} IS NOT NULL AND ${pageVisitsTable.referrer} != ''`)
      .groupBy(pageVisitsTable.referrer)
      .orderBy(desc(count()))
      .limit(10);

    res.json({
      kpis: {
        visitsToday: todayRow.count,
        visits7d: weekRow.count,
        visits30d: monthRow.count,
        sessions7d,
      },
      timeseries,
      topPages: topPagesWithPct,
      devices,
      referrers: referrerRows.map((r) => ({ referrer: r.referrer, count: r.count })),
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
