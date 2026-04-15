import { Router, type IRouter } from "express";
import { db } from "@workspace/db";
import {
  ordersTable,
  orderItemsTable,
  cartsTable,
  cartItemsTable,
  productsTable,
  productVariantsTable,
} from "@workspace/db/schema";
import { eq, desc } from "drizzle-orm";
import Stripe from "stripe";

const router: IRouter = Router();

function generateOrderNumber(): string {
  const date = new Date();
  const year = date.getFullYear().toString().slice(-2);
  const month = (date.getMonth() + 1).toString().padStart(2, "0");
  const day = date.getDate().toString().padStart(2, "0");
  const random = Math.floor(Math.random() * 10000)
    .toString()
    .padStart(4, "0");
  return `LC${year}${month}${day}${random}`;
}

function getShippingCost(method: string, subtotal: number): number {
  if (subtotal >= 50) return 0;
  if (method === "express") return 9.9;
  return 4.9;
}

async function buildOrderResponse(order: any) {
  const items = await db
    .select()
    .from(orderItemsTable)
    .where(eq(orderItemsTable.orderId, order.id));

  return {
    id: order.id,
    orderNumber: order.orderNumber,
    status: order.status,
    totalAmount: order.totalAmount,
    shippingAmount: order.shippingAmount,
    shippingMethod: order.shippingMethod,
    paymentMethod: order.paymentMethod,
    shippingAddress: typeof order.shippingAddress === "string"
      ? JSON.parse(order.shippingAddress)
      : order.shippingAddress,
    trackingNumber: order.trackingNumber,
    githubIssueNumber: order.githubIssueNumber,
    createdAt: order.createdAt instanceof Date
      ? order.createdAt.toISOString()
      : new Date(order.createdAt).toISOString(),
    updatedAt: order.updatedAt instanceof Date
      ? order.updatedAt.toISOString()
      : new Date(order.updatedAt).toISOString(),
    items: items.map((item) => ({
      id: item.id,
      orderId: item.orderId,
      productId: item.productId,
      variantId: item.variantId,
      quantity: item.quantity,
      unitPrice: item.unitPrice,
      productName: item.productName,
      variantColor: item.variantColor,
      variantAroma: item.variantAroma,
    })),
  };
}

async function createGitHubIssue(order: any, items: any[]): Promise<string | null> {
  const token = process.env.GITHUB_TOKEN;
  const repo = process.env.GITHUB_REPO;
  if (!token || !repo) return null;

  const address = typeof order.shippingAddress === "string"
    ? JSON.parse(order.shippingAddress)
    : order.shippingAddress;

  const itemsList = items
    .map((i) => `- ${i.productName} (${i.variantColor}, ${i.variantAroma}) × ${i.quantity} — €${i.unitPrice}`)
    .join("\n");

  const body = `## Nuovo Ordine: ${order.orderNumber}

**Cliente:** ${address.firstName} ${address.lastName}
**Email:** ${address.email}
**Telefono:** ${address.phone || "—"}

**Indirizzo di spedizione:**
${address.address}
${address.city}, ${address.postalCode}
${address.country}

**Prodotti:**
${itemsList}

**Spedizione:** ${order.shippingMethod} — €${Number(order.shippingAmount).toFixed(2)}
**Totale:** €${Number(order.totalAmount).toFixed(2)}
**Metodo di pagamento:** ${order.paymentMethod}

**Stato:** ${order.status}
`;

  try {
    const response = await fetch(`https://api.github.com/repos/${repo}/issues`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
        Accept: "application/vnd.github+json",
        "X-GitHub-Api-Version": "2022-11-28",
      },
      body: JSON.stringify({
        title: `[Ordine] ${order.orderNumber} — ${address.firstName} ${address.lastName}`,
        body,
        labels: ["ordine", "nuovo-ordine"],
      }),
    });
    if (!response.ok) {
      console.error("GitHub issue creation failed:", await response.text());
      return null;
    }
    const data = await response.json() as { number: number };
    return String(data.number);
  } catch (err) {
    console.error("GitHub issue error:", err);
    return null;
  }
}

