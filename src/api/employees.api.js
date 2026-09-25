import apiClient from './client';

export const employeesApi = {
  getEmployees: async (params = {}) => {
    return apiClient.get('/employees', { params });
  },

  // Every employee matching `params`, following pagination. Use this for pickers and org-wide
  // lookups; getEmployees() alone returns one page (20 rows unless a limit is passed).
  getAllEmployees: async (params = {}) => {
    const PAGE_SIZE = 100;
    const all = [];
    for (let page = 1; ; page += 1) {
      const res = await apiClient.get('/employees', { params: { ...params, page, limit: PAGE_SIZE } });
      const list = Array.isArray(res) ? res : res?.data || [];
      all.push(...list);
      const totalPages = res?.pagination?.totalPages;
      if (!totalPages || page >= totalPages || list.length === 0) return all;
    }
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

  reassignHrAdmin: async (id) => {
    return apiClient.post(`/employees/${id}/reassign-hr-admin`);
  },
};

export default employeesApi;
