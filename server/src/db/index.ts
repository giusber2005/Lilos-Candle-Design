import { drizzle } from "drizzle-orm/better-sqlite3";
import { migrate } from "drizzle-orm/better-sqlite3/migrator";
import { getTableConfig, SQLiteTable } from "drizzle-orm/sqlite-core";
import { is, SQL } from "drizzle-orm";
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

// ─── Schema sync ──────────────────────────────────────────────────────────────
// The SQL migrations lag behind the Drizzle schema, and `db:push` at build time
// doesn't reach a runtime volume. Any table or column missing from the live DB
// makes every query on that table fail, so we create them here at startup.

function sqlDefault(col: any): string | null {
  if (!col.hasDefault || col.default === undefined || is(col.default, SQL)) return null;
  const v = col.default;
  if (typeof v === "boolean") return v ? "1" : "0";
  if (typeof v === "number") return String(v);
  if (v instanceof Date) return String(Math.floor(v.getTime() / 1000));
  return `'${String(v).replace(/'/g, "''")}'`;
}

function columnDef(col: any, forAlter: boolean): string {
  const type = col.getSQLType();
  let def = `\`${col.name}\` ${type}`;
  if (col.primary) {
    def += " PRIMARY KEY";
    if (col.autoIncrement) def += " AUTOINCREMENT";
    return def;
  }
  let dflt = sqlDefault(col);
  // SQLite can't add a NOT NULL column without a default to an existing table
  if (forAlter && col.notNull && dflt === null) {
    dflt = /int|real|num/i.test(type) ? "0" : "''";
  }
  if (dflt !== null) def += ` DEFAULT ${dflt}`;
  if (col.notNull) def += " NOT NULL";
  return def;
}

function ensureSchema() {
  for (const table of Object.values(schema)) {
    if (!is(table, SQLiteTable)) continue;
    const { name, columns } = getTableConfig(table);
    const existing = sqlite.prepare(`PRAGMA table_info(\`${name}\`)`).all() as { name: string }[];

    if (existing.length === 0) {
      sqlite.exec(`CREATE TABLE \`${name}\` (${columns.map((c) => columnDef(c, false)).join(", ")})`);
    } else {
      const have = new Set(existing.map((c) => c.name));
      for (const col of columns) {
        if (!have.has(col.name)) {
          sqlite.exec(`ALTER TABLE \`${name}\` ADD COLUMN ${columnDef(col, true)}`);
          console.log(`[db] added missing column ${name}.${col.name}`);
        }
      }
    }

    for (const col of columns) {
      if (col.isUnique) {
        sqlite.exec(`CREATE UNIQUE INDEX IF NOT EXISTS \`${name}_${col.name}_unique\` ON \`${name}\` (\`${col.name}\`)`);
      }
    }
  }
}

try {
  ensureSchema();
} catch (err) {
  console.error("[db] schema sync failed:", err);
}

export * from "./schema/index.js";
