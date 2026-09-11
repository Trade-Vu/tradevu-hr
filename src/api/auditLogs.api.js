import apiClient from './client';

export const auditLogsApi = {
  getAuditLogs: async (params = {}) => {
    return apiClient.get('/audit-logs', { params });
  },
};

export default auditLogsApi;
