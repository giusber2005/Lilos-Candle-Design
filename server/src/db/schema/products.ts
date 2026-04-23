import { sqliteTable, text, integer, real } from "drizzle-orm/sqlite-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const productsTable = sqliteTable("products", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  name: text("name").notNull(),
  slug: text("slug").notNull().unique(),
  description: text("description").notNull(),
  shortDescription: text("short_description").notNull(),
  price: real("price").notNull(),
  imageUrl: text("image_url"),
  images: text("images").notNull().default("[]"), // JSON array string
  size: text("size").notNull(),
  material: text("material").notNull(),
  burnTime: text("burn_time").notNull(),
  weight: text("weight").notNull(),
  dimensions: text("dimensions").notNull(),
  featured: integer("featured", { mode: "boolean" }).notNull().default(false),
  createdAt: integer("created_at", { mode: "timestamp" }).$defaultFn(() => new Date()).notNull(),
});

export const productVariantsTable = sqliteTable("product_variants", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  productId: integer("product_id").notNull().references(() => productsTable.id),
  color: text("color").notNull(),
  colorHex: text("color_hex").notNull(),
  aroma: text("aroma").notNull(),
  stock: integer("stock").notNull().default(0),
  imageUrl: text("image_url"),
});

export const insertProductSchema = createInsertSchema(productsTable).omit({ id: true, createdAt: true });
export const insertProductVariantSchema = createInsertSchema(productVariantsTable).omit({ id: true });

export type Product = typeof productsTable.$inferSelect;
export type InsertProduct = z.infer<typeof insertProductSchema>;
export type ProductVariant = typeof productVariantsTable.$inferSelect;
export type InsertProductVariant = z.infer<typeof insertProductVariantSchema>;
