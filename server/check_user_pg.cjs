const { Client } = require('pg');
const client = new Client({ connectionString: process.env.DATABASE_URL });
client.connect().then(() => {
  return client.query("SELECT id, email, role, \"employeeId\" FROM \"User\" WHERE email = 'chijioke@gmail.com';");
}).then(res => {
  console.log(res.rows);
}).catch(console.error).finally(() => client.end());
