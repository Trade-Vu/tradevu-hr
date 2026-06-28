import { prisma } from './src/db.js';

async function main() {
  const emps = await prisma.employee.findMany();
  console.log("Employees in DB:", emps.map(e => ({ id: e.id, email: e.email, name: e.fullName, title: e.jobTitle })));
}

main()
  .catch(e => console.error(e))
  .finally(() => prisma.$disconnect());
