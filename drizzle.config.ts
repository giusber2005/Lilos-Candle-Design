import { defineConfig } from "drizzle-kit";

export default defineConfig({
  schema: "./server/src/db/schema/index.ts",
  dialect: "sqlite",
  dbCredentials: {
    url: process.env.DATABASE_URL ?? "dev.db",
  },
});
