import { Router, type IRouter } from "express";
import { db } from "../db/index.js";
import {
  productsTable,
  productVariantsTable,
  ordersTable,
  orderItemsTable,
  newsletterSubscribersTable,
  siteContentTable,
} from "../db/schema/index.js";
import { eq, desc, count, sum } from "drizzle-orm";
import bcrypt from "bcryptjs";
import { requireAdmin, signAdminToken } from "../middleware/auth";

const router: IRouter = Router();

function parseImages(raw: string | null | undefined): string[] {
  try { return JSON.parse(raw ?? "[]"); } catch { return []; }
}

function parseAddress(raw: string | any): any {
  if (typeof raw === "string") {
    try { return JSON.parse(raw); } catch { return {}; }
  }
  return raw;
}

function formatDate(d: Date | number | null | undefined): string {
  if (!d) return new Date().toISOString();
  return d instanceof Date ? d.toISOString() : new Date(d).toISOString();
}

// ─── Auth ─────────────────────────────────────────────────────────────────────

router.post("/login", async (req, res) => {
  const { password } = req.body;
  const adminPassword = process.env.ADMIN_PASSWORD || "changeme123";
  if (password !== adminPassword) {
    return res.status(401).json({ error: "Password errata" });
  }
  res.json({ token: signAdminToken() });
});

router.use(requireAdmin);

// ─── Dashboard ────────────────────────────────────────────────────────────────

