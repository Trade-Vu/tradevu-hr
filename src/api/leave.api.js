import apiClient from './client';

export const leaveApi = {
  getLeaveTypes: async () => {
    return apiClient.get('/leave/types');
  },

  createLeaveType: async (dto) => {
    return apiClient.post('/leave/types', dto);
  },

  updateLeaveType: async (id, dto) => {
    return apiClient.put(`/leave/types/${id}`, dto);
  },

  deleteLeaveType: async (id) => {
    return apiClient.delete(`/leave/types/${id}`);
  },

  getAllRequests: async (params = {}) => {
    return apiClient.get('/leave/requests', { params });
  },

  getMyRequests: async (params = {}) => {
    return apiClient.get('/leave/requests/my', { params });
  },

  createRequest: async (dto) => {
    return apiClient.post('/leave/requests', dto);
  },

  reviewRequest: async (id, dto) => {
    return apiClient.put(`/leave/requests/${id}/review`, dto);
  },

  cancelRequest: async (id) => {
    return apiClient.put(`/leave/requests/${id}/cancel`);
  },

  getBalances: async (employeeId) => {
    return apiClient.get(`/leave/balances/${employeeId}`);
  },
};

export default leaveApi;
