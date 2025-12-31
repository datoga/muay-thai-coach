import NextAuth from 'next-auth';
import Google from 'next-auth/providers/google';
import type { NextAuthConfig, Session } from 'next-auth';
import type { JWT } from 'next-auth/jwt';

// Extended types for Google OAuth tokens
interface ExtendedJWT extends JWT {
  accessToken?: string;
  refreshToken?: string;
  accessTokenExpires?: number;
  error?: string;
}

interface ExtendedSession extends Session {
  accessToken?: string;
  error?: string;
}

// Google OAuth scopes
const GOOGLE_SCOPES = [
  'openid',
  'email',
  'profile',
  'https://www.googleapis.com/auth/drive.file',
].join(' ');

async function refreshAccessToken(token: ExtendedJWT) {
  try {
    const url =
      'https://oauth2.googleapis.com/token?' +
      new URLSearchParams({
        client_id: process.env.GOOGLE_CLIENT_ID!,
        client_secret: process.env.GOOGLE_CLIENT_SECRET!,
        grant_type: 'refresh_token',
        refresh_token: token.refreshToken!,
      });

    const response = await fetch(url, {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      method: 'POST',
    });

    const refreshedTokens = await response.json();

    if (!response.ok) {
      throw refreshedTokens;
    }

    return {
      ...token,
      accessToken: refreshedTokens.access_token,
      accessTokenExpires: Date.now() + refreshedTokens.expires_in * 1000,
      refreshToken: refreshedTokens.refresh_token ?? token.refreshToken,
    };
  } catch (error) {
    console.error('Error refreshing access token:', error);
    return {
      ...token,
      error: 'RefreshAccessTokenError',
    };
  }
}

export const authConfig: NextAuthConfig = {
  providers: [
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      authorization: {
        params: {
          scope: GOOGLE_SCOPES,
          prompt: 'consent',
          access_type: 'offline',
          response_type: 'code',
        },
      },
    }),
  ],
  callbacks: {
    async jwt({ token, account }) {
      const extendedToken = token as ExtendedJWT;
      
      // Initial sign in
      if (account) {
        return {
          ...extendedToken,
          accessToken: account.access_token,
          refreshToken: account.refresh_token,
          accessTokenExpires: account.expires_at
            ? account.expires_at * 1000
            : Date.now() + 3600 * 1000,
        } as ExtendedJWT;
      }

      // Return previous token if the access token has not expired yet
      if (
        extendedToken.accessTokenExpires &&
        Date.now() < extendedToken.accessTokenExpires - 60000
      ) {
        return extendedToken;
      }

      // Access token has expired, try to refresh it
      return refreshAccessToken(extendedToken);
    },
    async session({ session, token }) {
      const extendedToken = token as ExtendedJWT;
      const extendedSession = session as ExtendedSession;
      extendedSession.accessToken = extendedToken.accessToken;
      extendedSession.error = extendedToken.error;
      return extendedSession;
    },
  },
  pages: {
    signIn: '/en', // Redirect to landing page
    error: '/en', // Redirect to landing page on error
  },
  session: {
    strategy: 'jwt',
  },
};

export const { handlers, auth, signIn, signOut } = NextAuth(authConfig);

