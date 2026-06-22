import { prisma } from './src/db.js';
import { applyDynamicBenefits } from './src/utils/benefitsMatrix.js';

async function backfillLeaveBalances() {
  console.log("Starting backfill for missing leave balances...");
  
  // Find all active employees
  const employees = await prisma.employee.findMany();
  
  let updatedCount = 0;
  for (const emp of employees) {
    // Check if they have an Annual leave balance for the current year
    const currentYear = new Date().getFullYear();
    const annualLeaveType = await prisma.leaveType.findFirst({
      where: {
        organizationId: emp.organizationId,
        name: { contains: 'Annual', mode: 'insensitive' }
      }
    });
    
    if (annualLeaveType) {
      const balance = await prisma.leaveBalance.findUnique({
        where: {
          employeeId_leaveTypeId_year: {
            employeeId: emp.id,
            leaveTypeId: annualLeaveType.id,
            year: currentYear
          }
        }
      });
      
      // If no balance exists, apply benefits to generate it
      if (!balance) {
        console.log(`Generating leave balance for employee: ${emp.id}`);
        await applyDynamicBenefits(emp.id, emp.employeeGrade || 'Entry Level', prisma);
        updatedCount++;
      }
    }
  }
  
  console.log(`Backfill complete. Updated ${updatedCount} employees.`);
  await prisma.$disconnect();
}

backfillLeaveBalances().catch(e => {
  console.error(e);
  prisma.$disconnect();
  process.exit(1);
});
