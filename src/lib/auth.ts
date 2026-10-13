import type { NextAuthOptions } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import GoogleProvider from 'next-auth/providers/google';
import bcrypt from 'bcryptjs';
import { generateUniqueUsername, isAdminEmail, newUserDoc, usersCollection } from './users';

const providers: NextAuthOptions['providers'] = [
  CredentialsProvider({
    name: 'Email',
    credentials: {
      email: { label: 'Email', type: 'email' },
      password: { label: 'Password', type: 'password' },
    },
    async authorize(credentials) {
      const email = credentials?.email?.trim().toLowerCase();
      const password = credentials?.password;
      if (!email || !password) return null;

      const users = await usersCollection();
      const user = await users.findOne({ email });
      if (!user?.passwordHash) return null;
      if (user.banned) throw new Error('AccountSuspended');

      const valid = await bcrypt.compare(password, user.passwordHash);
      if (!valid) return null;

      return { id: user._id.toString(), email: user.email, name: user.name, image: user.image };
    },
  }),
];

if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
  providers.push(
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    })
  );
}

const isConfigured = (value?: string) => Boolean(value && !value.startsWith('your-'));

export const googleAuthEnabled = isConfigured(process.env.GOOGLE_CLIENT_ID) && isConfigured(process.env.GOOGLE_CLIENT_SECRET);

export const authOptions: NextAuthOptions = {
  providers,
  session: { strategy: 'jwt', maxAge: 60 * 60 * 24 * 30 },
  pages: {
    signIn: '/auth/signin',
    error: '/auth/signin',
  },
  callbacks: {
    async signIn({ user, account }) {
      if (account?.provider !== 'google') return true;
      if (!user.email) return false;

      const users = await usersCollection();
      const email = user.email.toLowerCase();
      const existing = await users.findOne({ email });
      if (existing?.banned) return '/auth/signin?error=AccountSuspended';
      if (!existing) {
        const username = await generateUniqueUsername(email.split('@')[0]);
        await users.insertOne(
          newUserDoc({
            email,
            name: user.name || username,
            username,
            image: user.image || undefined,
            provider: 'google',
          })
        );
      }
      return true;
    },

    async jwt({ token, user, trigger }) {
      if (user || trigger === 'update' || !token.id) {
        const email = (user?.email || token.email)?.toLowerCase();
        if (!email) return token;
        const users = await usersCollection();
        const dbUser = await users.findOne({ email });
        if (!dbUser) return token;

        if (dbUser.role !== 'admin' && isAdminEmail(dbUser.email)) {
          await users.updateOne({ _id: dbUser._id }, { $set: { role: 'admin' } });
          dbUser.role = 'admin';
        }

        token.id = dbUser._id.toString();
        token.username = dbUser.username;
        token.role = dbUser.role;
        token.name = dbUser.name;
        token.picture = dbUser.image ?? null;
      }
      return token;
    },

    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id;
        session.user.username = token.username;
        session.user.role = token.role;
        session.user.name = token.name ?? null;
        session.user.image = (token.picture as string | null | undefined) ?? null;
      }
      return session;
    },
  },
  secret: process.env.NEXTAUTH_SECRET,
};
