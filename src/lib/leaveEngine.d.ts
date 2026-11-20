export type RoundingPolicy =
  | 'ROUND_UP_WHOLE_DAY'
  | 'NEAREST_WHOLE_DAY'
  | 'NEAREST_HALF_DAY'
  | 'ROUND_UP_HALF_DAY'
  | 'ROUND_DOWN_HALF_DAY'
  | 'TWO_DECIMAL_PLACES'
  | 'NO_ROUNDING';

export interface LeaveEngineConfig {
  MID_MONTH_CUTOFF_DAY: number;
  DEFAULT_ROUNDING: RoundingPolicy;
  IS_ACCRUAL_ENABLED: boolean;
  MONTHS_IN_YEAR: number;
}

export interface EmployeeLeaveInput {
  id?: string;
  confirmationDate?: Date | string | null;
  probationEndDate?: Date | string | null;
  confirmedAt?: Date | string | null;
  employmentStatus?: string;
  isAccrualEnabled?: boolean;
  leaveTaken?: number;
  used?: number;
  pending?: number;
  [key: string]: any;
}

export interface LeavePolicyInput {
  id?: string;
  name?: string;
  contractAnnualLeaveDays: number;
  daysPerYear?: number;
  isAccrualEnabled?: boolean;
  roundingPolicy?: RoundingPolicy;
  midMonthCutoffDay?: number;
  allowNegativeBalance?: boolean;
  [key: string]: any;
}

export interface LeaveCalculationOptions {
  year?: number;
  [key: string]: any;
}

export interface LeaveBalanceCalculationBreakdown {
  prorationFormula: string;
  accrualFormula?: string;
  confirmedMonthsInYear: number;
  elapsedMonthsInYear: number;
  monthlyAccrualRate: number;
  rawEntitledDays: number;
  rawEarnedLeave: number;
  roundingPolicy: RoundingPolicy;
  midMonthCutoffDay: number;
}

export interface LeaveBalanceCalculationResult {
  leaveYear: number;
  referenceDate: Date;
  isConfirmed: boolean;
  isPreConfirmation: boolean;
  isConfirmationYear: boolean;
  isPostConfirmationYear: boolean;
  confirmedMonthsInYear: number;
  elapsedMonthsInYear: number;
  contractAnnualLeaveDays: number;
  entitledDays: number;
  monthlyAccrualRate: number;
  earnedLeave: number;
  leaveTaken: number;
  pendingDays: number;
  isAccrualEnabled: boolean;
  grossAvailable: number;
  available: number;
  breakdown: LeaveBalanceCalculationBreakdown;
}

export declare const ROUNDING_POLICY: {
  readonly NEAREST_HALF_DAY: 'NEAREST_HALF_DAY';
  readonly ROUND_UP_HALF_DAY: 'ROUND_UP_HALF_DAY';
  readonly ROUND_DOWN_HALF_DAY: 'ROUND_DOWN_HALF_DAY';
  readonly TWO_DECIMAL_PLACES: 'TWO_DECIMAL_PLACES';
  readonly NEAREST_WHOLE_DAY: 'NEAREST_WHOLE_DAY';
  readonly NO_ROUNDING: 'NO_ROUNDING';
};

export declare const DEFAULT_LEAVE_CONFIG: LeaveEngineConfig;

export declare function parseDate(dateInput: Date | string | number | null | undefined): Date | null;

export declare function roundLeaveDays(value: number, policy?: RoundingPolicy): number;

export declare function getConfirmedMonthsInYear(
  confirmationDate: Date | string | null | undefined,
  leaveYear: number,
  cutoffDay?: number
): number;

export declare function getElapsedMonthsPostConfirmation(
  confirmationDate: Date | string | null | undefined,
  referenceDate: Date | string,
  leaveYear: number,
  confirmedMonthsInYear: number,
  cutoffDay?: number
): number;

export declare function calculateLeaveBalance(
  employee?: EmployeeLeaveInput,
  policy?: LeavePolicyInput,
  referenceDate?: Date | string,
  options?: LeaveCalculationOptions
): LeaveBalanceCalculationResult;
