type Session = {
    user: {
      id: string;
      email: string;
    };
    expires: number;
    name?: string | null;
    email?: string | null;
  };
  
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
        async authorize(credentials: Record<"email" | "password", string> | undefined, req: any) {
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
                return { id: user.id, email: user.email }; 
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
      async session({ session, token }): Promise<Session> {
        if (token?.user) {
          session.user = token.user; 
        }
        return session;
      },
      async jwt({ token, user }) {
        if (user) {
          token.user = user; 
        }
        return token;
      },
    },
  });
  