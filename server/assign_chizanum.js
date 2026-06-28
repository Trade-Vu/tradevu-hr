import { prisma } from './src/db.js';

async function main() {
  const user = await prisma.user.findUnique({
    where: { email: 'chizanum@tradevu.co' },
    include: { employee: true, organization: { include: { departments: true } } }
  });
  
  if (user && user.employee && !user.employee.departmentId) {
    const hrDept = user.organization.departments.find(d => d.name === 'Human Resources' || d.name === 'HR');
    if (hrDept) {
      await prisma.employee.update({
        where: { id: user.employee.id },
        data: { departmentId: hrDept.id }
      });
      console.log(`Assigned chizanum (emp ${user.employee.id}) to HR dept ${hrDept.id}`);
    } else {
      console.log('No HR dept found for organization');
    }
  } else {
    console.log('User already has a department or no employee record:', user?.employee?.departmentId);
  }
}

main()
  .catch(e => console.error(e))
  .finally(() => prisma.$disconnect());
