import { prisma } from './src/db.js';

async function main() {
  const users = await prisma.user.findMany({
    where: { isOrgOwner: true },
    include: { employee: true, organization: { include: { departments: true } } }
  });
  
  for (const user of users) {
    if (user.employee && !user.employee.departmentId) {
      const hrDept = user.organization.departments.find(d => d.name === 'Human Resources' || d.name === 'HR');
      if (hrDept) {
        await prisma.employee.update({
          where: { id: user.employee.id },
          data: { departmentId: hrDept.id }
        });
        console.log(`Assigned employee ${user.employee.id} to HR dept ${hrDept.id}`);
      }
    }
  }
}

main()
  .catch(e => console.error(e))
  .finally(() => prisma.$disconnect());
