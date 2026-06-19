const fs = require('fs');

const filePath = './server/src/graphql/resolvers/misc.resolver.js';
let content = fs.readFileSync(filePath, 'utf8');

// A simple regex might be too dangerous. Let's just print all occurrences of "createAuditLog" that are inside "$transaction"
const lines = content.split('\n');
for (let i = 0; i < lines.length; i++) {
  if (lines[i].includes('await createAuditLog(')) {
    console.log(`Line ${i+1}: ${lines[i]}`);
  }
}
