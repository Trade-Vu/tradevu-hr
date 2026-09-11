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
};

export default payrollApi;
