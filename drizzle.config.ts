import { defineConfig } from "drizzle-kit";

export default defineConfig({
  dialect: "postgresql",
  schema: "./src/lib/db/schema.ts",
  out: "./drizzle",
  dbCredentials: {
    url:
      process.env.DATABASE_URL ||
      "postgresql://nocodb:nocodb@localhost:5432/nocodb",
  },
  schemaFilter: ["pxicv3djlauluse"],
});
