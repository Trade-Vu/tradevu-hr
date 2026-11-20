import {
  serializeToCsv,
  serializeToXlsx,
  generateExportFilename,
  downloadFileBlob,
} from "@/lib/fileExporter";

export { generateClientFallbackPreview } from "./leaveReportFallback";

/**
 * Extract 2-letter initials from employee full name
 */
export function getInitials(name) {
  if (!name) return "EM";
  const parts = String(name).trim().split(/\s+/);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + (parts[1] ? parts[1][0] : "")).toUpperCase();
}

/**
 * Resolves standard date presets into start/end dates and metadata
 */
export function resolveDatePreset(datePreset, customStartDate = "", customEndDate = "") {
  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth();
  const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

  if (datePreset === "YEAR") {
    return {
      startDate: `${currentYear}-01-01`,
      endDate: `${currentYear}-12-31`,
      year: currentYear,
      label: `FullYear-${currentYear}`,
    };
  }
  if (datePreset === "CURRENT_MONTH") {
    const start = new Date(currentYear, currentMonth, 1);
    const end = new Date(currentYear, currentMonth + 1, 0);
    return {
      startDate: start.toISOString().split("T")[0],
      endDate: end.toISOString().split("T")[0],
      year: currentYear,
      label: `${monthNames[currentMonth]}-${currentYear}`,
    };
  }
  if (datePreset === "NEXT_MONTH") {
    const nextMonthDate = new Date(currentYear, currentMonth + 1, 1);
    const nextMonthYear = nextMonthDate.getFullYear();
    const nextMonthIdx = nextMonthDate.getMonth();
    const end = new Date(nextMonthYear, nextMonthIdx + 1, 0);
    return {
      startDate: nextMonthDate.toISOString().split("T")[0],
      endDate: end.toISOString().split("T")[0],
      year: nextMonthYear,
      label: `${monthNames[nextMonthIdx]}-${nextMonthYear}`,
    };
  }
  if (datePreset === "Q4") {
    return {
      startDate: `${currentYear}-10-01`,
      endDate: `${currentYear}-12-31`,
      year: currentYear,
      label: `Q4-${currentYear}`,
    };
  }
  if (datePreset === "Q1_NEXT") {
    return {
      startDate: `${currentYear + 1}-01-01`,
      endDate: `${currentYear + 1}-03-31`,
      year: currentYear + 1,
      label: `Q1-${currentYear + 1}`,
    };
  }
  if (datePreset === "CUSTOM") {
    return {
      startDate: customStartDate || `${currentYear}-01-01`,
      endDate: customEndDate || `${currentYear}-12-31`,
      year: currentYear,
      label: `${customStartDate || "Start"}_to_${customEndDate || "End"}`,
    };
  }

  return {
    startDate: `${currentYear}-01-01`,
    endDate: `${currentYear}-12-31`,
    year: currentYear,
    label: `${currentYear}`,
  };
}

/**
 * Computes top-level summary metrics
 */
export function calculateLeaveMetrics(reportType, rows = []) {
  if (reportType === "summary") {
    const uniqueEmps = new Set(rows.map((r) => r[0])).size;
    const totalEntitled = rows.reduce((acc, r) => acc + (Number(r[9]) || 0), 0);
    const totalTaken = rows.reduce((acc, r) => acc + (Number(r[11]) || 0), 0);
    const totalAvailable = rows.reduce((acc, r) => acc + (Number(r[13]) || 0), 0);
    return {
      countLabel: "Employees in Scope",
      count: uniqueEmps,
      stat1Label: "Total Entitled Days",
      stat1: totalEntitled.toFixed(1),
      stat2Label: "Approved Days Taken",
      stat2: totalTaken.toFixed(1),
      stat3Label: "Total Available Balance",
      stat3: totalAvailable.toFixed(1),
    };
  }

  const totalRequests = rows.length;
  const totalWorkingDays = rows.reduce((acc, r) => acc + (Number(r[6]) || 0), 0);
  const approvedCount = rows.filter((r) => String(r[7]).toUpperCase() === "APPROVED").length;
  const pendingCount = rows.filter((r) => String(r[7]).toUpperCase().includes("PENDING")).length;
  return {
    countLabel: "Planned Records",
    count: totalRequests,
    stat1Label: "Total Working Days",
    stat1: totalWorkingDays.toFixed(1),
    stat2Label: "Approved Requests",
    stat2: approvedCount,
    stat3Label: "Pending Requests",
    stat3: pendingCount,
  };
}

