import { prisma } from './src/db.js';

async function main() {
  const user = await prisma.user.findUnique({ where: { email: 'chizanum@tradevu.co' } });
  const emps = await prisma.employee.findMany({ where: { organizationId: user.organizationId } });
  console.log("Employees in Org:", emps.map(e => ({ id: e.id, email: e.email, name: e.fullName, title: e.jobTitle })));
}

main()
  .catch(e => console.error(e))
  .finally(() => prisma.$disconnect());
