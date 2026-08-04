import NextAuth from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import { compare } from 'bcryptjs';
import { prisma } from '@/lib/prisma';
import { ensureDefaultAdmin, getDefaultAdminEmail } from '@/lib/default-admin';
import { applyProductionAuthUrl } from '@/lib/app-url';

applyProductionAuthUrl();

export const { auth, signIn, signOut, handlers } = NextAuth({
  providers: [
    CredentialsProvider({
      name: 'Credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null;

        const email = String(credentials.email).trim().toLowerCase();
        const password = String(credentials.password);

        try {
          const user = email === getDefaultAdminEmail()
            ? await ensureDefaultAdmin()
            : await prisma.users.findUnique({
                where: { email },
                include: { suppliers: true },
              });

          if (!user?.password || !user.emailVerified) return null;
          if (!await compare(password, user.password)) return null;

          const supplierProfile = user.suppliers?.[0];
          return {
            id: user.id,
            email: user.email || '',
            name: user.name || '',
            role: user.role,
            companyName: supplierProfile?.companyName || undefined,
            verified: true,
          };
        } catch (error) {
          console.error('Credential authorization failed:', error);
          return null;
        }
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
      if (token && session.user) {
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
  pages: { signIn: '/login', error: '/auth/error' },
  session: { strategy: 'jwt', maxAge: 30 * 24 * 60 * 60 },
  jwt: { maxAge: 30 * 24 * 60 * 60 },
  secret: process.env.AUTH_SECRET || process.env.NEXTAUTH_SECRET,
  trustHost: true,
  debug: process.env.NODE_ENV === 'development',
});
