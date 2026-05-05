import { sqliteTable, text, integer } from "drizzle-orm/sqlite-core";

export const commentsTable = sqliteTable("comments", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  name: text("name").notNull().default("Cliente"),
  message: text("message").notNull(),
  rating: integer("rating").notNull().default(5),
  createdAt: integer("created_at", { mode: "timestamp" }).$defaultFn(() => new Date()).notNull(),
});

export type Comment = typeof commentsTable.$inferSelect;
