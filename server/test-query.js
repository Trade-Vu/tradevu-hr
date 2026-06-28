import { request, gql } from 'graphql-request';

const VALIDATE_INVITE_MUTATION = gql`
  mutation ValidateInviteToken($token: String!) {
    validateInviteToken(token: $token) {
      valid
      email
      role
      organizationName
    }
  }
`;

async function main() {
  try {
    const data = await request('http://localhost:3001/graphql', VALIDATE_INVITE_MUTATION, { 
      token: 'f54ecde4-d377-4b32-8500-130ec2489621' 
    });
    console.log(data);
  } catch (err) {
    console.error(err);
  }
}
main();
