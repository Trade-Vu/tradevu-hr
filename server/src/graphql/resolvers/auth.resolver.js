import { hashPassword, comparePassword, generateToken } from '../../utils/auth.js';

import { v2 as cloudinary } from 'cloudinary';

import { createAuditLog, recordApprovalEvent } from '../../utils/audit.js';

import { NotificationService } from '../../services/NotificationService.js';

import { client as triggerClient } from '../../jobs/trigger.js';

import { applyDynamicBenefits, calculateBenefits } from '../../utils/benefitsMatrix.js';

const checkAndPromoteEmployee = async (employeeId, prisma) => {
  const emp = await prisma.employee.findUnique({
    where: {
      id: employeeId
    },
    include: {
      department: true
    }
  });
  if (!emp || emp.employmentStatus !== 'DRAFT') return;

  // Auto-assign manager if missing
  let currentManagerId = emp.managerId;
  if (!currentManagerId) {
    if (emp.department?.headEmployeeId) {
      currentManagerId = emp.department.headEmployeeId;
    } else {
      const hrAdmin = await prisma.user.findFirst({
        where: {
          organizationId: emp.organizationId,
          role: 'HR_ADMIN',
          employeeId: {
            not: null
          }
        }
      });
      if (hrAdmin) {
        currentManagerId = hrAdmin.employeeId;
      }
    }
    if (currentManagerId) {
      await prisma.employee.update({
        where: {
          id: employeeId
        },
        data: {
          managerId: currentManagerId
        }
      });
    }
  }
  const isComplete = emp.phone && emp.privateEmail && emp.dateOfBirth && emp.gender && emp.maritalStatus && emp.nationality && emp.nationalId && emp.passportNumber && currentManagerId;
  if (isComplete) {
    const docCount = await prisma.document.count({
      where: {
        employeeId
      }
    });
    if (docCount > 0) {
      await prisma.employee.update({
        where: {
          id: employeeId
        },
        data: {
          employmentStatus: 'PENDING_APPROVAL'
        }
      });

      // Notify the manager or HR about the pending approval
      if (currentManagerId) {
        const managerUser = await prisma.user.findFirst({
          where: {
            employeeId: currentManagerId
          }
        });
        if (managerUser) {
          await NotificationService.notify({
            prisma,
            userId: managerUser.id,
            organizationId: emp.organizationId,
            title: 'Employee Approval Required',
            message: `${emp.firstName} ${emp.lastName} has completed their profile and is waiting for approval.`,
            type: 'APPROVAL',
            link: `/employees/${emp.id}`
          });
        }
      }
    }
  }
};

