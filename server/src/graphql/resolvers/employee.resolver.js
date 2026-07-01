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

      // Notify HR Admins about the pending approval (excluding managers)
      const hrAdmins = await prisma.user.findMany({
        where: {
          organizationId: emp.organizationId,
          role: { in: ['HR_ADMIN', 'SUPER_ADMIN', 'admin'] }
        }
      });
      
      for (const admin of hrAdmins) {
        await NotificationService.notify({
          prisma,
          userId: admin.id,
          organizationId: emp.organizationId,
          title: 'Employee Approval Required',
          message: `${emp.firstName} ${emp.lastName} has completed their profile and is waiting for approval.`,
          type: 'APPROVAL',
          link: `/employees/${emp.id}`,
          sendEmail: true,
          category: 'PROFILE_COMPLETION',
          userEmail: admin.email,
          employeeName: `${emp.firstName} ${emp.lastName}`
        });
      }
    }
  }
};

export const employeeResolvers = {
  Query: {
employees: async (_, __, {
  prisma,
  user,
  requireAuth
}) => {
  requireAuth();
  const emps = await prisma.employee.findMany({
    where: {
      organizationId: user.organizationId,
      employmentStatus: {
        notIn: ['RESIGNED', 'TERMINATED', 'OFFBOARDED']
      }
    }
  });
  return emps.map(emp => ({
    ...emp,
    hireDate: emp.hireDate ? emp.hireDate.toISOString() : null
  }));
},
employee: async (_, {
  id
}, {
  prisma,
  user,
  requireAuth,
  ipAddress
}) => {
  requireAuth();
  return prisma.employee.findFirst({
    where: {
      id,
      organizationId: user.organizationId
    }
  });
}
  },
  Mutation: {
createEmployee: async (_, {
  input
}, {
  prisma,
  user,
  requireRole,
  ipAddress
}) => {
  requireRole(['SUPER_ADMIN', 'HR_ADMIN']);
  try {
    const {
      templateId,
      employmentType,
      ...employeeData
    } = input;
  const count = await prisma.employee.count({
    where: {
      organizationId: user.organizationId
    }
  });
  const employeeCode = `EMP-${(count + 1).toString().padStart(6, '0')}`;
  let managerId = null;
  if (employeeData.departmentId) {
    const dept = await prisma.department.findUnique({
      where: {
        id: employeeData.departmentId
      }
    });
    if (dept?.headEmployeeId) managerId = dept.headEmployeeId;
  }
  if (!managerId) {
    const hrAdmin = await prisma.user.findFirst({
      where: {
        organizationId: user.organizationId,
        role: 'HR_ADMIN',
        employeeId: {
          not: null
        }
      }
    });
    if (hrAdmin) managerId = hrAdmin.employeeId;
  }
  const emp = await prisma.employee.create({
    data: {
      ...employeeData,
      employmentType: employmentType ? employmentType.toUpperCase() : 'FULL_TIME',
      employeeCode,
      organizationId: user.organizationId,
      hireDate: new Date(employeeData.hireDate),
      employmentStatus: 'DRAFT',
      onboardingStatus: 'not_started',
      managerId
    }
  });

  await prisma.employeeStatusHistory.create({
    data: {
      employeeId: emp.id,
      previousStatus: 'DRAFT',
      newStatus: 'DRAFT',
      changedBy: user.id,
      reason: 'Employee created'
    }
  });
  await createAuditLog({
    prisma,
    ipAddress,
    userId: user.id, organizationId: user.organizationId,
    entityType: 'Employee',
    entityId: emp.id,
    action: 'CREATE',
    newValue: emp,
    ipAddress
  });

  let newUserId = null;
  // Auto-generate User account for the new employee
  try {
    const { randomBytes } = await import('crypto');
    const secureRandomPassword = randomBytes(32).toString('hex');
    const passwordHash = await hashPassword(secureRandomPassword);
    
    const newUser = await prisma.user.create({
      data: {
        email: employeeData.email,
        passwordHash,
        role: 'EMPLOYEE',
        organizationId: user.organizationId,
        employeeId: emp.id,
        isActive: true,
        mustCompleteProfile: true
      }
    });
    newUserId = newUser.id;
  } catch (err) {
    console.error("Failed to automatically create user for employee:", err);
    // Continue even if user creation fails (e.g. duplicate email)
  }

  // Generate Onboarding Tasks based on templateId
  if (templateId) {
    const defaultTasks = [
      { title: 'Submit Required Documents', category: 'documentation', description: 'Upload ID, Passport, and educational certificates.' },
      { title: 'Sign Employment Contract', category: 'documentation', description: 'Review and sign your official contract.' },
    ];
    
    if (templateId === 'developer') {
      defaultTasks.push({ title: 'Setup Development Environment', category: 'it_setup', description: 'Request access to GitHub and setup local environment.' });
    } else if (templateId === 'sales') {
      defaultTasks.push({ title: 'CRM Access Setup', category: 'it_setup', description: 'Get provisioned for Salesforce/Hubspot.' });
    } else {
      defaultTasks.push({ title: 'IT Equipment Setup', category: 'it_setup', description: 'Receive laptop and setup basic accounts.' });
    }

    for (const task of defaultTasks) {
      await prisma.onboardingTask.create({
        data: {
          employeeId: emp.id,
          title: task.title,
          description: task.description,
          category: task.category,
          status: 'todo',
          isCompleted: false,
        }
      });
    }
  }

  // Apply initial benefits and leave balances based on grade
  if (emp.employeeClass) {
    await applyDynamicBenefits(emp.id, emp.employeeClass, prisma);
  } else {
    // If no grade provided, apply a default base grade to generate the initial annual leave balance
    await applyDynamicBenefits(emp.id, 'Entry Level', prisma);
  }

    // Send welcome email with activation link to the new employee
    if (newUserId) {
      const { randomUUID } = await import('crypto');
      const token = randomUUID();
      const expiresAt = new Date();
      expiresAt.setHours(expiresAt.getHours() + 48); // 48 hours for initial activation

      await prisma.passwordResetToken.create({
        data: {
          userId: newUserId,
          token,
          expiresAt
        }
      });

      const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
      await NotificationService.notify({
        targetEmail: employeeData.email,
        category: 'employee_created',
        title: 'Welcome to TradeVu HR!',
        message: 'Your employee profile has been drafted. Please set your password to complete your setup.',
        sendEmail: true,
        emailProps: {
          fullName: emp.fullName,
          loginLink: `${frontendUrl}/resetpassword?token=${token}`,
          buttonText: 'Set Your Password'
        }
      });
    }

    return emp;
  } catch (error) {
    console.error("Error in createEmployee:", error);
    if (error.code === 'P2002') {
      throw new Error(`An employee with this ${error.meta?.target?.join(', ')} already exists.`);
    }
    throw new Error("Failed to create employee. Please try again.");
  }
},
bulkImportEmployees: async (_, { employees }, { prisma, user, requireRole, ipAddress }) => {
  requireRole(['SUPER_ADMIN', 'HR_ADMIN']);
  
  try {
    // Pre-check: find which emails already exist in this org
    const incomingEmails = employees.map(e => e.email.toLowerCase().trim());
    const existingEmployees = await prisma.employee.findMany({
      where: {
        organizationId: user.organizationId,
        email: { in: incomingEmails }
      },
      select: { email: true }
    });
    const existingEmailSet = new Set(existingEmployees.map(e => e.email.toLowerCase().trim()));

    const toImport = employees.filter(e => !existingEmailSet.has(e.email.toLowerCase().trim()));
    const skippedCount = employees.length - toImport.length;

    if (skippedCount > 0) {
      console.log(`[BulkImport] Skipping ${skippedCount} duplicate employee(s), importing ${toImport.length} new.`);
    }

    // Find the true numeric max of all existing codes (not lexicographic sort)
    const allCodes = await prisma.employee.findMany({
      where: { organizationId: user.organizationId },
      select: { employeeCode: true }
    });
    let currentCount = allCodes.reduce((max, emp) => {
      const match = emp.employeeCode?.match(/(\d+)$/);
      return match ? Math.max(max, parseInt(match[1], 10)) : max;
    }, 0);

    const importedEmployees = [];
    for (const empData of toImport) {
      // Retry loop in case another concurrent request grabbed the same code
      let newEmployee = null;
      let attempts = 0;
      while (!newEmployee && attempts < 20) {
        currentCount++;
        attempts++;
        const employeeCode = `EMP-${currentCount.toString().padStart(6, '0')}`;
        try {
          newEmployee = await prisma.employee.create({
            data: {
              organizationId: user.organizationId,
              employeeCode,
              fullName: empData.fullName,
              email: empData.email,
              jobTitle: empData.jobTitle,
              departmentId: empData.departmentId || null,
              employmentType: empData.employmentType ? empData.employmentType.toUpperCase() : 'FULL_TIME',
              hireDate: empData.hireDate ? new Date(empData.hireDate) : new Date(),
              basicSalary: empData.basicSalary || 0,
              employmentStatus: 'ACTIVE',
              onboardingStatus: 'completed'
            }
          });
        } catch (createErr) {
          // Any P2002 inside this loop must be an employeeCode collision
          // (email duplicates were already filtered out above)
          if (createErr.code === 'P2002') {
            console.warn(`[BulkImport] Code ${employeeCode} taken, retrying with next number...`);
            newEmployee = null; // ensure we loop again
            continue;
          }
          throw createErr; // Re-throw non-P2002 errors
        }
      }

      if (!newEmployee) throw new Error('Could not assign a unique employee code after 20 attempts.');

      await createAuditLog({
        prisma,
        ipAddress,
        userId: user.id,
        organizationId: user.organizationId,
        entityType: 'Employee',
        entityId: newEmployee.id,
        action: 'BULK_IMPORT',
        newValue: newEmployee
      });

      // Handle status history if provided
      if (empData.statusHistory) {
        const statuses = empData.statusHistory.split(',').map(s => s.trim()).filter(s => s);
        for (const statusEntry of statuses) {
          const [statusStr, dateStr] = statusEntry.split(':').map(s => s.trim());
          if (statusStr && dateStr) {
            await prisma.employeeStatusHistory.create({
              data: {
                employeeId: newEmployee.id,
                previousStatus: 'DRAFT', // Default fallback
                newStatus: statusStr,
                changedBy: user.id,
                reason: 'Imported from status history',
                createdAt: new Date(dateStr)
              }
            });
          }
        }
      }

      // Create User account and Reset Token
      const { randomBytes, randomUUID } = await import('crypto');
      const { hashPassword } = await import('../../utils/auth.js');
      const secureRandomPassword = randomBytes(32).toString('hex');
      const passwordHash = await hashPassword(secureRandomPassword);
      
      const newUser = await prisma.user.create({
        data: {
          email: empData.email,
          passwordHash,
          role: 'EMPLOYEE',
          organizationId: user.organizationId,
          employeeId: newEmployee.id,
          isActive: true,
          mustCompleteProfile: true
        }
      });

      const token = randomUUID();
      const expiresAt = new Date();
      expiresAt.setHours(expiresAt.getHours() + 168); // 7 days for bulk import

      await prisma.passwordResetToken.create({
        data: {
          userId: newUser.id,
          token,
          expiresAt
        }
      });

      importedEmployees.push(newEmployee);
      
      // Fire-and-forget welcome email — do NOT await so the loop isn't blocked
      import('../../services/NotificationService.js').then(({ NotificationService }) => {
        const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
        NotificationService.notify({
          targetEmail: empData.email,
          category: 'employee_created',
          title: `Welcome to TradeVu HR, ${empData.fullName}!`,
          message: `Your account has been created. Please set your password to complete your setup.`,
          sendEmail: true,
          emailProps: {
            fullName: empData.fullName,
            loginLink: `${frontendUrl}/resetpassword?token=${token}`,
            buttonText: 'Set Your Password'
          }
        });
      }).catch(err => {
        console.error("Failed to send welcome email during bulk import:", err);
      });
        console.error("Failed to send welcome email during bulk import:", err);
      });
    }

    return importedEmployees;
  } catch (error) {
    console.error("Error in bulkImportEmployees - code:", error.code, "meta:", JSON.stringify(error.meta), "message:", error.message);
    if (error.code === 'P2002') {
      const field = error.meta?.target?.join(', ') || 'email';
      throw new Error(`Duplicate entry: an employee with this ${field} already exists.`);
    }
    if (error.code === 'P2003') {
      throw new Error(`Invalid reference: ${error.meta?.field_name || 'a field'} references a record that does not exist.`);
    }
    throw new Error(`Bulk import failed: ${error.message}`);
  }
},

