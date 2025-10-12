import NextAuth from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import { compare } from 'bcryptjs';
import { prisma } from '@/lib/prisma';

export const { auth, signIn, signOut, handlers } = NextAuth({
  providers: [
    CredentialsProvider({
      name: 'Credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error('Missing credentials');
        }

        const supplier = await prisma.supplier.findUnique({
          where: { email: credentials.email as string },
        });

        if (!supplier) {
          throw new Error('No supplier found with this email');
        }

        if (!supplier.verified) {
          throw new Error('Please verify your email before logging in');
        }

        const isPasswordValid = await compare(credentials.password as string, supplier.password);

        if (!isPasswordValid) {
          throw new Error('Invalid password');
        }

        return {
          id: supplier.id,
          email: supplier.email,
          name: supplier.name,
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
      }
      return session;
    },
  },
  pages: {
    signIn: '/login',
    signOut: '/logout',
    error: '/auth/error',
  },
  session: {
    strategy: 'jwt',
  },
  secret: process.env.NEXTAUTH_SECRET,
});

