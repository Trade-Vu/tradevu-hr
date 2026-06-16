import { prisma } from './src/db.js';

async function main() {
  const emps = await prisma.employee.findMany({
    where: { managerId: null },
    include: { department: true }
  });

  for (const emp of emps) {
    let managerId = null;
    if (emp.department && emp.department.headEmployeeId) {
      managerId = emp.department.headEmployeeId;
    } else {
      const hrAdmin = await prisma.user.findFirst({
        where: { organizationId: emp.organizationId, role: 'HR_ADMIN', employeeId: { not: null } }
      });
      if (hrAdmin) managerId = hrAdmin.employeeId;
    }

    if (managerId) {
      await prisma.employee.update({
        where: { id: emp.id },
        data: { managerId }
      });
      console.log(`Updated manager for ${emp.fullName}`);
    }
  }
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
