import { GraphQLClient } from 'graphql-request';
import jwt from 'jsonwebtoken';

const token = jwt.sign({ id: "mock_ceo", email: "ceo@tradevu.com", role: "super_admin" }, "super_secret_jwt_key_please_change_in_production", { expiresIn: '7d' });

const gqlClient = new GraphQLClient('http://localhost:3001/graphql', {
  headers: {
    authorization: `Bearer ${token}`
  }
});

const INVITE_USER_MUTATION = `
  mutation InviteUser($input: InviteUserInput!) {
    inviteUser(input: $input)
  }
`;

async function run() {
  try {
    const data = await gqlClient.request(INVITE_USER_MUTATION, {
      input: {
        email: "test_hr@tradevu.com",
        role: "HR_ADMIN"
      }
    });
    console.log("SUCCESS:", JSON.stringify(data, null, 2));
  } catch (err) {
    console.error("ERROR:", err.response || err);
  }
}

run();
