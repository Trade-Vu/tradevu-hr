import { prisma } from './db.js';
import { verifyToken } from './utils/auth.js';

export const createContext = async ({ req }) => {
  // Get the token from the headers
  const authHeader = req.headers.authorization || '';
  const token = authHeader.replace('Bearer ', '');

  let user = null;
  if (token) {
    const decoded = verifyToken(token);
    if (decoded) {
      // We could optionally fetch the full user from DB if we need fresh data,
      // but decoded token has { id, email, role, organizationId }
      user = decoded;
    }
  }

  return {
    prisma,
    user,
    // A helper to assert authentication
    requireAuth: () => {
      if (!user) throw new Error('Unauthenticated');
      return user;
    },
    // A helper to assert specific roles
    requireRole: (allowedRoles) => {
      if (!user) throw new Error('Unauthenticated');
      if (!allowedRoles.includes(user.role)) {
        throw new Error('Unauthorized');
      }
      return user;
    }
  };
};
