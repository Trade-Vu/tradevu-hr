import { GraphQLClient } from 'graphql-request';
import { appParams } from '@/lib/app-params';

const rawGraphqlUrl = import.meta.env.VITE_GRAPHQL_URL;
const rawAppUrl = import.meta.env.VITE_APP_URL;
const API_URL = rawGraphqlUrl
  ? rawGraphqlUrl
  : rawAppUrl
    ? (rawAppUrl.endsWith('/graphql') ? rawAppUrl : `${rawAppUrl.replace(/\/$/, '')}/graphql`)
    : 'http://localhost:3001/graphql';

export const gqlClient = new GraphQLClient(API_URL, {
  headers: () => {
    // We can fetch the token from localStorage or from the context.
    const token = localStorage.getItem('token') || appParams.token;
    if (token) {
      return { authorization: `Bearer ${token}` };
    }
    return {};
  }
});