router.get("/dashboard", async (_req, res) => {
  try {
    const [ordersCount] = await db.select({ count: count() }).from(ordersTable);
    const [productsCount] = await db.select({ count: count() }).from(productsTable);
    const [subscribersCount] = await db.select({ count: count() }).from(newsletterSubscribersTable);
    const [revenueResult] = await db.select({ total: sum(ordersTable.totalAmount) }).from(ordersTable);
    const recentOrders = await db
      .select()
      .from(ordersTable)
      .orderBy(desc(ordersTable.createdAt))
      .limit(5);
    res.json({
      orders: ordersCount.count,
      products: productsCount.count,
      subscribers: subscribersCount.count,
      revenue: revenueResult.total ?? 0,
      recentOrders: recentOrders.map((o) => ({
        id: o.id,
        orderNumber: o.orderNumber,
        status: o.status,
        total: o.totalAmount,
        email: o.customerEmail,
        createdAt: formatDate(o.createdAt),
      })),
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// ─── Orders ───────────────────────────────────────────────────────────────────

router.get("/orders", async (_req, res) => {
  try {
    const orders = await db.select().from(ordersTable).orderBy(desc(ordersTable.createdAt));
    res.json(
      orders.map((o) => ({
        id: o.id,
        orderNumber: o.orderNumber,
        status: o.status,
        total: o.totalAmount,
        shippingAmount: o.shippingAmount,
        shippingMethod: o.shippingMethod,
        paymentMethod: o.paymentMethod,
        email: o.customerEmail,
        shippingAddress: parseAddress(o.shippingAddress),
        trackingNumber: o.trackingNumber,
        githubIssueNumber: o.githubIssueNumber,
        createdAt: formatDate(o.createdAt),
      }))
    );
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.patch("/orders/:id", async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const { status, trackingNumber } = req.body;
    const updates: Record<string, any> = { updatedAt: new Date() };
    if (status) updates.status = status;
    if (trackingNumber !== undefined) updates.trackingNumber = trackingNumber;
    const [order] = await db.update(ordersTable).set(updates).where(eq(ordersTable.id, id)).returning();
    if (!order) return res.status(404).json({ error: "Order not found" });
    res.json({ id: order.id, status: order.status, trackingNumber: order.trackingNumber });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// ─── Products ─────────────────────────────────────────────────────────────────

router.get("/products", async (_req, res) => {
  try {
    const products = await db.select().from(productsTable).orderBy(desc(productsTable.createdAt));
    const result = await Promise.all(
      products.map(async (p) => {
        const variants = await db
          .select()
          .from(productVariantsTable)
          .where(eq(productVariantsTable.productId, p.id));
        return { ...p, images: parseImages(p.images), variants };
      })
    );
    res.json(result);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.post("/products", async (req, res) => {
  try {
    const {
      name, slug, description, shortDescription, price, imageUrl, images,
      size, material, burnTime, weight, dimensions, featured,
    } = req.body;
    const [product] = await db
      .insert(productsTable)
      .values({
        name, slug, description, shortDescription,
        price: parseFloat(price),
        imageUrl: imageUrl || null,
        images: JSON.stringify(Array.isArray(images) ? images : []),
        size, material, burnTime, weight, dimensions,
        featured: featured || false,
      })
      .returning();
    res.status(201).json({ ...product, images: parseImages(product.images) });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.patch("/products/:id", async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const {
      name, slug, description, shortDescription, price, imageUrl, images,
      size, material, burnTime, weight, dimensions, featured,
    } = req.body;
    const updates: Record<string, any> = {};
    if (name !== undefined) updates.name = name;
    if (slug !== undefined) updates.slug = slug;
    if (description !== undefined) updates.description = description;
    if (shortDescription !== undefined) updates.shortDescription = shortDescription;
    if (price !== undefined) updates.price = parseFloat(price);
    if (imageUrl !== undefined) updates.imageUrl = imageUrl;
    if (images !== undefined) updates.images = JSON.stringify(Array.isArray(images) ? images : []);
    if (size !== undefined) updates.size = size;
    if (material !== undefined) updates.material = material;
    if (burnTime !== undefined) updates.burnTime = burnTime;
    if (weight !== undefined) updates.weight = weight;
    if (dimensions !== undefined) updates.dimensions = dimensions;
    if (featured !== undefined) updates.featured = featured;
    const [product] = await db
      .update(productsTable)
      .set(updates)
      .where(eq(productsTable.id, id))
      .returning();
    if (!product) return res.status(404).json({ error: "Product not found" });
    res.json({ ...product, images: parseImages(product.images) });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.delete("/products/:id", async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    await db.delete(productVariantsTable).where(eq(productVariantsTable.productId, id));
    await db.delete(productsTable).where(eq(productsTable.id, id));
    res.json({ ok: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.post("/products/:id/variants", async (req, res) => {
  try {
    const productId = parseInt(req.params.id);
    const { color, colorHex, aroma, stock, imageUrl } = req.body;
    const [variant] = await db
      .insert(productVariantsTable)
      .values({ productId, color, colorHex, aroma, stock: stock || 0, imageUrl: imageUrl || null })
      .returning();
    res.status(201).json(variant);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.patch("/products/:id/variants/:vid", async (req, res) => {
  try {
    const vid = parseInt(req.params.vid);
    const { color, colorHex, aroma, stock, imageUrl } = req.body;
    const updates: Record<string, any> = {};
    if (color !== undefined) updates.color = color;
    if (colorHex !== undefined) updates.colorHex = colorHex;
    if (aroma !== undefined) updates.aroma = aroma;
    if (stock !== undefined) updates.stock = stock;
    if (imageUrl !== undefined) updates.imageUrl = imageUrl;
    const [variant] = await db
      .update(productVariantsTable)
      .set(updates)
      .where(eq(productVariantsTable.id, vid))
      .returning();
    if (!variant) return res.status(404).json({ error: "Variant not found" });
    res.json(variant);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.delete("/products/:id/variants/:vid", async (req, res) => {
  try {
    const vid = parseInt(req.params.vid);
    await db.delete(productVariantsTable).where(eq(productVariantsTable.id, vid));
    res.json({ ok: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// ─── Site Content ─────────────────────────────────────────────────────────────

router.get("/content", async (_req, res) => {
  try {
    const rows = await db.select().from(siteContentTable);
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.patch("/content/:key", async (req, res) => {
  try {
    const { key } = req.params;
    const { value } = req.body;
    if (value === undefined) return res.status(400).json({ error: "value is required" });
    const [row] = await db
      .update(siteContentTable)
      .set({ value, updatedAt: new Date() })
      .where(eq(siteContentTable.key, key))
      .returning();
    if (!row) return res.status(404).json({ error: "Content key not found" });
    res.json(row);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
