import { apiClient } from './client';

export const companyLibraryApi = {
  // 1. Folders
  getFolders: async (search = '') => {
    const res = await apiClient.get('/company-library/folders', {
      params: search ? { search } : {},
    });
    return Array.isArray(res) ? res : res?.data || [];
  },

  getFolderById: async (id) => {
    const res = await apiClient.get(`/company-library/folders/${id}`);
    return res?.data || res;
  },

  createFolder: async (dto) => {
    const res = await apiClient.post('/company-library/folders', dto);
    return res?.data || res;
  },

  updateFolder: async (id, dto) => {
    const res = await apiClient.put(`/company-library/folders/${id}`, dto);
    return res?.data || res;
  },

  deleteFolder: async (id) => {
    const res = await apiClient.delete(`/company-library/folders/${id}`);
    return res?.data || res;
  },

  // 2. Assets
  getAssets: async ({ folderId = null, search = '' } = {}) => {
    const res = await apiClient.get('/company-library/assets', {
      params: {
        ...(folderId ? { folderId } : {}),
        ...(search ? { search } : {}),
      },
    });
    return Array.isArray(res) ? res : res?.data || [];
  },

  createAsset: async (dto) => {
    const res = await apiClient.post('/company-library/assets', dto);
    return res?.data || res;
  },

  updateAsset: async (id, dto) => {
    const res = await apiClient.put(`/company-library/assets/${id}`, dto);
    return res?.data || res;
  },

  deleteAsset: async (id) => {
    const res = await apiClient.delete(`/company-library/assets/${id}`);
    return res?.data || res;
  },

  // 3. Onboarding Task Integration
  submitTaskAsset: async (taskId, dto) => {
    const res = await apiClient.post(`/company-library/tasks/${taskId}/submit-asset`, dto);
    return res?.data || res;
  },

  linkTaskToAsset: async (taskId, assetId) => {
    const res = await apiClient.post(`/company-library/tasks/${taskId}/link-asset`, { assetId });
    return res?.data || res;
  },
};

export default companyLibraryApi;
