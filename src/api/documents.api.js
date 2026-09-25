import apiClient from './client';

export const documentsApi = {
  getMyDocuments: async (params = {}) => {
    return apiClient.get('/documents/my', { params });
  },

  getDocuments: async (params = {}) => {
    return apiClient.get('/documents', { params });
  },

  uploadDocument: async (dto) => {
    return apiClient.post('/documents', dto);
  },

  deleteDocument: async (id) => {
    return apiClient.delete(`/documents/${id}`);
  },

  getDocumentById: async (id) => {
    return apiClient.get(`/documents/${id}`);
  },

  replaceDocumentVersion: async (id, dto) => {
    return apiClient.post(`/documents/${id}/replace`, dto);
  },

  getDocumentHistory: async (id) => {
    return apiClient.get(`/documents/${id}/history`);
  },

  archiveDocument: async (id) => {
    return apiClient.put(`/documents/${id}/archive`);
  },

  approveDocument: async (id, notes) => {
    return apiClient.put(`/documents/${id}/approve`, { notes });
  },

  rejectDocument: async (id, notes) => {
    return apiClient.put(`/documents/${id}/reject`, { notes });
  },
};

export default documentsApi;
