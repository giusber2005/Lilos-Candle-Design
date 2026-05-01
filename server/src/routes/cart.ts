import { Router, type IRouter } from "express";
import { db } from "../db/index.js";
import {
  cartsTable,
  cartItemsTable,
  productsTable,
  productVariantsTable,
} from "../db/schema/index.js";
import { eq, and } from "drizzle-orm";

const router: IRouter = Router();

function parseImages(raw: string | null | undefined): string[] {
  try { return JSON.parse(raw ?? "[]"); } catch { return []; }
}

async function getOrCreateCart(sessionId: string) {
  let [cart] = await db
    .select()
    .from(cartsTable)
    .where(eq(cartsTable.sessionId, sessionId));

  if (!cart) {
    [cart] = await db
      .insert(cartsTable)
      .values({ sessionId })
      .returning();
  }
  return cart;
}

async function buildCartResponse(cart: any) {
  const items = await db
    .select()
    .from(cartItemsTable)
    .where(eq(cartItemsTable.cartId, cart.id));

  const enrichedOrNull = await Promise.all(
    items.map(async (item) => {
      const [product] = await db
        .select()
        .from(productsTable)
        .where(eq(productsTable.id, item.productId));
      const [variant] = await db
        .select()
        .from(productVariantsTable)
        .where(eq(productVariantsTable.id, item.variantId));

      if (!product || !variant) return null;

      const variants = await db
        .select()
        .from(productVariantsTable)
        .where(eq(productVariantsTable.productId, product.id));

      return {
        id: item.id,
        cartId: item.cartId,
        productId: item.productId,
        variantId: item.variantId,
        quantity: item.quantity,
        product: {
          id: product.id,
          name: product.name,
          slug: product.slug,
          description: product.description,
          shortDescription: product.shortDescription,
          price: product.price,
          imageUrl: product.imageUrl,
          images: parseImages(product.images),
          size: product.size,
          material: product.material,
          burnTime: product.burnTime,
          weight: product.weight,
          dimensions: product.dimensions,
          featured: product.featured,
          variants: variants.map((v) => ({
            id: v.id,
            productId: v.productId,
            color: v.color,
            colorHex: v.colorHex,
            aroma: v.aroma,
            stock: v.stock,
            imageUrl: v.imageUrl,
          })),
        },
        variant: {
          id: variant.id,
          productId: variant.productId,
          color: variant.color,
          colorHex: variant.colorHex,
          aroma: variant.aroma,
          stock: variant.stock,
          imageUrl: variant.imageUrl,
        },
      };
    })
  );

  const enrichedItems = enrichedOrNull.filter((i) => i !== null);

  const total = enrichedItems.reduce(
    (sum, item) => sum + item.product.price * item.quantity,
    0
  );

  return {
    id: cart.id,
    sessionId: cart.sessionId,
    items: enrichedItems,
    total: Math.round(total * 100) / 100,
    itemCount: enrichedItems.reduce((sum, item) => sum + item.quantity, 0),
  };
}

router.get("/", async (req, res) => {
  try {
    const { sessionId } = req.query as { sessionId: string };
    if (!sessionId) {
      return res.status(400).json({ error: "sessionId is required" });
    }
    const cart = await getOrCreateCart(sessionId);
    res.json(await buildCartResponse(cart));
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.post("/", async (req, res) => {
  try {
    const { sessionId, productId, variantId, quantity } = req.body;
    if (!sessionId || !productId || !variantId || !quantity) {
      return res.status(400).json({ error: "Missing required fields" });
    }
    const cart = await getOrCreateCart(sessionId);

    const [existing] = await db
      .select()
      .from(cartItemsTable)
      .where(
        and(
          eq(cartItemsTable.cartId, cart.id),
          eq(cartItemsTable.productId, productId),
          eq(cartItemsTable.variantId, variantId)
        )
      );

    if (existing) {
      await db
        .update(cartItemsTable)
        .set({ quantity: existing.quantity + quantity })
        .where(eq(cartItemsTable.id, existing.id));
    } else {
      await db.insert(cartItemsTable).values({
        cartId: cart.id,
        productId,
        variantId,
        quantity,
      });
    }

    res.json(await buildCartResponse(cart));
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.delete("/item/:cartItemId", async (req, res) => {
  try {
    const cartItemId = parseInt(req.params.cartItemId);
    const [item] = await db
      .select()
      .from(cartItemsTable)
      .where(eq(cartItemsTable.id, cartItemId));
    if (!item) {
      return res.status(404).json({ error: "Cart item not found" });
    }
    await db.delete(cartItemsTable).where(eq(cartItemsTable.id, cartItemId));
    const [cart] = await db
      .select()
      .from(cartsTable)
      .where(eq(cartsTable.id, item.cartId));
    res.json(await buildCartResponse(cart));
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.patch("/item/:cartItemId", async (req, res) => {
  try {
    const cartItemId = parseInt(req.params.cartItemId);
    const { quantity } = req.body;
    const [item] = await db
      .select()
      .from(cartItemsTable)
      .where(eq(cartItemsTable.id, cartItemId));
    if (!item) {
      return res.status(404).json({ error: "Cart item not found" });
    }
    if (quantity <= 0) {
      await db.delete(cartItemsTable).where(eq(cartItemsTable.id, cartItemId));
    } else {
      await db
        .update(cartItemsTable)
        .set({ quantity })
        .where(eq(cartItemsTable.id, cartItemId));
    }
    const [cart] = await db
      .select()
      .from(cartsTable)
      .where(eq(cartsTable.id, item.cartId));
    res.json(await buildCartResponse(cart));
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
