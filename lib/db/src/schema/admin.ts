import { sqliteTable, text, integer } from "drizzle-orm/sqlite-core";

export const siteContentTable = sqliteTable("site_content", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  key: text("key").notNull().unique(),
  value: text("value").notNull().default(""),
  type: text("type").notNull().default("text"), // text | image | link | textarea | json
  label: text("label").notNull(),
  section: text("section").notNull().default("general"),
  updatedAt: integer("updated_at", { mode: "timestamp" }).$defaultFn(() => new Date()).notNull(),
});

export type SiteContent = typeof siteContentTable.$inferSelect;
