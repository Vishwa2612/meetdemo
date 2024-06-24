'use server'

import { signIn } from "@lib/auth"

export async function loginUser(email: string, password: string) {

     await signIn("credentials", {
        email,
        password,
        redirect: true,
        redirectTo: "/"
    })
}