updateEmployee: async (_, {
  id,
  input,
  auditAction,
  auditContext
}, {
  prisma,
  user,
  requireRole,
  ipAddress
}) => {
  requireRole(['SUPER_ADMIN', 'HR_ADMIN', 'MANAGER']);
  try {
    const existing = await prisma.employee.findFirst({
    where: {
      id,
      organizationId: user.organizationId
    }
  });
  if (!existing) throw new Error("Employee not found");
  const updateData = {
    ...input
  };
  const isHeadOfDepartment = updateData.isHeadOfDepartment;
  delete updateData.isHeadOfDepartment;
  if (input.dateOfBirth) {
    const dNum = Number(input.dateOfBirth);
    updateData.dateOfBirth = isNaN(dNum) ? new Date(input.dateOfBirth) : new Date(dNum);
  }
  if (input.hireDate) {
    const hNum = Number(input.hireDate);
    updateData.hireDate = isNaN(hNum) ? new Date(input.hireDate) : new Date(hNum);
  }
  if (input.probationStartDate) {
    const psNum = Number(input.probationStartDate);
    updateData.probationStartDate = isNaN(psNum) ? new Date(input.probationStartDate) : new Date(psNum);
  }
  if (input.probationEndDate) {
    const peNum = Number(input.probationEndDate);
    updateData.probationEndDate = isNaN(peNum) ? new Date(input.probationEndDate) : new Date(peNum);
  }
  if (input.employmentType) updateData.employmentType = input.employmentType.toUpperCase();
  if (input.employmentStatus) {
    let status = input.employmentStatus.toUpperCase();
    if (status === 'ON_LEAVE') status = 'ACTIVE'; // Fallback since ON_LEAVE is not in enum
    updateData.employmentStatus = status;
  }

  // Auto-calculate probationEndDate if missing
  if (updateData.employmentStatus === 'PROBATION' && !updateData.probationEndDate) {
    const startDate = updateData.probationStartDate || existing.probationStartDate || updateData.hireDate || existing.hireDate;
    if (startDate) {
      const endDate = new Date(startDate);
      endDate.setMonth(endDate.getMonth() + 3);
      updateData.probationEndDate = endDate;
    }
  }
  if (input.departmentId !== undefined && input.departmentId !== existing.departmentId && input.managerId === undefined) {
    let managerId = null;
    if (input.departmentId) {
      const dept = await prisma.department.findUnique({
        where: {
          id: input.departmentId
        }
      });
      if (dept?.headEmployeeId) managerId = dept.headEmployeeId;
    }
    if (!managerId) {
      const hrAdmin = await prisma.user.findFirst({
        where: {
          organizationId: user.organizationId,
          role: 'HR_ADMIN',
          employeeId: {
            not: null
          }
        }
      });
      if (hrAdmin) managerId = hrAdmin.employeeId;
    }
    updateData.managerId = managerId;
  }

  // Auto-promotion is now handled after the update by checkAndPromoteEmployee

  const updated = await prisma.employee.update({
    where: {
      id
    },
    data: updateData
  });

  if (updateData.employmentStatus && updateData.employmentStatus !== existing.employmentStatus) {
    await prisma.employeeStatusHistory.create({
      data: {
        employeeId: id,
        previousStatus: existing.employmentStatus,
        newStatus: updateData.employmentStatus,
        changedBy: user.id,
        reason: 'Status updated via edit'
      }
    });
  }

  // Update department head if requested
  if (isHeadOfDepartment) {
    const targetDeptId = updateData.departmentId || existing.departmentId;
    if (targetDeptId) {
      await prisma.department.update({
        where: {
          id: targetDeptId
        },
        data: {
          headEmployeeId: id
        }
      });
      // Also upgrade user role to MANAGER if needed
      await prisma.user.updateMany({
        where: {
          employeeId: id,
          role: 'EMPLOYEE'
        },
        data: {
          role: 'MANAGER'
        }
      });

      // Re-assign all other employees in the department to report to this new manager
      await prisma.employee.updateMany({
        where: {
          departmentId: targetDeptId,
          id: {
            not: id
          }
        },
        data: {
          managerId: id
        }
      });

      // Ensure the new department head reports to HR
      const hrAdmin = await prisma.user.findFirst({
        where: {
          organizationId: user.organizationId,
          role: 'HR_ADMIN',
          employeeId: {
            not: null
          }
        }
      });
      if (hrAdmin) {
        await prisma.employee.update({
          where: {
            id
          },
          data: {
            managerId: hrAdmin.employeeId
          }
        });
      }
    }
  }
  const actionString = auditAction || 'UPDATE';
  const actionWithContext = auditContext ? `${actionString} - ${auditContext}` : actionString;
  await createAuditLog({
    prisma,
    ipAddress,
    userId: user.id, organizationId: user.organizationId,
    entityType: 'Employee',
    entityId: id,
    action: actionWithContext,
    previousValue: existing,
    newValue: updated
  });
  if (auditAction === 'PROMOTE') {
    const usr = await prisma.user.findUnique({
      where: {
        employeeId: id
      }
    });
    if (usr) {
      await NotificationService.notify({
        userId: usr.id,
        category: 'promotion',
        title: 'Congratulations on your promotion! 🎉',
        message: `Your employment profile has been updated with a new promotion: ${auditContext}`,
        emailProps: {
          newTitle: updateData.jobTitle || existing.jobTitle,
          newClass: updateData.employeeClass || existing.employeeClass,
          effectiveDate: new Date().toLocaleDateString()
        },
        deepLink: '/EmployeeSelfService',
        sendEmail: true
      });
    }

    // Dynamically recalculate and apply benefits
    if (updateData.employeeClass || existing.employeeClass) {
      await applyDynamicBenefits(id, updateData.employeeClass || existing.employeeClass, prisma);
    }
  }
    await checkAndPromoteEmployee(id, prisma);
    return updated;
  } catch (error) {
    console.error("Error in updateEmployee:", error);
    if (error.code === 'P2002') {
      throw new Error(`An employee with this ${error.meta?.target?.join(', ')} already exists.`);
    }
    throw new Error(error.message || "Failed to update employee. Please try again.");
  }
}
  },
