import express, { type Express } from "express";
import cors from "cors";
import router from "./routes";
import stripeRouter from "./routes/stripe";

const app: Express = express();

app.use(cors());

// Raw body for Stripe webhooks (must come before json middleware)
app.use("/api/stripe/webhook", express.raw({ type: "application/json" }));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use("/api", router);
app.use("/api/stripe", stripeRouter);

export default app;
