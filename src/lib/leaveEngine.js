/**
 * @file leaveEngine.js
 * @description Leave Entitlement and Accrual Calculation Engine.
 *
 * Implements confirmation-year proration, earned-leave monthly accrual,
 * manual override toggling, mid-month confirmation cutoff rules,
 * configurable rounding policies, and safe division-by-zero guards.
 *
 * Designed as a pure, stateless service decoupled from databases or HTTP layers.
 */

/**
 * Supported rounding policies for leave calculations.
 * @readonly
 * @enum {string}
 */
export const ROUNDING_POLICY = Object.freeze({
  /** Round up to the next whole day (e.g. 1.2 -> 2, 11.33 -> 12, 13.67 -> 14). Standard in Nigerian HR. */
  ROUND_UP_WHOLE_DAY: 'ROUND_UP_WHOLE_DAY',
  /** Round to nearest integer (whole day, e.g. 11.33 -> 11, 11.67 -> 12) */
  NEAREST_WHOLE_DAY: 'NEAREST_WHOLE_DAY',
  /** Round to nearest 0.5 day (e.g. 1.24 -> 1.0, 1.25 -> 1.5, 1.74 -> 1.5, 1.75 -> 2.0) */
  NEAREST_HALF_DAY: 'NEAREST_HALF_DAY',
  /** Round up to the next 0.5 day (e.g. 1.1 -> 1.5, 1.51 -> 2.0) */
  ROUND_UP_HALF_DAY: 'ROUND_UP_HALF_DAY',
  /** Round down to the lower 0.5 day (e.g. 1.49 -> 1.0, 1.99 -> 1.5) */
  ROUND_DOWN_HALF_DAY: 'ROUND_DOWN_HALF_DAY',
  /** Round to standard 2 decimal places (e.g. 1.6666... -> 1.67) */
  TWO_DECIMAL_PLACES: 'TWO_DECIMAL_PLACES',
  /** Do not round (raw IEEE 754 float) */
  NO_ROUNDING: 'NO_ROUNDING'
});

/**
 * Default configurations for leave calculations.
 */
export const DEFAULT_LEAVE_CONFIG = Object.freeze({
  /** Mid-month cutoff day. Confirmations on or before this day include the month (default: 15). */
  MID_MONTH_CUTOFF_DAY: 15,
  /** Default rounding policy applied to calculated days. Defaults to ROUND_UP_WHOLE_DAY. */
  DEFAULT_ROUNDING: ROUNDING_POLICY.ROUND_UP_WHOLE_DAY,
  /** Whether monthly accrual is enabled by default. */
  IS_ACCRUAL_ENABLED: true,
  /** Months in a standard calendar year. */
  MONTHS_IN_YEAR: 12
});

/**
 * Safely parses an input value into a valid Date object.
 *
 * @param {Date|string|number|null|undefined} dateInput
 * @returns {Date|null} Valid Date or null if missing/invalid
 */
export function parseDate(dateInput) {
  if (!dateInput) return null;
  if (dateInput instanceof Date) {
    return isNaN(dateInput.getTime()) ? null : dateInput;
  }
  const parsed = new Date(dateInput);
  return isNaN(parsed.getTime()) ? null : parsed;
}

/**
 * Rounds a numeric leave day value according to the specified policy.
 *
 * @param {number} value - The raw number of days
 * @param {string} [policy=ROUNDING_POLICY.TWO_DECIMAL_PLACES] - Rounding policy key
 * @returns {number} The rounded number of days
 */
export function roundLeaveDays(value, policy = DEFAULT_LEAVE_CONFIG.DEFAULT_ROUNDING) {
  if (typeof value !== 'number' || isNaN(value)) return 0;
  if (!isFinite(value)) return 0;

  switch (policy) {
    case ROUNDING_POLICY.ROUND_UP_WHOLE_DAY:
      return Math.ceil(value);

    case ROUNDING_POLICY.NEAREST_WHOLE_DAY:
      return Math.round(value);

    case ROUNDING_POLICY.NEAREST_HALF_DAY:
      // Round to nearest 0.5: multiply by 2, round to int, divide by 2
      return Math.round(value * 2) / 2;

    case ROUNDING_POLICY.ROUND_UP_HALF_DAY:
      // Ceil to next 0.5
      return Math.ceil(value * 2) / 2;

    case ROUNDING_POLICY.ROUND_DOWN_HALF_DAY:
      // Floor to previous 0.5
      return Math.floor(value * 2) / 2;

    case ROUNDING_POLICY.TWO_DECIMAL_PLACES:
      // Round to 2 decimal places to avoid floating point precision artifacts (e.g. 1.6666667)
      return Math.round((value + Number.EPSILON) * 100) / 100;

    case ROUNDING_POLICY.NO_ROUNDING:
    default:
      return value;
  }
}

