import type { NextAuthOptions } from 'next-auth';
import GitHub from 'next-auth/providers/github';

/**
 * Auth.js (NextAuth) configuration for the single-owner vault.
 *
 * Identity comes only from the verified session. The vault is bound to one owner
 * via OWNER_ID; every protected path applies ownerAuthDecision against the
 * resolved session identity (see src/adapters/auth/session.ts).
 */
export const authOptions: NextAuthOptions = {
  providers: [
    GitHub({
      clientId: process.env.GITHUB_ID ?? '',
      clientSecret: process.env.GITHUB_SECRET ?? '',
    }),
  ],
  session: { strategy: 'jwt' },
  callbacks: {
    async jwt({ token, profile }) {
      // Persist a stable provider subject as the identity signal.
      if (profile && 'id' in profile && profile.id != null) {
        token.ownerId = String(profile.id);
      }
      return token;
    },
    async session({ session, token }) {
      (session as { ownerId?: string }).ownerId =
        typeof token.ownerId === 'string' ? token.ownerId : undefined;
      return session;
    },
  },
};
