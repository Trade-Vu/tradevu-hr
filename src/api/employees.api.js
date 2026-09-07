import apiClient from './client';

export const employeesApi = {
  getEmployees: async (params = {}) => {
    return apiClient.get('/employees', { params });
  },

  getStats: async () => {
    return apiClient.get('/employees/stats');
  },

  getCelebrations: async (month) => {
    return apiClient.get('/employees/celebrations', { params: { month } });
  },

  getEmployeeById: async (id) => {
    return apiClient.get(`/employees/${id}`);
  },

  createEmployee: async (dto) => {
    return apiClient.post('/employees', dto);
  },

  updateEmployee: async (id, dto) => {
    return apiClient.patch(`/employees/${id}`, dto);
  },

  deleteEmployee: async (id) => {
    return apiClient.delete(`/employees/${id}`);
  },

  inviteEmployee: async (dto) => {
    return apiClient.post('/employees/invite', dto);
  },

  bulkImport: async (employees) => {
    return apiClient.post('/employees/bulk-import', { employees });
  },

  submitForReview: async (id) => {
    return apiClient.post(`/employees/${id}/submit-for-review`);
  },
};

export default employeesApi;
