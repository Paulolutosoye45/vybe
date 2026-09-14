import Database from "better-sqlite3";
import { drizzle } from "drizzle-orm/better-sqlite3";
import * as schema from "./schema";

// Same hot-reload-safe singleton pattern this project used for Prisma —
// avoids opening a new SQLite file handle on every dev save.
const globalForDb = globalThis as unknown as { sqlite?: Database.Database };

const sqlite =
  globalForDb.sqlite ?? new Database(process.env.DATABASE_URL || "./dev.db");
sqlite.pragma("journal_mode = WAL");

if (process.env.NODE_ENV !== "production") globalForDb.sqlite = sqlite;

export const db = drizzle(sqlite, { schema });
