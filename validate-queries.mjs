import fs from 'fs';
import path from 'path';
import { parse, validate, buildSchema } from 'graphql';

// We will read the schema directly and strip 'export const typeDefs = `#graphql'
let typeDefsContent = fs.readFileSync(path.join(process.cwd(), 'server/src/graphql/typeDefs.js'), 'utf-8');
const match = typeDefsContent.match(/export const typeDefs = `(?:#graphql)?([\s\S]*?)`;/);
if (match) {
  typeDefsContent = match[1];
} else {
  console.error("Could not extract typeDefs");
  process.exit(1);
}

let schema;
try {
  schema = buildSchema(typeDefsContent);
} catch (e) {
  console.error("Failed to build schema:", e.message);
  process.exit(1);
}

function walkSync(dir, filelist = []) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const dirFile = path.join(dir, file);
    const dirent = fs.statSync(dirFile);
    if (dirent.isDirectory()) {
      filelist = walkSync(dirFile, filelist);
    } else if (dirFile.endsWith('.jsx') || dirFile.endsWith('.js')) {
      filelist.push(dirFile);
    }
  }
  return filelist;
}

const files = walkSync(path.join(process.cwd(), 'src'));

let hasErrors = false;

for (const file of files) {
  const content = fs.readFileSync(file, 'utf-8');
  // Match gql`...` patterns
  const matches = [...content.matchAll(/gql`([\s\S]*?)`/g)];
  
  if (matches.length > 0) {
    for (let i = 0; i < matches.length; i++) {
      const queryStr = matches[i][1];
      try {
        const document = parse(queryStr);
        const errors = validate(schema, document);
        if (errors.length > 0) {
          console.error(`\nMismatch in ${file}:`);
          for (const err of errors) {
            console.error(`  - ${err.message}`);
          }
          hasErrors = true;
        }
      } catch (e) {
        console.error(`\nParse error in ${file}:`);
        console.error(`  - ${e.message}`);
        hasErrors = true;
      }
    }
  }
}

if (!hasErrors) {
  console.log("No schema mismatches found!");
}
