import { calculateLeaveBalance } from "@/lib/leaveEngine";

/**
 * Client-side fallback calculation using calculateLeaveBalance if backend preview is offline.
 */
export function generateClientFallbackPreview({ employees = [], leaveTypes = [], params }) {
  const { reportType, scope, scopeIds = [], dateRange, leaveTypeId } = params;
  const year = dateRange.year || new Date().getFullYear();

  let scopedEmployees = [...employees];
  if (scope === "department" && scopeIds.length > 0) {
    scopedEmployees = scopedEmployees.filter((e) => {
      const dId = e.departmentId?._id || e.departmentId?.id || e.departmentId || e.department?.id;
      return scopeIds.includes(String(dId));
    });
  } else if (scope === "individual" && scopeIds.length > 0) {
    scopedEmployees = scopedEmployees.filter((e) => String(e.id || e._id) === String(scopeIds[0]));
  }

  let scopedLeaveTypes = [...leaveTypes];
  if (leaveTypeId) {
    scopedLeaveTypes = scopedLeaveTypes.filter((t) => String(t.id || t._id) === String(leaveTypeId));
  }

  if (reportType === "planning") {
    const headers = [
      "Employee Name",
      "Department",
      "Role / Job Title",
      "Leave Type",
      "Planned Start Date",
      "Planned End Date",
      "Total Working Days",
      "Approval Status",
      "Relief / Handover Officer",
      "Month / Quarter Breakdown",
    ];
    return {
      headers,
      rows: [],
      totalRecords: 0,
    };
  }

  const headers = [
    "Employee ID",
    "Full Name",
    "Email",
    "Department",
    "Employment Type",
    "Employee Class",
    "Confirmation Status",
    "Confirmation Date",
    "Leave Type",
    "Total Entitled Days",
    "Earned / Accrued Days",
    "Approved Days Taken",
    "Pending Days",
    "Remaining Available Balance",
  ];

  const rows = [];
  scopedEmployees.forEach((emp) => {
    const confDate = emp.confirmationDate || emp.probationEndDate || null;
    const isConfirmed = confDate && new Date(dateRange.endDate || new Date()) >= new Date(confDate);
    const confStatus = isConfirmed ? "Confirmed" : "Unconfirmed / Probation";
    const confDateStr = confDate ? new Date(confDate).toISOString().split("T")[0] : "N/A";

    scopedLeaveTypes.forEach((lt) => {
      const contractDays = Number(lt.daysPerYear || 20);
      const calcResult = calculateLeaveBalance(
        {
          confirmationDate: confDate,
          leaveTaken: 0,
          pendingDays: 0,
          isAccrualEnabled: true,
        },
        {
          contractAnnualLeaveDays: contractDays,
          daysPerYear: contractDays,
          roundingPolicy: "TWO_DECIMAL_PLACES",
          isAccrualEnabled: true,
        },
        new Date(dateRange.endDate || new Date()),
        { year: Number(year) }
      );

      rows.push([
        emp.employeeCode || emp.id || "EMP",
        emp.fullName || emp.full_name || "Employee",
        emp.email || "",
        emp.department?.name || "Unassigned",
        emp.employmentType || "FULL_TIME",
        emp.employeeClass || "Standard",
        confStatus,
        confDateStr,
        lt.name,
        calcResult.entitledDays,
        calcResult.earnedLeave,
        0,
        0,
        calcResult.available,
      ]);
    });
  });

  return {
    headers,
    rows,
    itemizedSheet: null,
    totalRecords: rows.length,
  };
}
