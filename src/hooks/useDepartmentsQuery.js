import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { departmentsApi } from '@/api';
import { normalizeDepartment } from '@/lib/formOptions';

export const DEPARTMENT_KEYS = {
  all: ['departments'],
  lists: () => [...DEPARTMENT_KEYS.all, 'list'],
  detail: (id) => [...DEPARTMENT_KEYS.all, 'detail', id],
};

// Departments are shared reference data edited from Settings but consumed on
// almost every form in the app, so every consumer must see a fresh copy the
// moment it mounts rather than whatever was cached from an earlier visit.
export function useDepartments(options = {}) {
  return useQuery({
    queryKey: DEPARTMENT_KEYS.lists(),
    queryFn: async () => {
      const res = await departmentsApi.getDepartments();
      const list = Array.isArray(res) ? res : res?.data || [];
      return (Array.isArray(list) ? list : []).map(normalizeDepartment);
    },
    refetchOnMount: 'always',
    ...options,
  });
}

export function useDepartment(id) {
  return useQuery({
    queryKey: DEPARTMENT_KEYS.detail(id),
    queryFn: () => departmentsApi.getDepartmentById(id),
    enabled: Boolean(id),
  });
}

export function useCreateDepartment() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (dto) => departmentsApi.createDepartment(dto),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: DEPARTMENT_KEYS.all });
    },
  });
}

export function useUpdateDepartment() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, dto }) => departmentsApi.updateDepartment(id, dto),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: DEPARTMENT_KEYS.all });
    },
  });
}

export function useDeleteDepartment() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id) => departmentsApi.deleteDepartment(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: DEPARTMENT_KEYS.all });
    },
  });
}
