const fs = require('fs');
const filePath = 'server/src/graphql/resolvers/auth.resolver.js';
let content = fs.readFileSync(filePath, 'utf8');

const importStatement = `import { NotificationService } from '../../services/NotificationService.js';\n`;
if (!content.includes('NotificationService')) {
  content = importStatement + content;
}

const targetLogic = `
      // Audit Log
      await prisma.auditLog.create({
        data: {
          organizationId: user.organizationId,
          userId: user.id,
          action: 'SUBMIT_PROFILE',
          entityType: 'Employee',
          entityId: user.employeeId,
          ipAddress,
          details: { message: 'Employee submitted profile for review' }
        }
      });
`;

const replaceLogic = `
      // Audit Log
      await prisma.auditLog.create({
        data: {
          organizationId: user.organizationId,
          userId: user.id,
          action: 'SUBMIT_PROFILE',
          entityType: 'Employee',
          entityId: user.employeeId,
          ipAddress,
          details: { message: 'Employee submitted profile for review' }
        }
      });

      // Notify the manager or HR about the pending approval
      let managerId = employee.managerId;
      if (!managerId) {
        const hrAdmin = await prisma.user.findFirst({
          where: { organizationId: user.organizationId, role: 'HR_ADMIN', employeeId: { not: null } }
        });
        if (hrAdmin) managerId = hrAdmin.employeeId;
      }
      
      if (managerId) {
        const managerUser = await prisma.user.findFirst({
          where: { employeeId: managerId }
        });
        if (managerUser) {
          await NotificationService.notify({
            prisma,
            userId: managerUser.id,
            organizationId: user.organizationId,
            title: 'Employee Approval Required',
            message: \`\${employee.firstName} \${employee.lastName} has completed their profile and is waiting for approval.\`,
            type: 'APPROVAL',
            link: \`/employees/\${employee.id}\`
          });
        }
      }
`;

content = content.replace(targetLogic, replaceLogic);
fs.writeFileSync(filePath, content);
console.log('auth.resolver.js patched successfully');
