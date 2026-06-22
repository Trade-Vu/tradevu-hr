const { GraphQLClient, gql } = require('graphql-request');

async function main() {
  const client = new GraphQLClient('http://localhost:3001/graphql', {
    // We need to pass the auth token. Let me get a token first.
  });
}
main();
