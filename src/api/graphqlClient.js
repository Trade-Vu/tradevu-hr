import { GraphQLClient } from 'graphql-request';
import { appParams } from '@/lib/app-params';

// Vite bakes VITE_* env vars into the bundle at build time.
// .env.production is the source of truth for production builds.
const API_URL = import.meta.env.VITE_GRAPHQL_URL || 'https://api.hr.tradevu.co/graphql';

// Guard: catch misconfigured builds before they cause confusing errors.
// This will throw loudly in staging/production if localhost slips through.
if (import.meta.env.PROD && API_URL.includes('localhost')) {
  throw new Error(
    `[graphqlClient] VITE_GRAPHQL_URL resolved to "${API_URL}" in a production build. ` +
    `Check .env.production and your CI build environment.`
  );
}

export const gqlClient = new GraphQLClient(API_URL, {
  headers: () => {
    const token = localStorage.getItem('token') || appParams.token;
    if (token) {
      return { authorization: `Bearer ${token}` };
    }
    return {};
  }
});