router.post("/", async (req, res) => {
  try {
    const {
      sessionId,
      shippingAddress,
      shippingMethod,
      paymentMethod,
      notes,
      stripePaymentIntentId,
    } = req.body;

    if (!sessionId || !shippingAddress || !shippingMethod || !paymentMethod) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    if (stripePaymentIntentId && process.env.STRIPE_SECRET_KEY) {
      const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, { apiVersion: "2026-02-25.clover" });
      const pi = await stripe.paymentIntents.retrieve(stripePaymentIntentId);
      if (pi.status !== "succeeded") {
        return res.status(400).json({ error: "Pagamento non completato" });
      }
    }

    const [cart] = await db
      .select()
      .from(cartsTable)
      .where(eq(cartsTable.sessionId, sessionId));

    if (!cart) {
      return res.status(400).json({ error: "Cart not found" });
    }

    const cartItems = await db
      .select()
      .from(cartItemsTable)
      .where(eq(cartItemsTable.cartId, cart.id));

    if (cartItems.length === 0) {
      return res.status(400).json({ error: "Cart is empty" });
    }

    const enrichedItems = await Promise.all(
      cartItems.map(async (item) => {
        const [product] = await db
          .select()
          .from(productsTable)
          .where(eq(productsTable.id, item.productId));
        const [variant] = await db
          .select()
          .from(productVariantsTable)
          .where(eq(productVariantsTable.id, item.variantId));
        return { item, product, variant };
      })
    );

    const subtotal = enrichedItems.reduce(
      (sum, { item, product }) => sum + product.price * item.quantity,
      0
    );

    const shippingCost = getShippingCost(shippingMethod, subtotal);
    const total = subtotal + shippingCost;
    const orderNumber = generateOrderNumber();

    const [order] = await db
      .insert(ordersTable)
      .values({
        orderNumber,
        status: "confirmed",
        totalAmount: total,
        shippingAmount: shippingCost,
        shippingMethod,
        paymentMethod,
        shippingAddress: JSON.stringify(shippingAddress),
        customerEmail: shippingAddress.email,
        notes: notes || null,
        stripePaymentIntentId: stripePaymentIntentId || null,
      })
      .returning();

    const orderItems = await Promise.all(
      enrichedItems.map(({ item, product, variant }) =>
        db.insert(orderItemsTable).values({
          orderId: order.id,
          productId: item.productId,
          variantId: item.variantId,
          quantity: item.quantity,
          unitPrice: product.price,
          productName: product.name,
          variantColor: variant.color,
          variantAroma: variant.aroma,
        }).returning()
      )
    );

    await db.delete(cartItemsTable).where(eq(cartItemsTable.cartId, cart.id));

    const flatItems = orderItems.map(([i]) => ({
      productName: i.productName,
      variantColor: i.variantColor,
      variantAroma: i.variantAroma,
      quantity: i.quantity,
      unitPrice: i.unitPrice,
    }));
    const issueNumber = await createGitHubIssue(order, flatItems);
    if (issueNumber) {
      await db
        .update(ordersTable)
        .set({ githubIssueNumber: issueNumber })
        .where(eq(ordersTable.id, order.id));
      (order as any).githubIssueNumber = issueNumber;
    }

    res.status(201).json(await buildOrderResponse(order));
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.get("/", async (req, res) => {
  try {
    const { email } = req.query as { email: string };
    if (!email) {
      return res.status(400).json({ error: "email is required" });
    }
    const orders = await db
      .select()
      .from(ordersTable)
      .where(eq(ordersTable.customerEmail, email))
      .orderBy(desc(ordersTable.createdAt));

    const result = await Promise.all(orders.map(buildOrderResponse));
    res.json(result);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.get("/:id", async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ error: "Invalid order ID" });
    }
    const [order] = await db
      .select()
      .from(ordersTable)
      .where(eq(ordersTable.id, id));
    if (!order) {
      return res.status(404).json({ error: "Order not found" });
    }
    res.json(await buildOrderResponse(order));
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
