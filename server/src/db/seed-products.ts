import { db } from "./index";
import { productsTable, productVariantsTable } from "./schema/index";
import { eq } from "drizzle-orm";

const products = [
  {
    name: "Lil One",
    slug: "lil-one",
    description:
      "La nostra candela compatta, perfetta per ambienti piccoli o come regalo. Vaso cubico in cemento naturale con cera colorata a mano e fragranza selezionata.",
    shortDescription: "La candela compatta — per ogni spazio.",
    price: 19.9,
    imageUrl: null,
    size: "Small",
    material: "Cemento naturale, cera, stoppino in cotone",
    burnTime: "20–25 ore",
    weight: "180g",
    dimensions: "6×6×6 cm",
    featured: false,
    variants: [
      { color: "Viola", colorHex: "#7C6B8A", aroma: "Amarena", stock: 10 },
      { color: "Rosa", colorHex: "#C47C7C", aroma: "Rosa selvatica", stock: 8 },
      { color: "Grigio", colorHex: "#8B8680", aroma: "Muschio bianco", stock: 12 },
    ],
  },
  {
    name: "Medio",
    slug: "medio",
    description:
      "Il nostro formato più versatile — grande abbastanza da profumare una stanza intera, ma discreto nel design. Il vaso cubico in cemento si integra in qualsiasi ambiente.",
    shortDescription: "Il formato perfetto per ogni stanza.",
    price: 29.9,
    imageUrl: null,
    size: "Medium",
    material: "Cemento naturale, cera, stoppino in cotone",
    burnTime: "40–50 ore",
    weight: "320g",
    dimensions: "8×8×8 cm",
    featured: true,
    variants: [
      { color: "Viola", colorHex: "#7C6B8A", aroma: "Amarena", stock: 8 },
      { color: "Verde", colorHex: "#6B8A7C", aroma: "Eucalipto", stock: 6 },
      { color: "Blu", colorHex: "#6B7C8A", aroma: "Oceano", stock: 7 },
      { color: "Rosso", colorHex: "#8A4040", aroma: "Vaniglia", stock: 5 },
    ],
  },
  {
    name: "Big Boy",
    slug: "big-boy",
    description:
      "La nostra candela di punta. Grande, imponente, capace di profumare tutta la casa. Destinata a durare a lungo e a diventare un elemento di design della tua casa.",
    shortDescription: "Il massimo della nostra produzione.",
    price: 44.9,
    imageUrl: null,
    size: "Large",
    material: "Cemento naturale, cera, stoppino in cotone",
    burnTime: "70–90 ore",
    weight: "550g",
    dimensions: "10×10×10 cm",
    featured: true,
    variants: [
      { color: "Viola", colorHex: "#7C6B8A", aroma: "Amarena", stock: 4 },
      { color: "Nero", colorHex: "#2C2826", aroma: "Legno di cedro", stock: 3 },
      { color: "Bianco", colorHex: "#F0EBE3", aroma: "Cotone fresco", stock: 5 },
    ],
  },
];

async function seed() {
  console.log("Seeding products...");
  let productsInserted = 0;
  let variantsInserted = 0;

  for (const { variants, ...productData } of products) {
    const existing = await db
      .select()
      .from(productsTable)
      .where(eq(productsTable.slug, productData.slug));

    if (existing.length > 0) {
      console.log(`  Skipping "${productData.name}" — already exists`);
      continue;
    }

    const [product] = await db
      .insert(productsTable)
      .values({ ...productData, images: "[]" })
      .returning();

    productsInserted++;

    for (const variant of variants) {
      await db
        .insert(productVariantsTable)
        .values({ ...variant, productId: product.id });
      variantsInserted++;
    }

    console.log(
      `  Created "${product.name}" with ${variants.length} variants`
    );
  }

  console.log(
    `Done — ${productsInserted} products, ${variantsInserted} variants inserted.`
  );
  process.exit(0);
}

seed().catch((err) => {
  console.error(err);
  process.exit(1);
});