/**
 * Mid-Month Confirmation & Confirmed Months Logic:
 *
 * Assumption and Policy:
 * 1. An employee confirmed on or before the cutoff day (day <= cutoffDay, default 15th)
 *    is credited with the entire confirmation month because they were confirmed for
 *    the majority / mid-point of that calendar month.
 *    -> Start month = confirmation month M.
 *    -> Confirmed Months in Year = 12 - M + 1.
 * 2. An employee confirmed after the cutoff day (day > cutoffDay, e.g. 16th to 31st)
 *    does NOT count the confirmation month. Their entitlement begins on the 1st of
 *    the following month.
 *    -> Start month = confirmation month M + 1.
 *    -> Confirmed Months in Year = 12 - (M + 1) + 1 = 12 - M.
 *    -> Note: If confirmed after December 15th, Confirmed Months in Year = 0.
 *
 * @param {Date} confirmationDate - The employee's confirmation date
 * @param {number} leaveYear - The calendar year being calculated (e.g. 2026)
 * @param {number} [cutoffDay=15] - Mid-month cutoff day
 * @returns {number} Confirmed months in the given year (integer between 0 and 12)
 */
export function getConfirmedMonthsInYear(
  confirmationDate,
  leaveYear,
  cutoffDay = DEFAULT_LEAVE_CONFIG.MID_MONTH_CUTOFF_DAY
) {
  const date = parseDate(confirmationDate);
  if (!date) return 0;

  const confYear = date.getFullYear();

  // Case 1: Confirmed in a future year -> 0 confirmed months in this leave year
  if (confYear > leaveYear) {
    return 0;
  }

  // Case 2: Confirmed in a prior year -> Full 12 confirmed months in this leave year
  if (confYear < leaveYear) {
    return DEFAULT_LEAVE_CONFIG.MONTHS_IN_YEAR; // 12
  }

  // Case 3: Confirmed within the current leave year (Confirmation Year)
  const confMonth = date.getMonth() + 1; // 1-indexed (1 = Jan, 12 = Dec)
  const confDay = date.getDate();

  const startMonth = confDay <= cutoffDay ? confMonth : confMonth + 1;

  if (startMonth > DEFAULT_LEAVE_CONFIG.MONTHS_IN_YEAR) {
    // E.g. Confirmed after Dec 15th
    return 0;
  }

  const confirmedMonths = DEFAULT_LEAVE_CONFIG.MONTHS_IN_YEAR - startMonth + 1;
  return Math.max(0, Math.min(DEFAULT_LEAVE_CONFIG.MONTHS_IN_YEAR, confirmedMonths));
}

/**
 * Calculates the number of active elapsed months post-confirmation in the current leave year
 * as of a given reference date.
 *
 * Rules:
 * - Pre-confirmation date: 0 elapsed months.
 * - Reference month counts as accrued if referenceDate.getDate() >= cutoffDay.
 * - Elapsed months is clamped so it never exceeds `confirmedMonthsInYear`
 *   and never drops below 0.
 *
 * @param {Date} confirmationDate - The employee's confirmation date
 * @param {Date} referenceDate - The reference date (e.g. today or balance as-of date)
 * @param {number} leaveYear - The calendar year being evaluated
 * @param {number} confirmedMonthsInYear - Confirmed months available in this year
 * @param {number} [cutoffDay=15] - Mid-month cutoff day
 * @returns {number} Clamped elapsed months (between 0 and confirmedMonthsInYear)
 */
