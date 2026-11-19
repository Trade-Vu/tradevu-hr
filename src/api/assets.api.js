import apiClient from './client';

export const assetsApi = {
  getAssets: async (params = {}) => {
    return apiClient.get('/assets', { params });
  },

  getMyAssets: async (employeeId) => {
    if (employeeId) {
      return apiClient.get('/assets', { params: { assignedTo: employeeId } });
    }
    return apiClient.get('/assets/my');
  },

  getAssetById: async (id) => {
    return apiClient.get(`/assets/${id}`);
  },

  createAsset: async (data) => {
    return apiClient.post('/assets', data);
  },

  updateAsset: async (id, data) => {
    return apiClient.put(`/assets/${id}`, data);
  },

  assignAsset: async (id, data) => {
    return apiClient.put(`/assets/${id}/assign`, data);
  },

  confirmAsset: async (id, data = {}) => {
    const payload = typeof data === 'string' ? { notes: data } : data;
    try {
      return await apiClient.put(`/assets/${id}/confirm`, payload);
    } catch {
      // Graceful fallback to general update
      return await apiClient.put(`/assets/${id}`, {
        confirmed_by_employee: true,
        confirmedByEmployee: true,
        confirmation_status: 'confirmed',
        confirmationStatus: 'confirmed',
        confirmed_at: payload.confirmedAt || new Date().toISOString(),
        confirmed_by: payload.confirmedBy,
        confirmed_notes: payload.notes,
        is_disputed: false,
        isDisputed: false,
      });
    }
  },

  disputeAsset: async (id, data = {}) => {
    const payload = typeof data === 'string' ? { reason: data } : data;
    try {
      return await apiClient.put(`/assets/${id}/dispute`, payload);
    } catch {
      // Graceful fallback to update: asset remains assigned but flagged for HR review
      return await apiClient.put(`/assets/${id}`, {
        confirmation_status: 'disputed',
        confirmationStatus: 'disputed',
        is_disputed: true,
        isDisputed: true,
        dispute_reason: payload.reason,
        disputeReason: payload.reason,
        disputed_at: payload.disputedAt || new Date().toISOString(),
        disputed_by: payload.disputedBy,
      });
    }
  },

  resolveDispute: async (id, resolutionNotes = '') => {
    try {
      return await apiClient.put(`/assets/${id}/resolve-dispute`, { resolutionNotes });
    } catch {
      return await apiClient.put(`/assets/${id}`, {
        confirmation_status: 'confirmed',
        confirmationStatus: 'confirmed',
        is_disputed: false,
        isDisputed: false,
        resolution_notes: resolutionNotes,
        resolved_at: new Date().toISOString(),
      });
    }
  },

  unassignAsset: async (id) => {
    return apiClient.put(`/assets/${id}/unassign`);
  },

  deleteAsset: async (id) => {
    return apiClient.delete(`/assets/${id}`);
  },
};

export default assetsApi;
