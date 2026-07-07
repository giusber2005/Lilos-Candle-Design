import { Router, type IRouter } from "express";
import { execFile } from "child_process";
import { promisify } from "util";
const execFileAsync = promisify(execFile);
import { db } from "../db/index.js";
import {
  productsTable,
  productVariantsTable,
  ordersTable,
  orderItemsTable,
  cartItemsTable,
  newsletterSubscribersTable,
  siteContentTable,
  adminSettingsTable,
  commentsTable,
} from "../db/schema/index.js";
import { eq, desc, count, sum, inArray } from "drizzle-orm";
import bcrypt from "bcryptjs";
import { requireAdmin, signAdminToken } from "../middleware/auth";
import { sendNewsletterEmail, testSmtpConnection } from "../lib/email.js";

const router: IRouter = Router();

function parseImages(raw: string | null | undefined): string[] {
  try { return JSON.parse(raw ?? "[]"); } catch { return []; }
}

function parsePurchaseQuantities(raw: string | null | undefined): Array<{ qty: number; label: string; discount: number }> {
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

// ─── Site Status (public read) ────────────────────────────────────────────────

router.get("/site-status", async (_req, res) => {
  try {
    const [row] = await db.select().from(adminSettingsTable).where(eq(adminSettingsTable.key, "site_shutdown"));
    res.json({ shutdown: row?.value === "true" });
  } catch {
    res.json({ shutdown: false });
  }
});

router.post("/login", async (req, res) => {
  const { password } = req.body;
  try {
    const [stored] = await db
      .select()
      .from(adminSettingsTable)
      .where(eq(adminSettingsTable.key, "admin_password_hash"));

    let isValid = false;
    if (stored) {
      isValid = await bcrypt.compare(password, stored.value);
    } else {
      isValid = password === (process.env.ADMIN_PASSWORD || "changeme123");
    }

    if (!isValid) return res.status(401).json({ error: "Password errata" });
    res.json({ token: signAdminToken() });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.use(requireAdmin);

// ─── Site Status (protected write) ───────────────────────────────────────────

router.post("/site-status", async (req, res) => {
  try {
    const { shutdown } = req.body;
    const value = shutdown ? "true" : "false";
    const [existing] = await db.select().from(adminSettingsTable).where(eq(adminSettingsTable.key, "site_shutdown"));
    if (existing) {
      await db.update(adminSettingsTable).set({ value, updatedAt: new Date() }).where(eq(adminSettingsTable.key, "site_shutdown"));
    } else {
      await db.insert(adminSettingsTable).values({ key: "site_shutdown", value });
    }
    res.json({ shutdown: shutdown === true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

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
      revenue: parseFloat(String(revenueResult.total ?? 0)),
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
        return { ...p, images: parseImages(p.images), purchaseQuantities: parsePurchaseQuantities(p.purchaseQuantities), variants };
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
      size, material, burnTime, weight, dimensions, featured, soldOut, purchaseQuantities,
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
        soldOut: soldOut || false,
        purchaseQuantities: JSON.stringify(Array.isArray(purchaseQuantities) ? purchaseQuantities : []),
      })
      .returning();
    res.status(201).json({ ...product, images: parseImages(product.images), purchaseQuantities: parsePurchaseQuantities(product.purchaseQuantities) });
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
      size, material, burnTime, weight, dimensions, featured, soldOut, purchaseQuantities,
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
    if (soldOut !== undefined) updates.soldOut = soldOut;
    if (purchaseQuantities !== undefined) updates.purchaseQuantities = JSON.stringify(Array.isArray(purchaseQuantities) ? purchaseQuantities : []);
    const [product] = await db
      .update(productsTable)
      .set(updates)
      .where(eq(productsTable.id, id))
      .returning();
    if (!product) return res.status(404).json({ error: "Product not found" });
    res.json({ ...product, images: parseImages(product.images), purchaseQuantities: parsePurchaseQuantities(product.purchaseQuantities) });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.delete("/products/:id", async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) return res.status(400).json({ error: "Invalid product ID" });

    const variants = await db
      .select({ id: productVariantsTable.id })
      .from(productVariantsTable)
      .where(eq(productVariantsTable.productId, id));

    if (variants.length > 0) {
      const vids = variants.map((v) => v.id);
      await db.delete(cartItemsTable).where(inArray(cartItemsTable.variantId, vids));
      await db.delete(orderItemsTable).where(inArray(orderItemsTable.variantId, vids));
    }
    await db.delete(cartItemsTable).where(eq(cartItemsTable.productId, id));
    await db.delete(orderItemsTable).where(eq(orderItemsTable.productId, id));

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

// ─── Change Password ──────────────────────────────────────────────────────────

router.post("/change-password", async (req, res) => {
  const { currentPassword, newPassword } = req.body;
  if (!currentPassword || !newPassword) {
    return res.status(400).json({ error: "currentPassword e newPassword sono obbligatori" });
  }
  if (newPassword.length < 8) {
    return res.status(400).json({ error: "La nuova password deve essere di almeno 8 caratteri" });
  }

  try {
    const [stored] = await db
      .select()
      .from(adminSettingsTable)
      .where(eq(adminSettingsTable.key, "admin_password_hash"));

    let isValid = false;
    if (stored) {
      isValid = await bcrypt.compare(currentPassword, stored.value);
    } else {
      isValid = currentPassword === (process.env.ADMIN_PASSWORD || "changeme123");
    }

    if (!isValid) return res.status(401).json({ error: "Password attuale errata" });

    const hash = await bcrypt.hash(newPassword, 12);

    if (stored) {
      await db
        .update(adminSettingsTable)
        .set({ value: hash, updatedAt: new Date() })
        .where(eq(adminSettingsTable.key, "admin_password_hash"));
    } else {
      await db.insert(adminSettingsTable).values({ key: "admin_password_hash", value: hash });
    }

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

// ─── Comments ─────────────────────────────────────────────────────────────────

router.get("/comments", async (_req, res) => {
  try {
    const comments = await db
      .select()
      .from(commentsTable)
      .orderBy(desc(commentsTable.createdAt));
    res.json(
      comments.map((comment) => ({
        ...comment,
        createdAt: formatDate(comment.createdAt),
      }))
    );
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.delete("/comments/:id", async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) return res.status(400).json({ error: "Invalid comment ID" });
    const [deletedComment] = await db
      .delete(commentsTable)
      .where(eq(commentsTable.id, id))
      .returning();
    if (!deletedComment) return res.status(404).json({ error: "Comment not found" });
    res.json({ ok: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// ─── Email Settings ───────────────────────────────────────────────────────────

const EMAIL_SETTING_KEYS = ["smtp_host", "smtp_port", "smtp_user", "smtp_pass", "smtp_from", "smtp_secure"];
const EMAIL_TEMPLATE_KEYS = ["email_order_subject", "email_order_body", "email_newsletter_default_subject", "email_newsletter_default_body"];

router.get("/email-settings", async (_req, res) => {
  try {
    const rows = await db.select().from(adminSettingsTable)
      .where(inArray(adminSettingsTable.key, [...EMAIL_SETTING_KEYS, ...EMAIL_TEMPLATE_KEYS]));
    const out: Record<string, string> = {};
    for (const r of rows) out[r.key] = r.key === "smtp_pass" ? "••••••••" : r.value;
    res.json(out);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.post("/email-settings", async (req, res) => {
  try {
    const allowed = new Set([...EMAIL_SETTING_KEYS, ...EMAIL_TEMPLATE_KEYS]);
    const entries = Object.entries(req.body as Record<string, string>).filter(([k]) => allowed.has(k));
    for (const [key, value] of entries) {
      if (key === "smtp_pass" && value === "••••••••") continue;
      const [existing] = await db.select().from(adminSettingsTable).where(eq(adminSettingsTable.key, key));
      if (existing) {
        await db.update(adminSettingsTable).set({ value, updatedAt: new Date() }).where(eq(adminSettingsTable.key, key));
      } else {
        await db.insert(adminSettingsTable).values({ key, value });
      }
    }
    res.json({ ok: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.post("/email-settings/test", async (req, res) => {
  try {
    const { host, port, secure, user, pass } = req.body;
    await testSmtpConnection({ host, port: parseInt(port || "587"), secure: secure === true || secure === "true", user, pass });
    res.json({ ok: true });
  } catch (err: any) {
    res.status(400).json({ error: err.message || "Connessione SMTP fallita" });
  }
});

// ─── Newsletter ───────────────────────────────────────────────────────────────

router.get("/newsletter/subscribers", async (_req, res) => {
  try {
    const subscribers = await db.select().from(newsletterSubscribersTable).orderBy(desc(newsletterSubscribersTable.createdAt));
    res.json(subscribers.map((s) => ({ ...s, createdAt: formatDate(s.createdAt) })));
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.delete("/newsletter/subscribers/:id", async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    await db.delete(newsletterSubscribersTable).where(eq(newsletterSubscribersTable.id, id));
    res.json({ ok: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.post("/newsletter/send", async (req, res) => {
  try {
    const { subject, body, subscriberIds } = req.body;
    if (!subject || !body) return res.status(400).json({ error: "subject e body obbligatori" });

    let subscribers;
    if (Array.isArray(subscriberIds) && subscriberIds.length > 0) {
      subscribers = await db.select().from(newsletterSubscribersTable)
        .where(inArray(newsletterSubscribersTable.id, subscriberIds));
    } else {
      subscribers = await db.select().from(newsletterSubscribersTable);
    }

    if (subscribers.length === 0) return res.status(400).json({ error: "Nessun iscritto" });

    const result = await sendNewsletterEmail({ subscribers, subject, body });
    res.json(result);
  } catch (err: any) {
    console.error(err);
    res.status(500).json({ error: err.message || "Errore invio newsletter" });
  }
});

// ─── GitHub Deploy ────────────────────────────────────────────────────────────

router.get("/git-status", async (_req, res) => {
  try {
    const [{ stdout: status }, { stdout: branch }, { stdout: remote }] = await Promise.all([
      execFileAsync("git", ["status", "--short"]),
      execFileAsync("git", ["branch", "--show-current"]),
      execFileAsync("git", ["remote", "-v"]),
    ]);
    res.json({ status: status.trim(), branch: branch.trim(), remote: remote.trim() });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.post("/deploy", async (req, res) => {
  const { message } = req.body;
  if (!message || typeof message !== "string" || message.trim().length < 3) {
    return res.status(400).json({ error: "Messaggio di commit obbligatorio (min 3 caratteri)" });
  }
  try {
    await execFileAsync("git", ["add", "-A"]);
    let commitOutput = "";
    try {
      const { stdout } = await execFileAsync("git", ["commit", "-m", message.trim()]);
      commitOutput = stdout.trim();
    } catch {
      commitOutput = "Nessun cambiamento da committare.";
    }
    const { stdout: pushOut, stderr: pushErr } = await execFileAsync("git", ["push"]);
    const output = [commitOutput, pushOut.trim(), pushErr.trim()].filter(Boolean).join("\n");
    res.json({ ok: true, output });
  } catch (err: any) {
    res.status(500).json({ error: err.message || "Errore durante la pubblicazione" });
  }
});

export default router;
