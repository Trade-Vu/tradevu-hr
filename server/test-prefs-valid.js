import { request, gql } from 'graphql-request';
import { prisma } from './src/db.js';
import jwt from 'jsonwebtoken';

const UPDATE_PREFERENCES_MUTATION = gql`
  mutation UpdateUserPreferences($preferences: JSON!) {
    updateUserPreferences(preferences: $preferences) {
      id
      preferences
    }
  }
`;

async function main() {
  try {
    const user = await prisma.user.findUnique({ where: { email: 'ichizanum@gmail.com' } });
    const token = jwt.sign({ id: user.id }, process.env.JWT_SECRET || 'fallback-secret-if-not-set');
    
    console.log("Token generated:", token);

    const data = await request('http://localhost:3001/graphql', UPDATE_PREFERENCES_MUTATION, { 
      preferences: { dashboard_completed_steps: ['org'] } 
    }, {
      authorization: `Bearer ${token}`
    });
    console.log(data);
  } catch (err) {
    if (err.response) {
      console.error("HTTP ERROR RESPONSE:", JSON.stringify(err.response, null, 2));
    } else {
      console.error("HTTP ERROR:", err.message);
    }
  } finally {
    prisma.$disconnect();
  }
}
main();
