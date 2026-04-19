import { drizzle } from "drizzle-orm/better-sqlite3";
import Database from "better-sqlite3";
import * as schema from "./schema/index";

const sqlite = new Database(process.env.DATABASE_URL ?? "dev.db");
export const db = drizzle(sqlite, { schema });

export * from "./schema/index.js";
