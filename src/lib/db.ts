import postgres from "postgres";
import { drizzle } from "drizzle-orm/postgres-js";
import * as schema from "./schema";

// Same hot-reload-safe singleton pattern this project used for Prisma —
// avoids opening a new Postgres connection pool on every dev save.
const globalForDb = globalThis as unknown as { conn?: postgres.Sql };

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  throw new Error("DATABASE_URL is not set");
}

const conn = globalForDb.conn ?? postgres(connectionString);

if (process.env.NODE_ENV !== "production") globalForDb.conn = conn;

export const db = drizzle(conn, { schema });