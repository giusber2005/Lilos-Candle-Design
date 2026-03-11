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
import { eq } from "drizzle-orm";

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
    totalAmount: parseFloat(order.totalAmount),
    shippingAmount: parseFloat(order.shippingAmount),
    shippingMethod: order.shippingMethod,
    paymentMethod: order.paymentMethod,
    shippingAddress: order.shippingAddress,
    trackingNumber: order.trackingNumber,
    createdAt: order.createdAt.toISOString(),
    updatedAt: order.updatedAt.toISOString(),
    items: items.map((item) => ({
      id: item.id,
      orderId: item.orderId,
      productId: item.productId,
      variantId: item.variantId,
      quantity: item.quantity,
      unitPrice: parseFloat(item.unitPrice),
      productName: item.productName,
      variantColor: item.variantColor,
      variantAroma: item.variantAroma,
    })),
  };
}

router.post("/", async (req, res) => {
  try {
    const { sessionId, shippingAddress, shippingMethod, paymentMethod, notes } =
      req.body;

    if (!sessionId || !shippingAddress || !shippingMethod || !paymentMethod) {
      return res.status(400).json({ error: "Missing required fields" });
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
      (sum, { item, product }) => sum + parseFloat(product.price) * item.quantity,
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
        totalAmount: total.toFixed(2),
        shippingAmount: shippingCost.toFixed(2),
        shippingMethod,
        paymentMethod,
        shippingAddress,
        customerEmail: shippingAddress.email,
        notes: notes || null,
      })
      .returning();

    await Promise.all(
      enrichedItems.map(({ item, product, variant }) =>
        db.insert(orderItemsTable).values({
          orderId: order.id,
          productId: item.productId,
          variantId: item.variantId,
          quantity: item.quantity,
          unitPrice: parseFloat(product.price).toFixed(2),
          productName: product.name,
          variantColor: variant.color,
          variantAroma: variant.aroma,
        })
      )
    );

    await db.delete(cartItemsTable).where(eq(cartItemsTable.cartId, cart.id));

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
      .where(eq(ordersTable.customerEmail, email));

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
