import type { NextAuthOptions, Profile } from 'next-auth';
import type { OAuthConfig } from 'next-auth/providers/oauth';
import GitHub from 'next-auth/providers/github';
import Google from 'next-auth/providers/google';

/**
 * Auth.js (NextAuth) configuration for the single-owner vault.
 *
 * Both Google and GitHub are supported; each is enabled only when its
 * credentials are present in the environment. Identity comes only from the
 * verified session. The vault is bound to one owner via OWNER_ID, and every
 * protected path applies ownerAuthDecision (see src/adapters/auth/session.ts).
 *
 * The owner id is provider-qualified and stable: `${provider}:${accountId}`
 * (e.g. "github:12345" or "google:108…"). Sign in once and the owner-claim
 * screen shows you this value to put in OWNER_ID.
 */
const providers: OAuthConfig<Profile>[] = [];

if (process.env.GITHUB_ID && process.env.GITHUB_SECRET) {
  providers.push(
    GitHub({
      clientId: process.env.GITHUB_ID,
      clientSecret: process.env.GITHUB_SECRET,
    }) as OAuthConfig<Profile>,
  );
}

if (process.env.GOOGLE_ID && process.env.GOOGLE_SECRET) {
  providers.push(
    Google({
      clientId: process.env.GOOGLE_ID,
      clientSecret: process.env.GOOGLE_SECRET,
    }) as OAuthConfig<Profile>,
  );
}

export const authOptions: NextAuthOptions = {
  providers,
  session: { strategy: 'jwt' },
  callbacks: {
    async jwt({ token, account }) {
      // On sign-in, capture a stable, provider-qualified owner id.
      if (account?.provider && account.providerAccountId) {
        token.ownerId = `${account.provider}:${account.providerAccountId}`;
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
