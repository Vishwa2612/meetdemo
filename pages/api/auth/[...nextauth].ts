import NextAuth from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import { compare } from 'bcryptjs';
import pool from '../../../lib/dt'; 

export default NextAuth({
  providers: [
    CredentialsProvider({
      name: 'Credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials) {
          return null; 
        }

        const { email, password } = credentials;

        const client = await pool.connect();
        try {
          const result = await client.query('SELECT * FROM users WHERE email = $1', [email]);

          if (result.rows.length > 0) {
            const user = result.rows[0];
            const isValid = await compare(password, user.password);

            if (isValid) {
              return { id: user.id, email: user.email, role: user.role }; 
            }
          }
        } catch (error) {
          console.error('Error during authorization:', error);
        } finally {
          client.release();
        }

        return null; 
      },
    }),
  ],
  pages: {
    signIn: '/auth/login', 
  },
  session: {
    strategy: 'jwt', 
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.email = user.email;
        token.role = user.role; 
      }
      return token;
    },
    async session({ session, token }) {
      if (token) {
        session.user = {
          id: token.id,
          email: token.email,
          role: token.role
        };
      }
      return session;
    },
  },
});
