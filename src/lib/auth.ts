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


        const user = await prisma.users.findUnique({
          where: { email: credentials.email as string },
          include: {
            suppliers: true,
          },
        });

        if (!user) {
          throw new Error('No user found with this email');
        }

        if (!user.emailVerified) {
          throw new Error('Please verify your email before logging in');
        }

        if (!user.password) {
          throw new Error('Password not set for this account');
        }

        const isPasswordValid = await compare(credentials.password as string, user.password);

        if (!isPasswordValid) {
          throw new Error('Invalid password');
        }

        // Get the first supplier profile (if exists)
        const supplierProfile = user.suppliers?.[0];

        return {
          id: user.id,
          email: user.email || '',
          name: user.name || '',
          role: user.role,
          companyName: supplierProfile?.companyName || undefined,
          verified: !!user.emailVerified,
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.name = user.name;
        token.email = user.email;
        token.role = (user as any).role;
        token.companyName = (user as any).companyName || undefined;
        token.verified = (user as any).verified;
      }
      return token;
    },
    async session({ session, token }) {
      if (token) {
        session.user.id = token.id as string;
        session.user.name = token.name as string;
        session.user.email = token.email as string;
        session.user.role = token.role as string;
        session.user.companyName = token.companyName as string | undefined;
        session.user.verified = token.verified as boolean;
      }
      return session;
    },
  },
  pages: {
    signIn: '/login',
    error: '/auth/error',
  },
  session: {
    strategy: 'jwt',
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  jwt: {
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  secret: process.env.NEXTAUTH_SECRET,
  debug: process.env.NODE_ENV === 'development',
});


