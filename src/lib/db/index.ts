import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";

const client = postgres(
  process.env.DATABASE_URL ||
    "postgresql://nocodb:nocodb@localhost:5432/nocodb",
  { max: 10 },
);

export const db = drizzle(client, { schema });
