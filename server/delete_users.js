import { prisma } from './src/db.js';

async function main() {
  try {
    const keepEmails = ['superadmin@tradevu.com', 'hradmin@tradevu.com'];
    
    const employeesToDelete = await prisma.employee.findMany({
      where: {
        email: { notIn: keepEmails }
      },
      select: { id: true }
    });
    
    const empIds = employeesToDelete.map(e => e.id);
    
    if (empIds.length > 0) {
      console.log(`Found ${empIds.length} employees to delete.`);
      
      // Clear managerId for direct reports of the employees we're deleting to avoid self-relation constraint issues
      await prisma.employee.updateMany({
        where: { managerId: { in: empIds } },
        data: { managerId: null }
      });
      
      const relatedModels = [
        'onboardingTask', 'document', 'leaveRequest', 'leaveBalance', 
        'attendance', 'payrollRecord', 'goal', 'checkIn', 
        'offboarding', 'employeeStatusHistory', 'promotionHistory', 
        'profileUpdateRequest', 'salaryHistory', 'asset', 'expenseClaim', 'loan'
      ];

      for (const model of relatedModels) {
        try {
          // Special case for checkIn since it has managerId
          if (model === 'checkIn') {
             await prisma[model].deleteMany({ where: { OR: [{employeeId: { in: empIds }}, {managerId: { in: empIds }}] } });
          } else {
             await prisma[model].deleteMany({ where: { employeeId: { in: empIds } } });
          }
        } catch (e) {
          console.log(`Could not delete related records in ${model}: ${e.message.split('\\n')[0]}`);
        }
      }
      
      console.log('Finished processing related child records.');
      
      const deletedEmployees = await prisma.employee.deleteMany({
        where: { id: { in: empIds } }
      });
      console.log(`Successfully deleted ${deletedEmployees.count} employees.`);
    } else {
      console.log('No employees to delete.');
    }
  } catch (error) {
    console.error('Error deleting records:', error);
  } finally {
    await prisma.$disconnect();
  }
}

main();
