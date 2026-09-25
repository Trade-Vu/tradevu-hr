import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('@/api/client', () => ({ default: { get: vi.fn() } }));

import apiClient from '@/api/client';
import { employeesApi } from '@/api/employees.api';

const page = (n, count, totalPages) => ({
  data: Array.from({ length: count }, (_, i) => ({ _id: `${n}-${i}` })),
  pagination: { page: n, limit: 100, total: 0, totalPages },
});

describe('employeesApi.getAllEmployees', () => {
  beforeEach(() => apiClient.get.mockReset());

  it('follows pagination until the last page and forwards filters', async () => {
    apiClient.get
      .mockResolvedValueOnce(page(1, 100, 3))
      .mockResolvedValueOnce(page(2, 100, 3))
      .mockResolvedValueOnce(page(3, 7, 3));

    const all = await employeesApi.getAllEmployees({ leaveEligible: true });

    expect(all).toHaveLength(207);
    expect(apiClient.get).toHaveBeenCalledTimes(3);
    expect(apiClient.get).toHaveBeenLastCalledWith('/employees', {
      params: { leaveEligible: true, page: 3, limit: 100 },
    });
  });

  it('stops after one request when the response is not paginated', async () => {
    apiClient.get.mockResolvedValueOnce([{ _id: 'a' }, { _id: 'b' }]);
    expect(await employeesApi.getAllEmployees()).toHaveLength(2);
    expect(apiClient.get).toHaveBeenCalledTimes(1);
  });
});
