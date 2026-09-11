import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { departmentsApi } from '@/api';

export const DEPARTMENT_KEYS = {
  all: ['departments'],
  lists: () => [...DEPARTMENT_KEYS.all, 'list'],
  detail: (id) => [...DEPARTMENT_KEYS.all, 'detail', id],
};

export function useDepartments() {
  return useQuery({
    queryKey: DEPARTMENT_KEYS.lists(),
    queryFn: () => departmentsApi.getDepartments(),
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
