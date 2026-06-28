import { request, gql } from 'graphql-request';

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
    const data = await request('http://localhost:3001/graphql', UPDATE_PREFERENCES_MUTATION, { 
      preferences: { dashboard_completed_steps: ['org'] } 
    }, {
      authorization: 'Bearer mock_token' // just any token to see if it reaches the resolver or fails parsing
    });
    console.log(data);
  } catch (err) {
    console.error("HTTP ERROR:", err.message);
  }
}
main();
