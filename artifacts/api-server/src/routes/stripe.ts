import { Router, type IRouter } from "express";
import Stripe from "stripe";

const router: IRouter = Router();

function getStripe(): Stripe {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) throw new Error("STRIPE_SECRET_KEY is not set");
  return new Stripe(key, { apiVersion: "2026-02-25.clover" });
}

// Create a payment intent
router.post("/create-payment-intent", async (req, res) => {
  try {
    const stripe = getStripe();
    const { amount, currency = "eur" } = req.body;
    if (!amount || typeof amount !== "number" || amount <= 0) {
      return res.status(400).json({ error: "Invalid amount" });
    }
    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(amount * 100), // convert to cents
      currency,
      automatic_payment_methods: { enabled: true },
    });
    res.json({ clientSecret: paymentIntent.client_secret, id: paymentIntent.id });
  } catch (err: any) {
    console.error("Stripe error:", err);
    res.status(500).json({ error: err.message || "Stripe error" });
  }
});

// Stripe webhook
router.post("/webhook", async (req, res) => {
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!webhookSecret) {
    return res.status(400).json({ error: "Webhook secret not configured" });
  }
  const sig = req.headers["stripe-signature"] as string;
  let event: Stripe.Event;
  try {
    const stripe = getStripe();
    event = stripe.webhooks.constructEvent(req.body, sig, webhookSecret);
  } catch (err: any) {
    return res.status(400).json({ error: `Webhook Error: ${err.message}` });
  }

  if (event.type === "payment_intent.succeeded") {
    console.log("Payment succeeded:", (event.data.object as Stripe.PaymentIntent).id);
  }

  res.json({ received: true });
});

export default router;