/**
 * Group flat summary rows by employee to eliminate Cartesian duplication
 */
export function groupLeaveSummaryByEmployee(rows = []) {
  const map = new Map();

  rows.forEach((r) => {
    const empId = String(r[0] || "");
    const empName = String(r[1] || "");
    const key = empId ? `${empId}_${empName}` : empName;

    if (!map.has(key)) {
      map.set(key, {
        key,
        employeeId: r[0],
        fullName: r[1],
        email: r[2],
        department: r[3],
        employmentType: r[4],
        employeeClass: r[5],
        confirmationStatus: r[6],
        confirmationDate: r[7],
        totalEntitled: 0,
        totalEarned: 0,
        totalTaken: 0,
        totalPending: 0,
        totalAvailable: 0,
        policies: [],
      });
    }

    const entry = map.get(key);
    const entitled = Number(r[9]) || 0;
    const earned = Number(r[10]) || 0;
    const taken = Number(r[11]) || 0;
    const pending = Number(r[12]) || 0;
    const available = Number(r[13]) || 0;

    entry.totalEntitled += entitled;
    entry.totalEarned += earned;
    entry.totalTaken += taken;
    entry.totalPending += pending;
    entry.totalAvailable += available;

    entry.policies.push({
      leaveType: r[8],
      entitled,
      earned,
      taken,
      pending,
      available,
    });
  });

  return Array.from(map.values());
}

/**
 * Prepares and downloads the full export dataset (independent of UI pagination)
 */
export async function executeLeaveExport({
  format,
  exportParams,
  headers,
  rows,
  itemizedSheet,
  reportType,
  scope,
  selectedDepartments,
  departments = [],
  selectedEmployeeId,
  eligibleEmployees = [],
  resolvedDateRange,
  leaveApi,
}) {
  let blob;
  try {
    blob = await leaveApi.exportLeaveReport({ ...exportParams, format });
  } catch (backendErr) {
    const fallbackSheets = [
      {
        name: reportType === "planning" ? "Leave Planning" : "Leave Balances",
        headers,
        rows,
      },
    ];
    if (itemizedSheet) fallbackSheets.push(itemizedSheet);

    if (format === "csv") {
      blob = itemizedSheet
        ? serializeToCsv({
            sections: [
              { title: "Leave Summary", headers, rows },
              { title: "Itemized Requests", headers: itemizedSheet.headers, rows: itemizedSheet.rows },
            ],
          })
        : serializeToCsv({ headers, rows });
    } else {
      blob = serializeToXlsx({ sheets: fallbackSheets });
    }
  }

  let scopeLabel = "";
  if (scope === "department") {
    const deptNames = departments
      .filter((d) => selectedDepartments.includes(d.id || d._id))
      .map((d) => d.name)
      .join("-");
    scopeLabel = deptNames || "Departments";
  } else if (scope === "individual") {
    const emp = eligibleEmployees.find((e) => (e.id || e._id) === selectedEmployeeId);
    scopeLabel = emp ? emp.fullName || emp.full_name : "Employee";
  }

  const filename = generateExportFilename({
    reportType,
    scope,
    scopeName: scopeLabel,
    dateLabel: resolvedDateRange.label,
    format,
  });

  downloadFileBlob(blob, filename, format);
  return filename;
}
