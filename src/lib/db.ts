import Database from "better-sqlite3";
import { drizzle } from "drizzle-orm/better-sqlite3";
import * as schema from "./schema";

// Same hot-reload-safe singleton pattern this project used for Prisma —
// avoids opening a new SQLite file handle on every dev save.
const globalForDb = globalThis as unknown as {
  sqlite?: Database.Database;
  db?: ReturnType<typeof drizzle>;
};

function getDb() {
  if (globalForDb.db) return globalForDb.db;

  const sqlite = new Database(process.env.DATABASE_URL || "./dev.db");
  sqlite.pragma("journal_mode = WAL");

  const drizzleDb = drizzle(sqlite, { schema });

  if (process.env.NODE_ENV !== "production") {
    globalForDb.sqlite = sqlite;
    globalForDb.db = drizzleDb;
  }

  return drizzleDb;
}

// Proxy so existing `db.select()...` call sites don't need to change —
// the real connection is only opened on first property access, not on import.
export const db = new Proxy({} as ReturnType<typeof drizzle>, {
  get(_target, prop) {
    return (getDb() as any)[prop];
  },
});