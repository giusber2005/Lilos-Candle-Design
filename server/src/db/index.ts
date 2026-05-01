import { drizzle } from "drizzle-orm/better-sqlite3";
import { migrate } from "drizzle-orm/better-sqlite3/migrator";
import Database from "better-sqlite3";
import * as schema from "./schema/index";
import path from "path";
import { fileURLToPath } from "url";

const sqlite = new Database(process.env.DATABASE_URL ?? "dev.db");
sqlite.pragma("journal_mode = WAL");

export const db = drizzle(sqlite, { schema });

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const migrationsFolder = path.join(__dirname, "migrations");

try {
  migrate(db, { migrationsFolder });
} catch {
  // Migrations folder may not exist in dev (using db:push instead)
}

export * from "./schema/index.js";
