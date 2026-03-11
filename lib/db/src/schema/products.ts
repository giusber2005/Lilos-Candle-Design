import { pgTable, text, serial, integer, numeric, boolean, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const productsTable = pgTable("products", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  slug: text("slug").notNull().unique(),
  description: text("description").notNull(),
  shortDescription: text("short_description").notNull(),
  price: numeric("price", { precision: 10, scale: 2 }).notNull(),
  imageUrl: text("image_url"),
  images: text("images").array().notNull().default([]),
  size: text("size").notNull(),
  material: text("material").notNull(),
  burnTime: text("burn_time").notNull(),
  weight: text("weight").notNull(),
  dimensions: text("dimensions").notNull(),
  featured: boolean("featured").notNull().default(false),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const productVariantsTable = pgTable("product_variants", {
  id: serial("id").primaryKey(),
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
