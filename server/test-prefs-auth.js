import { request, gql } from 'graphql-request';

const LOGIN = gql`
  mutation Login($email: String!, $password: String!) {
    login(email: $email, password: $password) {
      token
      user { id }
    }
  }
`;

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
    const loginData = await request('http://localhost:3001/graphql', LOGIN, {
      email: 'ichizanum@gmail.com', // CEO email from the db check earlier
      password: 'password123' // assuming default password
    });
    const token = loginData.login.token;
    console.log("Logged in!");

    const data = await request('http://localhost:3001/graphql', UPDATE_PREFERENCES_MUTATION, { 
      preferences: { dashboard_completed_steps: ['org'] } 
    }, {
      authorization: `Bearer ${token}`
    });
    console.log(data);
  } catch (err) {
    console.error("HTTP ERROR:", err.message);
  }
}
main();
