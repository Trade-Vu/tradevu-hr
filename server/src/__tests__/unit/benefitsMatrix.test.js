import { describe, it, expect, vi, beforeEach } from 'vitest';
import { mockDeep } from 'vitest-mock-extended';
import { calculateBenefits, applyDynamicBenefits } from '../../utils/benefitsMatrix.js';

describe('benefitsMatrix', () => {
  let prismaMock;

  beforeEach(() => {
    prismaMock = mockDeep();
  });

  describe('calculateBenefits', () => {
    it('returns defaults when no band is found', async () => {
      prismaMock.compensationBand.findUnique.mockResolvedValue(null);
      
      const emp = { basicSalary: 5000, organizationId: 'org1' };
      const result = await calculateBenefits(emp, 'Manager', prismaMock);

      expect(result.hmoPlan).toBe('Bronze');
      expect(result.newBasicSalary).toBe(5000);
    });

    it('returns CEO defaults when no band is found and class is CEO', async () => {
      prismaMock.compensationBand.findUnique.mockResolvedValue(null);
      
      const emp = { basicSalary: 100000, organizationId: 'org1' };
      const result = await calculateBenefits(emp, 'CEO', prismaMock);

      expect(result.hmoPlan).toBe('Platinum');
      expect(result.newBasicSalary).toBe(100000);
    });

    it('uses compensation band when available', async () => {
      prismaMock.compensationBand.findUnique.mockResolvedValue({
        hmoPlan: 'Silver',
        minSalary: 4000,
        maxSalary: 8000
      });

      const emp = { basicSalary: 3000, organizationId: 'org1' };
      // Salary 3000 < 4000, should jump to minSalary
      const result = await calculateBenefits(emp, 'Junior', prismaMock);

      expect(result.hmoPlan).toBe('Silver');
      expect(result.newBasicSalary).toBe(4000);
    });
  });

  describe('applyDynamicBenefits', () => {
    it('bails early if no class or employee is provided', async () => {
      await applyDynamicBenefits('emp1', null, prismaMock);
      expect(prismaMock.employee.findUnique).not.toHaveBeenCalled();

      prismaMock.employee.findUnique.mockResolvedValue(null);
      await applyDynamicBenefits('emp1', 'Permanent', prismaMock);
      expect(prismaMock.employee.update).not.toHaveBeenCalled();
    });

    it('iterates over active leave types and calculates overrides', async () => {
      const emp = { id: 'emp1', organizationId: 'org1', basicSalary: 5000 };
      prismaMock.employee.findUnique.mockResolvedValue(emp);
      prismaMock.compensationBand.findUnique.mockResolvedValue(null);

      // Setup LeaveTypes: one with an override, one without
      const leaveTypes = [
        { id: 'lt1', daysPerYear: 10, applicableTo: { Permanent: 20 } },
        { id: 'lt2', daysPerYear: 5, applicableTo: {} }
      ];
      prismaMock.leaveType.findMany.mockResolvedValue(leaveTypes);

      // Existing balance mock for lt1
      prismaMock.leaveBalance.findUnique.mockImplementation(({ where }) => {
        if (where.employeeId_leaveTypeId_year.leaveTypeId === 'lt1') {
          return Promise.resolve({ id: 'bal1', used: 2, pending: 0 });
        }
        return Promise.resolve(null);
      });

      await applyDynamicBenefits('emp1', 'Permanent', prismaMock);

      // Expect salary update
      expect(prismaMock.employee.update).toHaveBeenCalledWith({
        where: { id: 'emp1' },
        data: { hmoPlan: 'Gold', basicSalary: 5000 }
      });

      // Expect balance update for lt1 (20 days from override)
      // used is 2, so available should be 20 - 2 = 18
      expect(prismaMock.leaveBalance.update).toHaveBeenCalledWith({
        where: { id: 'bal1' },
        data: { totalEntitled: 20, available: 18 }
      });

      // Expect balance create for lt2 (5 days default)
      expect(prismaMock.leaveBalance.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            leaveTypeId: 'lt2',
            totalEntitled: 5,
            available: 5
          })
        })
      );
    });
  });
});
