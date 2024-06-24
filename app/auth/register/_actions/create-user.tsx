'use server';

import { hash } from 'bcrypt';
import { db } from '@lib/db';
import { users } from '@lib/db/schema';

export async function createUser(email: string, password: string) {
  const hashedPassword = await hash(password, 15);
  await db.insert(users).values({
    email: email,
    password: hashedPassword,
  });
}
