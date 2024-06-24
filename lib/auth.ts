import NextAuth from "next-auth"
import Credentials from "next-auth/providers/credentials"
import { compare } from "bcrypt";
import type { Adapter } from "next-auth/adapters";
import { DrizzleAdapter } from "@auth/drizzle-adapter"
import { db } from "./db";
import { users } from "./db/schema";
import { eq } from 'drizzle-orm'
export enum UserRole {
    ADMIN = "admin",
    USER = "user"
}


export const { handlers, signIn, signOut, auth } = NextAuth({
    adapter: DrizzleAdapter(db),
    session: {
        strategy: "jwt"
    },
    providers: [Credentials({
        credentials: {
            email: { label: "Email", type: "email" },
            password: { label: "Password", type: "password" }
        },
        async authorize(credentials) {
            // Login
            if (!credentials) {
                return null;
            }

            const obtainedUser = await db
                .select()
                .from(users)
                .where(eq(users.email, credentials.email as string))
                .limit(1);

            if (!obtainedUser.length) {
                throw new Error("No User Found");
            }

            if (!obtainedUser[0]!.password) {
                throw new Error("No Password Found");
            }
            const isUser: boolean = await compare(
                credentials.password as string,
                obtainedUser[0]!.password,
            );

            if (isUser) {
                return {
                    id: `${obtainedUser[0]!.id}`,
                    email: obtainedUser[0]!.email,
                    // role: obtainedUser[0]!.role as UserRole
                };
            } else {
                throw new Error("Please Check Password.");
            }
        },
    })],
})