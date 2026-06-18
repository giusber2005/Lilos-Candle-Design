import { sqliteTable, text, integer } from "drizzle-orm/sqlite-core";

export const pageVisitsTable = sqliteTable("page_visits", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  path: text("path").notNull(),
  sessionId: text("session_id"),
  userAgent: text("user_agent"),
  referrer: text("referrer"),
  deviceType: text("device_type"),
  createdAt: integer("created_at", { mode: "timestamp" }).$defaultFn(() => new Date()).notNull(),
});

export type PageVisit = typeof pageVisitsTable.$inferSelect;
