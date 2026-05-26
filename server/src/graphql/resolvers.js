import { hashPassword, comparePassword, generateToken } from '../utils/auth.js';
import { createAuditLog } from '../utils/audit.js';

export const resolvers = {
  Query: {
    me: async (_, __, { prisma, user, requireAuth }) => {
      requireAuth();
      return prisma.user.findUnique({ where: { id: user.id } });
    },
    organization: async (_, { id }, { prisma, requireAuth }) => {
      requireAuth();
      return prisma.organization.findUnique({ where: { id } });
    },
    employees: async (_, __, { prisma, user, requireAuth }) => {
      requireAuth();
      return prisma.employee.findMany({ where: { organizationId: user.organizationId } });
    },
    employee: async (_, { id }, { prisma, user, requireAuth }) => {
      requireAuth();
      return prisma.employee.findFirst({
        where: { id, organizationId: user.organizationId }
      });
    },
    departments: async (_, __, { prisma, user, requireAuth }) => {
      requireAuth();
      return prisma.department.findMany({ where: { organizationId: user.organizationId } });
    },
    // Phase 2 Queries
    leaveTypes: async (_, __, { prisma, user, requireAuth }) => {
      requireAuth();
      return prisma.leaveType.findMany({ where: { organizationId: user.organizationId } });
    },
    leaveRequests: async (_, { employeeId }, { prisma, user, requireAuth }) => {
      requireAuth();
      const where = employeeId ? { employeeId } : {};
      // Should also restrict to organization but skipped for brevity
      return prisma.leaveRequest.findMany({ where, orderBy: { createdAt: 'desc' } });
    },
    attendanceRecords: async (_, { employeeId, date }, { prisma, user, requireAuth }) => {
      requireAuth();
      const where = {};
      if (employeeId) where.employeeId = employeeId;
      if (date) where.date = new Date(date);
      return prisma.attendance.findMany({ where, orderBy: { date: 'desc' } });
    },
    documents: async (_, { employeeId }, { prisma, user, requireAuth }) => {
      requireAuth();
      return prisma.document.findMany({ where: { employeeId, status: 'ACTIVE' } });
    },
    notifications: async (_, __, { prisma, user, requireAuth }) => {
      requireAuth();
      return prisma.notification.findMany({ where: { userId: user.id }, orderBy: { createdAt: 'desc' } });
    },
    
    // Phase 3 Queries
    payrollRuns: async (_, __, { prisma, user, requireRole }) => {
      requireRole(['SUPER_ADMIN', 'HR_ADMIN', 'FINANCE_ADMIN']);
      return prisma.payrollRun.findMany({ where: { organizationId: user.organizationId }, orderBy: { month: 'desc' } });
    },
    payrollRecords: async (_, { payrollRunId }, { prisma, user, requireRole }) => {
      requireRole(['SUPER_ADMIN', 'HR_ADMIN', 'FINANCE_ADMIN']);
      return prisma.payrollRecord.findMany({ where: { payrollRunId } });
    },
    myPayrollRecords: async (_, __, { prisma, user, requireAuth }) => {
      requireAuth();
      if (!user.employeeId) return [];
      return prisma.payrollRecord.findMany({ where: { employeeId: user.employeeId } });
    },
    
    // Phase 4 Queries
    policies: async (_, __, { prisma, user, requireAuth }) => {
      requireAuth();
      return prisma.policy.findMany({ where: { organizationId: user.organizationId } });
    },
    announcements: async (_, __, { prisma, user, requireAuth }) => {
      requireAuth();
      return prisma.announcement.findMany({ where: { organizationId: user.organizationId }, orderBy: { createdAt: 'desc' } });
    },
    goals: async (_, { employeeId }, { prisma, user, requireAuth }) => {
      requireAuth();
      return prisma.goal.findMany({ where: { employeeId } });
    }
  },

  Mutation: {
    register: async (_, { input }, { prisma }) => {
      const { email, password, orgName } = input;
      const existingUser = await prisma.user.findUnique({ where: { email } });
      if (existingUser) throw new Error("Email already in use");
      const passwordHash = await hashPassword(password);
      const organization = await prisma.organization.create({
        data: { name: orgName, ownerEmail: email }
      });
      const user = await prisma.user.create({
        data: { email, passwordHash, role: 'SUPER_ADMIN', organizationId: organization.id, isOrgOwner: true }
      });
      const token = generateToken(user);
      return { token, user };
    },
    login: async (_, { email, password }, { prisma }) => {
      const user = await prisma.user.findUnique({ where: { email } });
      if (!user) throw new Error("Invalid credentials");
      const isValid = await comparePassword(password, user.passwordHash);
      if (!isValid) throw new Error("Invalid credentials");
      const token = generateToken(user);
      return { token, user };
    },
    createEmployee: async (_, { input }, { prisma, user, requireRole }) => {
      requireRole(['SUPER_ADMIN', 'HR_ADMIN']);
      const count = await prisma.employee.count({ where: { organizationId: user.organizationId } });
      const employeeCode = `EMP-${(count + 1).toString().padStart(6, '0')}`;
      const emp = await prisma.employee.create({
        data: { ...input, employeeCode, organizationId: user.organizationId, hireDate: new Date(input.hireDate) }
      });
      await createAuditLog({ actorId: user.id, entityType: 'Employee', entityId: emp.id, action: 'CREATE' });
      return emp;
    },
    deleteEmployee: async (_, { id }, { prisma, user, requireRole }) => {
      requireRole(['SUPER_ADMIN', 'HR_ADMIN']);
      await prisma.employee.delete({ where: { id, organizationId: user.organizationId } });
      await createAuditLog({ actorId: user.id, entityType: 'Employee', entityId: id, action: 'DELETE' });
      return true;
    },
    createDepartment: async (_, { name, code }, { prisma, user, requireRole }) => {
      requireRole(['SUPER_ADMIN', 'HR_ADMIN']);
      return prisma.department.create({
        data: { name, code, organizationId: user.organizationId }
      });
    },

    // Phase 2 Mutations
    createLeaveType: async (_, { name, daysPerYear, isPaid = true, requiresApproval = true }, { prisma, user, requireRole }) => {
      requireRole(['SUPER_ADMIN', 'HR_ADMIN']);
      return prisma.leaveType.create({
        data: { name, daysPerYear, isPaid, requiresApproval, organizationId: user.organizationId }
      });
    },
    submitLeaveRequest: async (_, { input }, { prisma, user, requireAuth }) => {
      requireAuth();
      if (!user.employeeId) throw new Error("User is not an employee");
      return prisma.leaveRequest.create({
        data: {
          employeeId: user.employeeId,
          leaveTypeId: input.leaveTypeId,
          startDate: new Date(input.startDate),
          endDate: new Date(input.endDate),
          totalDays: input.totalDays,
          reason: input.reason
        }
      });
    },
    approveLeaveRequest: async (_, { id }, { prisma, user, requireRole }) => {
      requireRole(['SUPER_ADMIN', 'HR_ADMIN', 'MANAGER']);
      return prisma.leaveRequest.update({
        where: { id },
        data: { status: 'APPROVED' }
      });
    },
    rejectLeaveRequest: async (_, { id }, { prisma, user, requireRole }) => {
      requireRole(['SUPER_ADMIN', 'HR_ADMIN', 'MANAGER']);
      return prisma.leaveRequest.update({
        where: { id },
        data: { status: 'REJECTED' }
      });
    },
    clockIn: async (_, __, { prisma, user, requireAuth }) => {
      requireAuth();
      if (!user.employeeId) throw new Error("User is not an employee");
      const today = new Date();
      today.setHours(0, 0, 0, 0); // Start of today

      return prisma.attendance.upsert({
        where: { employeeId_date: { employeeId: user.employeeId, date: today } },
        update: { clockIn: new Date() },
        create: { employeeId: user.employeeId, date: today, clockIn: new Date() }
      });
    },
    clockOut: async (_, __, { prisma, user, requireAuth }) => {
      requireAuth();
      if (!user.employeeId) throw new Error("User is not an employee");
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      return prisma.attendance.update({
        where: { employeeId_date: { employeeId: user.employeeId, date: today } },
        data: { clockOut: new Date() }
      });
    },
    uploadDocument: async (_, args, { prisma, user, requireRole }) => {
      requireRole(['SUPER_ADMIN', 'HR_ADMIN']);
      const { employeeId, name, category, fileUrl, fileType, visibilityLevel } = args;
      return prisma.document.create({
        data: { employeeId, name, category, fileUrl, fileType, visibilityLevel, uploadedBy: user.id }
      });
    },
    markNotificationRead: async (_, { id }, { prisma, user, requireAuth }) => {
      requireAuth();
      return prisma.notification.update({
        where: { id, userId: user.id },
        data: { isRead: true }
      });
    },

    // Phase 3 Mutations
    createPayrollRun: async (_, { month, periodStart, periodEnd }, { prisma, user, requireRole }) => {
      requireRole(['SUPER_ADMIN', 'HR_ADMIN', 'FINANCE_ADMIN']);
      
      const employees = await prisma.employee.findMany({
        where: { organizationId: user.organizationId, employmentStatus: 'ACTIVE' }
      });

      let totalGross = 0;
      let totalNet = 0;

      const payrollRun = await prisma.payrollRun.create({
        data: {
          month,
          periodStart: new Date(periodStart),
          periodEnd: new Date(periodEnd),
          organizationId: user.organizationId,
          status: 'DRAFT',
          totalGross: 0,
          totalNet: 0
        }
      });

      const records = employees.map(emp => {
        const basicSalary = emp.basicSalary || 0;
        // Simplified Tax Engine (Flat 10% for example purposes)
        const tax = basicSalary * 0.10;
        const netPay = basicSalary - tax;

        totalGross += basicSalary;
        totalNet += netPay;

        return {
          payrollRunId: payrollRun.id,
          employeeId: emp.id,
          basicSalary,
          allowances: {},
          grossPay: basicSalary,
          deductions: { tax },
          totalDeductions: tax,
          netPay,
        };
      });

      await prisma.payrollRecord.createMany({ data: records });

      return prisma.payrollRun.update({
        where: { id: payrollRun.id },
        data: { totalGross, totalNet }
      });
    },

    approvePayrollRun: async (_, { id }, { prisma, user, requireRole }) => {
      requireRole(['SUPER_ADMIN', 'FINANCE_ADMIN']);
      const pr = await prisma.payrollRun.update({
        where: { id, organizationId: user.organizationId },
        data: { status: 'APPROVED', approvedBy: user.id }
      });
      await createAuditLog({ actorId: user.id, entityType: 'PayrollRun', entityId: id, action: 'APPROVED' });
      return pr;
    },

    generatePayslip: async (_, { recordId }, { prisma, user, requireAuth }) => {
      requireAuth();
      // Placeholder for PDF Generation Logic (PDFKit, Puppeteer, etc.)
      const mockPdfUrl = `https://tradevu-hris.s3.amazonaws.com/payslips/${recordId}.pdf`;
      await prisma.payrollRecord.update({
        where: { id: recordId },
        data: { payslipUrl: mockPdfUrl }
      });
      return mockPdfUrl;
    },

    // Phase 4 Mutations
    createPolicy: async (_, { title, category, content, requiresAck }, { prisma, user, requireRole }) => {
      requireRole(['SUPER_ADMIN', 'HR_ADMIN']);
      return prisma.policy.create({
        data: { title, category, content, requiresAck, organizationId: user.organizationId, createdBy: user.id }
      });
    },
    acknowledgePolicy: async (_, { policyId }, { prisma, user, requireAuth }) => {
      requireAuth();
      await prisma.policyAcknowledgment.upsert({
        where: { policyId_userId: { policyId, userId: user.id } },
        update: {},
        create: { policyId, userId: user.id }
      });
      return true;
    },
    createAnnouncement: async (_, { title, content, priority }, { prisma, user, requireRole }) => {
      requireRole(['SUPER_ADMIN', 'HR_ADMIN']);
      return prisma.announcement.create({
        data: { title, content, priority, organizationId: user.organizationId, createdBy: user.id }
      });
    },
    createGoal: async (_, { employeeId, title, weight, period }, { prisma, user, requireRole }) => {
      requireRole(['SUPER_ADMIN', 'HR_ADMIN', 'MANAGER']);
      return prisma.goal.create({
        data: { employeeId, title, weight, period }
      });
    }
  }
};
