import apiClient from './client';

export const leaveApi = {
  getLeaveTypes: async () => {
    return apiClient.get('/leave/types');
  },

  getPublicHolidays: async () => {
    return apiClient.get('/leave/holidays');
  },

  createPublicHoliday: async (data) => {
    return apiClient.post('/leave/holidays', data);
  },

  deletePublicHoliday: async (id) => {
    return apiClient.delete(`/leave/holidays/${id}`);
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
    if (dto.action === 'approved') {
      return apiClient.put(`/approvals/leave/${id}/approve`);
    }
    return apiClient.put(`/approvals/leave/${id}/reject`, {
      reason: dto.rejectionReason,
    });
  },

  cancelRequest: async (id) => {
    return apiClient.put(`/leave/requests/${id}/cancel`);
  },

  getMyBalance: async (year) => {
    return apiClient.get('/leave/balances/my', { params: year ? { year } : {} });
  },

  getBalances: async (employeeId, year) => {
    if (!employeeId) {
      return leaveApi.getMyBalance(year);
    }
    return apiClient.get(`/leave/balances/${employeeId}`, { params: year ? { year } : {} });
  },
};

export default leaveApi;
