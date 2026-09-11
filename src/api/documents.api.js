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

  getCloudinarySignature: async () => {
    return apiClient.get('/documents/cloudinary-signature');
  },
};

export default documentsApi;
