import { useQuery } from '@tanstack/react-query';
import { leaveApi } from '@/api';

export const LEAVE_TYPE_KEYS = {
  all: ['leave-types'],
};

// /leave/types returns lean Mongo docs (only `_id`), so every consumer needs the same `id`
// mapping. Leave types were previously fetched under two keys in two different shapes
// (['leaveTypes'] -> { leaveTypes }, ['leave-types'] -> array); keep everything on this hook.
export function useLeaveTypes(paramsOrOptions = {}, maybeOptions = {}) {
  const isQueryOption =
    'enabled' in paramsOrOptions ||
    'staleTime' in paramsOrOptions ||
    'select' in paramsOrOptions ||
    'initialData' in paramsOrOptions;
  const params = isQueryOption ? {} : paramsOrOptions;
  const options = isQueryOption ? paramsOrOptions : maybeOptions;

  return useQuery({
    queryKey: Object.keys(params).length > 0 ? [...LEAVE_TYPE_KEYS.all, params] : LEAVE_TYPE_KEYS.all,
    queryFn: async () => {
      const res = await leaveApi.getLeaveTypes(params);
      const list = Array.isArray(res) ? res : res?.data || [];
      return list.map(type => ({ ...type, id: type.id || type._id }));
    },
    ...options,
  });
}