export function getElapsedMonthsPostConfirmation(
  confirmationDate,
  referenceDate,
  leaveYear,
  confirmedMonthsInYear,
  cutoffDay = DEFAULT_LEAVE_CONFIG.MID_MONTH_CUTOFF_DAY
) {
  // Guard: If there are no confirmed months in this year, elapsed is strictly 0
  if (confirmedMonthsInYear <= 0) return 0;

  const confDate = parseDate(confirmationDate);
  const refDate = parseDate(referenceDate);
  if (!confDate || !refDate) return 0;

  const refYear = refDate.getFullYear();

  // If reference date is in a year prior to the leave year
  if (refYear < leaveYear) return 0;

  // If reference date is in a future year, the entire leave year has elapsed
  if (refYear > leaveYear) return confirmedMonthsInYear;

  // If as of referenceDate, the employee has not reached their confirmation date yet
  if (refDate < confDate) return 0;

  const confYear = confDate.getFullYear();

  // Determine the first month in the leave year where confirmation is active
  let startMonthInYear;
  if (confYear < leaveYear) {
    // Confirmed in a previous year: active from Jan 1
    startMonthInYear = 1;
  } else {
    // Confirmed in this year: respects the cutoff day
    const confMonth = confDate.getMonth() + 1;
    const confDay = confDate.getDate();
    startMonthInYear = confDay <= cutoffDay ? confMonth : confMonth + 1;
  }

  // If start month is past December (e.g. confirmed late December)
  if (startMonthInYear > DEFAULT_LEAVE_CONFIG.MONTHS_IN_YEAR) {
    return 0;
  }

  const refMonth = refDate.getMonth() + 1;
  const refDay = refDate.getDate();

  // Reference month is considered elapsed/accrued if the reference day has reached the cutoff
  const effectiveRefMonth = refDay >= cutoffDay ? refMonth : refMonth - 1;

  if (effectiveRefMonth < startMonthInYear) {
    return 0;
  }

  const rawElapsed = effectiveRefMonth - startMonthInYear + 1;

  // Guard: Ensure Elapsed Months only counts active confirmed months within the current
  // leave year so earned leave NEVER exceeds Entitled Days.
  return Math.max(0, Math.min(confirmedMonthsInYear, rawElapsed));
}

/**
 * Calculates leave entitlement and accrued balance for an employee.
 *
 * Core Business Rules:
 * 1. Confirmation-Year Proration:
 *    - Pre-confirmation: Entitlement = 0.
 *    - Confirmation year: Prorated Entitlement = (Confirmed Months / 12) * Contract Days.
 *    - Post-confirmation years: 100% of Contract Days (Confirmed Months = 12).
 *
 * 2. Earned Leave (Accrual) Rule:
 *    - Earned Leave = (Entitled Days / Confirmed Months) * Elapsed Months.
 *    - When Confirmed Months === 0, Earned Leave = 0 (guard against division-by-zero).
 *
 * 3. Manual Override Toggle (isAccrualEnabled):
 *    - true:  Available = Earned Leave - Leave Taken - Pending.
 *    - false: Available = Entitled Days - Leave Taken - Pending.
 *
 * @param {Object} employee - Employee data
 * @param {Date|string|null} [employee.confirmationDate] - Confirmation date
 * @param {Date|string|null} [employee.probationEndDate] - Fallback confirmation date
 * @param {string} [employee.employmentStatus] - Employment status ('ACTIVE', 'PROBATION', etc.)
 * @param {boolean} [employee.isAccrualEnabled] - Optional employee-level accrual override
 * @param {number} [employee.leaveTaken=0] - Approved leave days already taken
 * @param {number} [employee.used=0] - Alternative key for leave taken
 * @param {number} [employee.pending=0] - Days currently pending approval
 *
 * @param {Object} policy - Leave policy configuration
 * @param {number} policy.contractAnnualLeaveDays - Full year contract entitlement (e.g. 20)
 * @param {number} [policy.daysPerYear] - Alternative key for contract annual leave days
 * @param {boolean} [policy.isAccrualEnabled=true] - Policy-level accrual toggle
 * @param {string} [policy.roundingPolicy=ROUNDING_POLICY.TWO_DECIMAL_PLACES] - Rounding policy
 * @param {number} [policy.midMonthCutoffDay=15] - Mid-month cutoff day (default: 15)
 * @param {boolean} [policy.allowNegativeBalance=false] - Whether available can drop below 0
 *
 * @param {Date|string} [referenceDate=new Date()] - As-of evaluation date
 * @param {Object} [options={}] - Additional runtime options
 * @param {number} [options.year] - Explicit leave year override (defaults to referenceDate year)
 *
 * @returns {Object} Comprehensive calculation result
 */
