import apiClient from './client';

export const analyticsApi = {
  getHrSummary: async () => {
    return apiClient.get('/analytics/summary');
  },

  getHeadcountByDepartment: async () => {
    return apiClient.get('/analytics/headcount/department');
  },

  getHeadcountTrend: async (months = 6) => {
    return apiClient.get('/analytics/headcount/trend', { params: { months } });
  },

  getAttendanceSummary: async (year, month) => {
    return apiClient.get('/analytics/attendance', { params: { year, month } });
  },

  getPayrollTrend: async (months = 6) => {
    return apiClient.get('/analytics/payroll/trend', { params: { months } });
  },

  getLeaveAnalytics: async (year) => {
    return apiClient.get('/analytics/leave', { params: { year } });
  },

  getMyDashboard: async () => {
    return apiClient.get('/analytics/dashboard/my');
  },
};

export default analyticsApi;