Employee: {
  department: async (parent, _, {
    prisma
  }) => {
    if (!parent.departmentId) return null;
    return prisma.department.findUnique({
      where: {
        id: parent.departmentId
      }
    });
  },
  manager: async (parent, _, {
    prisma
  }) => {
    if (!parent.managerId) return null;
    return prisma.employee.findUnique({
      where: {
        id: parent.managerId
      }
    });
  },
  basicSalary: (parent, _, {
    user
  }) => {
    return user.role === 'SUPER_ADMIN' || user.role === 'HR_ADMIN' || user.employeeId === parent.id ? parent.basicSalary : null;
  },
  allowances: (parent, _, {
    user
  }) => {
    return user.role === 'SUPER_ADMIN' || user.role === 'HR_ADMIN' || user.employeeId === parent.id ? parent.allowances : null;
  },
  bankName: (parent, _, {
    user
  }) => {
    return user.role === 'SUPER_ADMIN' || user.role === 'HR_ADMIN' || user.employeeId === parent.id ? parent.bankName : null;
  },
  bankAccountNumber: (parent, _, {
    user
  }) => {
    return user.role === 'SUPER_ADMIN' || user.role === 'HR_ADMIN' || user.employeeId === parent.id ? parent.bankAccountNumber : null;
  },
  pensionId: (parent, _, {
    user
  }) => {
    return user.role === 'SUPER_ADMIN' || user.role === 'HR_ADMIN' || user.employeeId === parent.id ? parent.pensionId : null;
  },
  nationalId: (parent, _, {
    user
  }) => {
    return user.role === 'SUPER_ADMIN' || user.role === 'HR_ADMIN' || user.employeeId === parent.id ? parent.nationalId : null;
  },
  passportNumber: (parent, _, {
    user
  }) => {
    return user.role === 'SUPER_ADMIN' || user.role === 'HR_ADMIN' || user.employeeId === parent.id ? parent.passportNumber : null;
  },
  promotionHistory: async (parent, _, {
    prisma
  }) => {
    return prisma.promotionHistory.findMany({
      where: {
        employeeId: parent.id
      },
      orderBy: {
        createdAt: 'desc'
      }
    });
  },
  statusHistory: async (parent, _, {
    prisma
  }) => {
    return prisma.employeeStatusHistory.findMany({
      where: {
        employeeId: parent.id
      },
      orderBy: {
        createdAt: 'desc'
      }
    });
  },
  onboardingTasks: async (parent, _, { prisma }) => {
    return prisma.onboardingTask.findMany({
      where: { employeeId: parent.id }
    });
  }
}
};
