// server/src/utils/benefitsMatrix.js

export const calculateBenefits = async (emp, newClass, prisma) => {
  const organizationId = emp.organizationId;
  const band = await prisma.compensationBand.findUnique({
    where: { organizationId_grade: { organizationId, grade: newClass } }
  });

  let hmoPlan = "Bronze";
  let newBasicSalary = emp.basicSalary || 0;
  
  if (band) {
    hmoPlan = band.hmoPlan;
    if (!emp.basicSalary || emp.basicSalary < band.minSalary) newBasicSalary = band.minSalary;
    else if (emp.basicSalary > band.maxSalary) newBasicSalary = band.maxSalary;
    else newBasicSalary = emp.basicSalary;
  } else {
    // Basic defaults if no band is found for the class
    if (newClass === 'CEO' || newClass === 'Management') { hmoPlan = 'Platinum'; }
    else if (newClass === 'Senior Level' || newClass === 'Permanent') { hmoPlan = 'Gold'; }
    else { hmoPlan = 'Bronze'; }
  }
  return { hmoPlan, newBasicSalary };
};

export const applyDynamicBenefits = async (employeeId, newClass, prisma) => {
  if (!newClass) return;
  const emp = await prisma.employee.findUnique({ where: { id: employeeId } });
  if (!emp) return;

  const { hmoPlan, newBasicSalary } = await calculateBenefits(emp, newClass, prisma);

  const organizationId = emp.organizationId;

  // 1. Update the Employee's salary and HMO
  await prisma.employee.update({
    where: { id: employeeId },
    data: {
      hmoPlan,
      basicSalary: newBasicSalary
    }
  });

  // 2. Fetch all Leave Types for the organization
  const allLeaveTypes = await prisma.leaveType.findMany({
    where: {
      organizationId,
      isActive: true
    }
  });

  const currentYear = new Date().getFullYear();

  // 3. Upsert LeaveBalance for each leave type based on class overrides
  for (const leaveType of allLeaveTypes) {
    let entitledDays = leaveType.daysPerYear;
    
    // Check if there are class-specific overrides in applicableTo
    if (leaveType.applicableTo && typeof leaveType.applicableTo === 'object') {
      const overrides = leaveType.applicableTo;
      if (overrides[newClass] !== undefined && overrides[newClass] !== null) {
        entitledDays = Number(overrides[newClass]);
      }
    }

    const existingBalance = await prisma.leaveBalance.findUnique({
      where: {
        employeeId_leaveTypeId_year: {
          employeeId,
          leaveTypeId: leaveType.id,
          year: currentYear
        }
      }
    });

    if (existingBalance) {
      // Recalculate available based on new entitled minus used/pending
      const usedAndPending = existingBalance.used + existingBalance.pending;
      const newAvailable = entitledDays - usedAndPending;
      
      await prisma.leaveBalance.update({
        where: { id: existingBalance.id },
        data: {
          totalEntitled: entitledDays,
          available: newAvailable >= 0 ? newAvailable : 0
        }
      });
    } else {
      await prisma.leaveBalance.create({
        data: {
          employeeId,
          leaveTypeId: leaveType.id,
          year: currentYear,
          totalEntitled: entitledDays,
          available: entitledDays,
          used: 0,
          pending: 0
        }
      });
    }
  }
};

