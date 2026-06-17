import fs from 'fs';
import { parse } from 'graphql';
const content = fs.readFileSync('src/pages/EmployeeDetail.jsx', 'utf-8');
const matches = [...content.matchAll(/gql`([\s\S]*?)`/g)];
matches.forEach((m, i) => {
  try { parse(m[1]); } catch(e) { console.log(`Error in match ${i}:\n${m[1]}`); }
});