export function calculateLeaveBalance(
  employee = {},
  policy = {},
  referenceDate = new Date(),
  options = {}
) {
  const refDate = parseDate(referenceDate) || new Date();
  const leaveYear = options.year || refDate.getFullYear();

  // 1. Resolve Contract Annual Leave Days
  const rawContractDays = Number(
    policy.contractAnnualLeaveDays ?? policy.daysPerYear ?? 0
  );
  const contractAnnualLeaveDays = Math.max(0, isNaN(rawContractDays) ? 0 : rawContractDays);

  // 2. Resolve Confirmation Date
  const confirmationDateRaw =
    employee.confirmationDate ||
    employee.probationEndDate ||
    employee.confirmedAt ||
    null;
  const confirmationDate = parseDate(confirmationDateRaw);

  // 3. Resolve Policy & Configuration Flags
  const cutoffDay = Number(
    policy.midMonthCutoffDay ?? DEFAULT_LEAVE_CONFIG.MID_MONTH_CUTOFF_DAY
  );
  const rounding = policy.roundingPolicy || DEFAULT_LEAVE_CONFIG.DEFAULT_ROUNDING;
  const allowNegative = Boolean(policy.allowNegativeBalance);

  // Accrual toggle: Employee override takes precedence over Policy setting
  const isAccrualEnabled = typeof employee.isAccrualEnabled === 'boolean'
    ? employee.isAccrualEnabled
    : typeof policy.isAccrualEnabled === 'boolean'
      ? policy.isAccrualEnabled
      : DEFAULT_LEAVE_CONFIG.IS_ACCRUAL_ENABLED;

  // 4. Resolve Usage / Deductions
  const leaveTaken = Math.max(0, Number(employee.leaveTaken ?? employee.used ?? 0) || 0);
  const pendingDays = Math.max(0, Number(employee.pending ?? 0) || 0);

  // -------------------------------------------------------------
  // RULE 1: Confirmation State & Year Analysis
  // -------------------------------------------------------------
  const isConfirmed = Boolean(confirmationDate && refDate >= confirmationDate);
  const confYear = confirmationDate ? confirmationDate.getFullYear() : null;

  const isPreConfirmation = !confirmationDate || (confirmationDate && refDate < confirmationDate);
  const isConfirmationYear = Boolean(confirmationDate && confYear === leaveYear);
  const isPostConfirmationYear = Boolean(confirmationDate && confYear < leaveYear);

  // -------------------------------------------------------------
  // GUARD CLAUSE 1: Pre-Confirmation
  // "Pre-confirmation: An employee is not entitled to annual leave
  // before their confirmation date (entitlement = 0)."
  // -------------------------------------------------------------
  if (!confirmationDate || confYear > leaveYear || (isConfirmationYear && refDate < confirmationDate)) {
    return {
      leaveYear,
      referenceDate: refDate,
      isConfirmed: false,
      isPreConfirmation: true,
      isConfirmationYear,
      isPostConfirmationYear: false,
      confirmedMonthsInYear: 0,
      elapsedMonthsInYear: 0,
      contractAnnualLeaveDays,
      entitledDays: 0,
      monthlyAccrualRate: 0,
      earnedLeave: 0,
      leaveTaken,
      pendingDays,
      isAccrualEnabled,
      grossAvailable: allowNegative ? -leaveTaken : 0,
      available: allowNegative ? -(leaveTaken + pendingDays) : 0,
      breakdown: {
        prorationFormula: 'Pre-confirmation (entitlement = 0)',
        confirmedMonthsInYear: 0,
        elapsedMonthsInYear: 0,
        monthlyAccrualRate: 0,
        rawEntitledDays: 0,
        rawEarnedLeave: 0,
        roundingPolicy: rounding,
        midMonthCutoffDay: cutoffDay
      }
    };
  }

  // -------------------------------------------------------------
  // RULE 1: Confirmed Months in Year & Prorated Entitlement
  // -------------------------------------------------------------
  const confirmedMonthsInYear = getConfirmedMonthsInYear(confirmationDate, leaveYear, cutoffDay);

  // GUARD CLAUSE 2: Division-by-Zero Guard
  // If Confirmed Months in Year === 0 (e.g. confirmed late December after cutoff), return 0.
  if (confirmedMonthsInYear === 0) {
    return {
      leaveYear,
      referenceDate: refDate,
      isConfirmed: true,
      isPreConfirmation: false,
      isConfirmationYear,
      isPostConfirmationYear,
      confirmedMonthsInYear: 0,
      elapsedMonthsInYear: 0,
      contractAnnualLeaveDays,
      entitledDays: 0,
      monthlyAccrualRate: 0,
      earnedLeave: 0,
      leaveTaken,
      pendingDays,
      isAccrualEnabled,
      grossAvailable: allowNegative ? -leaveTaken : 0,
      available: allowNegative ? -(leaveTaken + pendingDays) : 0,
      breakdown: {
        prorationFormula: '(0 / 12) * Contract Days = 0',
        confirmedMonthsInYear: 0,
        elapsedMonthsInYear: 0,
        monthlyAccrualRate: 0,
        rawEntitledDays: 0,
        rawEarnedLeave: 0,
        roundingPolicy: rounding,
        midMonthCutoffDay: cutoffDay
      }
    };
  }

  // Prorated Entitlement Formula:
  // Prorated Entitlement = (Confirmed Months in Year / 12) * Contract Annual Leave Days
  // (In post-confirmation years, Confirmed Months = 12 -> 100% of Contract Days)
  const rawEntitledDays = (confirmedMonthsInYear / DEFAULT_LEAVE_CONFIG.MONTHS_IN_YEAR) * contractAnnualLeaveDays;
  const entitledDays = roundLeaveDays(rawEntitledDays, rounding);

  // -------------------------------------------------------------
  // RULE 2: Accrual Formula & Monthly Rate
  // -------------------------------------------------------------
  // Monthly Accrual Rate:
  // Rate = Entitled Days / Confirmed Months in Year
  // Note: Since rawEntitledDays = (Confirmed Months / 12) * Contract Days,
  // (rawEntitledDays / Confirmed Months) === Contract Days / 12.
  const rawMonthlyAccrualRate = entitledDays / confirmedMonthsInYear;
  const monthlyAccrualRate = roundLeaveDays(rawMonthlyAccrualRate, rounding);

  // Active Elapsed Months Post-Confirmation in Current Year:
  const elapsedMonthsInYear = getElapsedMonthsPostConfirmation(
    confirmationDate,
    refDate,
    leaveYear,
    confirmedMonthsInYear,
    cutoffDay
  );

  // Accrual Formula:
  // Earned Leave = (Entitled Days / Confirmed Months in Year) * Elapsed Months Post-Confirmation in Current Year
  // Clamped so earned leave never exceeds entitledDays.
  const rawEarnedLeave = Math.min(
    entitledDays,
    (entitledDays / confirmedMonthsInYear) * elapsedMonthsInYear
  );
  const earnedLeave = roundLeaveDays(rawEarnedLeave, rounding);

  // -------------------------------------------------------------
  // RULE 3: Available Leave Balance & Manual Override Toggle
  // -------------------------------------------------------------
  // Base usable entitlement depends on isAccrualEnabled toggle:
  // - When isAccrualEnabled === true:  Available capped at Earned Leave - Leave Taken
  // - When isAccrualEnabled === false: Available calculated from full Entitled Days - Leave Taken
  const activeBaseDays = isAccrualEnabled ? earnedLeave : entitledDays;

  const rawGrossAvailable = activeBaseDays - leaveTaken;
  const grossAvailable = roundLeaveDays(
    allowNegative ? rawGrossAvailable : Math.max(0, rawGrossAvailable),
    rounding
  );

  const rawAvailable = activeBaseDays - leaveTaken - pendingDays;
  const available = roundLeaveDays(
    allowNegative ? rawAvailable : Math.max(0, rawAvailable),
    rounding
  );

  return {
    leaveYear,
    referenceDate: refDate,
    isConfirmed,
    isPreConfirmation: false,
    isConfirmationYear,
    isPostConfirmationYear,
    confirmedMonthsInYear,
    elapsedMonthsInYear,
    contractAnnualLeaveDays,
    entitledDays,
    monthlyAccrualRate,
    earnedLeave,
    leaveTaken,
    pendingDays,
    isAccrualEnabled,
    grossAvailable,
    available,
    breakdown: {
      prorationFormula: `(${confirmedMonthsInYear} / 12) * ${contractAnnualLeaveDays} = ${entitledDays}`,
      accrualFormula: `(${entitledDays} / ${confirmedMonthsInYear}) * ${elapsedMonthsInYear} = ${earnedLeave}`,
      confirmedMonthsInYear,
      elapsedMonthsInYear,
      monthlyAccrualRate,
      rawEntitledDays,
      rawEarnedLeave,
      roundingPolicy: rounding,
      midMonthCutoffDay: cutoffDay
    }
  };
}
