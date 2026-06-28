import { prisma } from './src/db.js';

async function main() {
  const hrDepts = await prisma.department.findMany({
    where: { name: 'HR' }
  });
  
  for (const dept of hrDepts) {
    // Only delete if there are no employees attached to be safe
    const empCount = await prisma.employee.count({ where: { departmentId: dept.id } });
    if (empCount === 0) {
      await prisma.department.delete({ where: { id: dept.id } });
      console.log(`Deleted duplicate HR dept ${dept.id}`);
    }
  }
}

main()
  .catch(e => console.error(e))
  .finally(() => prisma.$disconnect());
