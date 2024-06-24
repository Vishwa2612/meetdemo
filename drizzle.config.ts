import { defineConfig } from "drizzle-kit";
export default defineConfig({
    dialect: "postgresql", // "mysql" | "sqlite"
    out: "./drizzle",
    schema: "./lib/db/schema.ts",
    dbCredentials:{
        url:"postgres://example:example@localhost:5432/test"
    }
});