import apiClient from './client';

export const notificationsApi = {
  getMy: async (params = {}) => {
    return apiClient.get('/notifications', { params });
  },

  getUnreadCount: async () => {
    return apiClient.get('/notifications/unread-count');
  },

  markAllRead: async () => {
    return apiClient.put('/notifications/mark-all-read');
  },

  markOneRead: async (id) => {
    return apiClient.put(`/notifications/${id}/read`);
  },
};

export default notificationsApi;
