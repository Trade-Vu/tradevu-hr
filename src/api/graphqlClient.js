import { GraphQLClient } from 'graphql-request';
import { appParams } from '@/lib/app-params';

const API_URL = import.meta.env.VITE_GRAPHQL_URL;


export const gqlClient = new GraphQLClient(API_URL||"https://api.hr.tradevu.co/graphql", {
  headers: () => {
    // We can fetch the token from localStorage or from the context.
    const token = localStorage.getItem('token') || appParams.token;
    if (token) {
      return { authorization: `Bearer ${token}` };
    }
    return {};
  }
});
