import apiClient from './client';

export const payrollApi = {
  getMyPayslips: async (params = {}) => {
    return apiClient.get('/payroll/payslips/my', { params });
  },

  downloadPayslipPdf: async (recordId) => {
    return apiClient.get(`/payroll/payslips/${recordId}/pdf`, {
      responseType: 'blob',
    });
  },

  getRuns: async (params = {}) => {
    return apiClient.get('/payroll/runs', { params });
  },

  getRunById: async (id) => {
    return apiClient.get(`/payroll/runs/${id}`);
  },

  getRunRecords: async (id, params = {}) => {
    return apiClient.get(`/payroll/runs/${id}/records`, { params });
  },

  createRun: async (data) => {
    return apiClient.post('/payroll/runs', data);
  },

  submitRun: async (id) => {
    return apiClient.put(`/payroll/runs/${id}/submit`);
  },

  approveRun: async (id) => {
    return apiClient.put(`/payroll/runs/${id}/approve`);
  },

  markPaid: async (id) => {
    return apiClient.put(`/payroll/runs/${id}/mark-paid`);
  },

  lockRun: async (id) => {
    return apiClient.put(`/payroll/runs/${id}/lock`);
  },

  getSettings: async () => {
    return apiClient.get('/payroll/settings');
  },

  updateSettings: async (data) => {
    return apiClient.put('/payroll/settings', data);
  },

  getAdjustments: async (params = {}) => {
    return apiClient.get('/payroll/adjustments', { params });
  },

  createAdjustment: async (data) => {
    return apiClient.post('/payroll/adjustments', data);
  },

  approveAdjustment: async (id) => {
    return apiClient.put(`/payroll/adjustments/${id}/approve`);
  },

  rejectAdjustment: async (id, rejectionReason) => {
    return apiClient.put(`/payroll/adjustments/${id}/reject`, { rejectionReason });
  },

  getDepartmentReport: async (runId) => {
    return apiClient.get(`/payroll/runs/${runId}/reports/department-summary`);
  },

  getTaxSummary: async (runId) => {
    return apiClient.get(`/payroll/runs/${runId}/reports/tax-summary`);
  },

  downloadBankFile: async (runId) => {
    return apiClient.get(`/payroll/runs/${runId}/reports/bank-file`, {
      responseType: 'blob',
    });
  },

  getSalaryHistory: async (employeeId) => {
    return apiClient.get(`/employees/${employeeId}/salary-history`);
  },
};

export default payrollApi;
