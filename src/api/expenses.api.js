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
};

export default expensesApi;
