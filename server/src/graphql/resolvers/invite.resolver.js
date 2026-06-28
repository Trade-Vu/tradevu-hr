import { hashPassword, generateToken } from '../../utils/auth.js';
import { NotificationService } from '../../services/NotificationService.js';
import { createAuditLog } from '../../utils/audit.js';

export const inviteResolvers = {
  Mutation: {
    inviteUser: async (_, { input }, { prisma, user, requireRole, ipAddress }) => {
      requireRole(['SUPER_ADMIN', 'HR_ADMIN']);
      
      const { email, role } = input;

      const existingUser = await prisma.user.findUnique({ where: { email } });
      if (existingUser) {
        throw new Error('A user with this email already exists.');
      }

      const { randomUUID } = await import('crypto');
      const token = randomUUID();
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + 7); // 7 days expiry

      await prisma.inviteToken.create({
        data: {
          email,
          role,
          organizationId: user.organizationId,
          token,
          expiresAt,
          invitedByUserId: user.id
        }
      });

      if (role === 'HR_ADMIN') {
        const hrDept = await prisma.department.findFirst({
          where: { organizationId: user.organizationId, name: 'Human Resources' }
        });
        
        if (!hrDept) {
          await prisma.department.create({
            data: {
              name: 'Human Resources',
              code: 'HR',
              organizationId: user.organizationId
            }
          });
        }
      }

      const inviteLink = `${process.env.FRONTEND_URL || 'https://staging.hr.tradevu.co'}/accept-invite?token=${token}`;

      await NotificationService.notify({
        targetEmail: email,
        category: 'invite',
        title: `You've been invited to join TradeVu HR`,
        message: `You've been invited to join your organization on TradeVu HR.`,
        sendEmail: true,
        emailProps: {
          inviterName: user.email,
          roleName: role === 'HR_ADMIN' ? 'HR Manager' : 'Employee',
          inviteLink,
        }
      });

      await createAuditLog({
        prisma,
        ipAddress,
        userId: user.id,
        organizationId: user.organizationId,
        entityType: 'InviteToken',
        entityId: token,
        action: 'INVITE_USER',
        details: { email, role }
      });

      return true;
    },

    validateInviteToken: async (_, { token }, { prisma }) => {
      const invite = await prisma.inviteToken.findUnique({ where: { token } });
      if (!invite || invite.usedAt || new Date() > invite.expiresAt) {
        return {
          valid: false,
          email: null,
          role: null,
          organizationName: null
        };
      }

      const org = await prisma.organization.findUnique({
        where: { id: invite.organizationId }
      });

      return {
        valid: true,
        email: invite.email,
        role: invite.role,
        organizationName: org?.name || ''
      };
    },

    acceptInvite: async (_, { token, password, firstName, lastName }, { prisma }) => {
      const invite = await prisma.inviteToken.findUnique({ where: { token } });
      
      if (!invite) throw new Error('Invalid or expired invite token.');
      if (invite.usedAt) throw new Error('This invite has already been used.');
      if (new Date() > invite.expiresAt) throw new Error('This invite has expired.');

      const existingUser = await prisma.user.findUnique({ where: { email: invite.email } });
      if (existingUser) throw new Error('User already exists.');

      const passwordHash = await hashPassword(password);

      // Create user and mark invite as used
      return await prisma.$transaction(async (tx) => {
        // We create a barebones employee record if they are an employee.
        let employeeId = null;
        
        // Count for employeeCode
        const count = await tx.employee.count({
          where: { organizationId: invite.organizationId }
        });
        const employeeCode = `EMP-${(count + 1).toString().padStart(6, '0')}`;
        
        const emp = await tx.employee.create({
          data: {
            organizationId: invite.organizationId,
            fullName: `${firstName} ${lastName}`,
            email: invite.email,
            employeeCode,
            hireDate: new Date(),
            jobTitle: invite.role === 'HR_ADMIN' ? 'HR Manager' : 'Employee',
            employmentStatus: 'DRAFT',
          }
        });
        employeeId = emp.id;

        const user = await tx.user.create({
          data: {
            email: invite.email,
            passwordHash,
            role: invite.role,
            organizationId: invite.organizationId,
            employeeId,
            isActive: true,
            mustCompleteProfile: true
          }
        });

        await tx.inviteToken.update({
          where: { token },
          data: { usedAt: new Date() }
        });

        const authToken = generateToken(user);
        return {
          token: authToken,
          user
        };
      });
    }
  }
};
