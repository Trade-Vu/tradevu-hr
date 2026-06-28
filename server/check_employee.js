import { prisma } from './src/db.js';

async function main() {
  const user = await prisma.user.findUnique({
    where: { email: 'chizanum@tradevu.co' },
    include: { employee: true, organization: { include: { departments: true } } }
  });
  console.log("User's Employee Record:", user.employee);
  console.log("Organization Departments:", user.organization.departments);
}

main()
  .catch(e => console.error(e))
  .finally(() => prisma.$disconnect());
