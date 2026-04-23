import { Router, type IRouter } from "express";
import { db } from "../db/index.js";
import { productsTable, productVariantsTable } from "../db/schema/index.js";
import { eq } from "drizzle-orm";

const router: IRouter = Router();

function parseImages(raw: string | null | undefined): string[] {
  try { return JSON.parse(raw ?? "[]"); } catch { return []; }
}

function formatProduct(product: any, variants: any[]) {
  return {
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
  };
}

router.get("/", async (_req, res) => {
  try {
    const products = await db.select().from(productsTable);
    const result = await Promise.all(
      products.map(async (product) => {
        const variants = await db
          .select()
          .from(productVariantsTable)
          .where(eq(productVariantsTable.productId, product.id));
        return formatProduct(product, variants);
      })
    );
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
      return res.status(400).json({ error: "Invalid product ID" });
    }
    const [product] = await db
      .select()
      .from(productsTable)
      .where(eq(productsTable.id, id));
    if (!product) {
      return res.status(404).json({ error: "Product not found" });
    }
    const variants = await db
      .select()
      .from(productVariantsTable)
      .where(eq(productVariantsTable.productId, product.id));
    res.json(formatProduct(product, variants));
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
