import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
// for query purposes
const queryClient = postgres("postgres://example:example@localhost:5432/test");
export const db = drizzle(queryClient);

