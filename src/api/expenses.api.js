import apiClient from './client';

export const expensesApi = {
  getMyExpenses: async (params = {}) => {
    return apiClient.get('/expenses/my', { params });
  },

  getAllExpenses: async (params = {}) => {
    return apiClient.get('/expenses', { params });
  },

  createExpense: async (dto) => {
    return apiClient.post('/expenses', dto);
  },

  approveExpense: async (id) => {
    return apiClient.put(`/expenses/${id}/approve`);
  },

  rejectExpense: async (id, rejectionReason) => {
    return apiClient.put(`/expenses/${id}/reject`, { rejectionReason });
  },

  reimburseExpense: async (id) => {
    return apiClient.put(`/expenses/${id}/reimburse`);
  },
};

export default expensesApi;