export const authResolvers = {
  Query: {
    me: async (_, __, {
      prisma,
      user,
      requireAuth
    }) => {
      requireAuth();
      return prisma.user.findUnique({
        where: {
          id: user.id
        },
        include: {
          employee: true
        }
      });
    }
  },
  Mutation: {
    updateUserPreferences: async (_, { preferences }, { prisma, user, requireAuth }) => {
      requireAuth();
      return prisma.user.update({
        where: { id: user.id },
        data: { preferences }
      });
    },
register: async (_, {
  input
}, {
  prisma
}) => {
  try {
    const {
      email,
      password,
      orgName
    } = input;
    
    // Auth Hardening check removed to allow multiple organizations

  const existingUser = await prisma.user.findUnique({
    where: {
      email
    }
  });
  if (existingUser) throw new Error("Email already in use");
  const passwordHash = await hashPassword(password);
  const organization = await prisma.organization.create({
    data: {
      name: orgName,
      ownerEmail: email
    }
  });

  // Auto-create HR Department
  await prisma.department.create({
    data: {
      name: 'Human Resources',
      code: 'HR',
      organizationId: organization.id
    }
  });
  const user = await prisma.user.create({
    data: {
      email,
      passwordHash,
      role: 'SUPER_ADMIN',
      organizationId: organization.id,
      isOrgOwner: true
    }
  });

  // Auto-create Employee profile for the CEO
  const employeeCode = 'EMP-000001';
  const employee = await prisma.employee.create({
    data: {
      email,
      jobTitle: 'CEO',
      fullName: 'CEO / Founder', // Will be updated during profile completion
      employeeCode,
      organizationId: organization.id,
      employmentStatus: 'DRAFT',
      onboardingStatus: 'not_started',
      employmentType: 'FULL_TIME',
      hireDate: new Date()
    }
  });

  // Link the employee to the user
  await prisma.user.update({
    where: { id: user.id },
    data: { employeeId: employee.id }
  });
  const token = generateToken(user);
    return {
      token,
      user
    };
  } catch (error) {
    console.error("Error in register:", error);
    if (error.message === "Email already in use" || error.message === "Registration is closed. Please use an invite link to join your organization.") {
      throw error;
    }
    if (error.code === 'P2002') {
      throw new Error("Email already in use");
    }
    throw new Error("Failed to register. Please try again later.");
  }
},
login: async (_, {
  email,
  password
}, {
  prisma,
  ipAddress
}) => {
  try {
  const user = await prisma.user.findUnique({
    where: {
      email
    }
  });
  if (!user) throw new Error("Invalid credentials");
  const isValid = await comparePassword(password, user.passwordHash);
  if (!isValid) throw new Error("Invalid credentials");
  const token = generateToken(user);

  await createAuditLog({
    prisma,
    ipAddress,
    userId: user.id,
    organizationId: user.organizationId,
    entityType: 'User',
    entityId: user.id,
    action: 'LOGIN'
  });

    return {
      token,
      user
    };
  } catch (error) {
    console.error("Error in login:", error);
    if (error.message === "Invalid credentials") throw error;
    throw new Error("An error occurred during login. Please try again.");
  }
},
logout: async (_, __, {
  prisma,
  user,
  requireAuth,
  ipAddress
}) => {
  requireAuth();
  await createAuditLog({
    prisma,
    ipAddress,
    userId: user.id,
    organizationId: user.organizationId,
    entityType: 'User',
    entityId: user.id,
    action: 'LOGOUT'
  });
  return true;
},
clearProfileGate: async (_, __, {
  prisma,
  user,
  requireAuth,
  ipAddress
}) => {
  requireAuth();
  return await prisma.$transaction(async (tx) => {
    const updatedUser = await tx.user.update({
      where: {
        id: user.id
      },
      data: {
        mustCompleteProfile: false,
        lastLogin: new Date()
      }
    });

    if (user.employeeId) {
      const employee = await tx.employee.findUnique({ where: { id: user.employeeId } });
      if (employee && employee.employmentStatus === 'DRAFT') {
        await tx.employee.update({
          where: { id: user.employeeId },
          data: { employmentStatus: 'PENDING_APPROVAL' }
        });

        // Audit Log
        await tx.auditLog.create({
          data: {
            actorId: user.id,
            action: 'SUBMIT_PROFILE',
            entityType: 'Employee',
            entityId: user.employeeId,
            ipAddress,
            details: { message: 'Employee submitted profile for review' }
          }
        });

        // Notify HR Admins and Super Admins
        const hrAdmins = await tx.user.findMany({
          where: { 
            organizationId: user.organizationId, 
            role: { in: ['HR_ADMIN', 'SUPER_ADMIN'] }
          }
        });
        
        const notifications = hrAdmins.map(hr => ({
          userId: hr.id,
          category: 'approval',
          title: 'New Employee Profile Review',
          message: `${employee.fullName} has completed their profile setup and is awaiting review.`,
          channel: 'IN_APP',
          deepLink: `/approvals`
        }));
        
        if (notifications.length > 0) {
          await tx.notification.createMany({ data: notifications });
        }
      }
    }

    return updatedUser;
  });
},

requestPasswordReset: async (_, { email }, { prisma }) => {
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) {
    // Return true even if user not found to prevent email enumeration
    return true; 
  }

  const { randomUUID } = await import('crypto');
  const token = randomUUID();
  const expiresAt = new Date();
  expiresAt.setHours(expiresAt.getHours() + 1); // 1 hour expiry

  await prisma.passwordResetToken.create({
    data: {
      userId: user.id,
      token,
      expiresAt
    }
  });

  const resetLink = `${process.env.FRONTEND_URL || 'https://staging.hr.tradevu.co'}/resetpassword?token=${token}`;
  
  await NotificationService.notify({
    userId: user.id,
    category: 'password_reset',
    title: 'Password Reset Request',
    message: 'We received a request to reset your password.',
    sendEmail: true,
    emailProps: {
      userName: user.employee?.fullName || '',
      resetLink
    }
  });

  return true;
},

resetPassword: async (_, { token, newPassword }, { prisma }) => {
  const resetRecord = await prisma.passwordResetToken.findUnique({
    where: { token }
  });

  if (!resetRecord) {
    throw new Error('Invalid or expired token.');
  }

  if (resetRecord.usedAt) {
    throw new Error('This token has already been used.');
  }

  if (new Date() > resetRecord.expiresAt) {
    throw new Error('This token has expired.');
  }

  const passwordHash = await hashPassword(newPassword);

  await prisma.$transaction([
    prisma.user.update({
      where: { id: resetRecord.userId },
      data: { passwordHash }
    }),
    prisma.passwordResetToken.update({
      where: { token },
      data: { usedAt: new Date() }
    })
  ]);

  return true;
}
  },
};
