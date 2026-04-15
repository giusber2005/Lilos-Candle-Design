import { Router, type IRouter } from "express";
import healthRouter from "./health";
import productsRouter from "./products";
import cartRouter from "./cart";
import ordersRouter from "./orders";
import newsletterRouter from "./newsletter";
import adminRouter from "./admin";
import contentRouter from "./content";

const router: IRouter = Router();

router.use(healthRouter);
router.use("/products", productsRouter);
router.use("/cart", cartRouter);
router.use("/orders", ordersRouter);
router.use("/newsletter", newsletterRouter);
router.use("/admin", adminRouter);
router.use("/content", contentRouter);

export default router;
