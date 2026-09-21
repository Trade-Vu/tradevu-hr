import { useQuery } from '@tanstack/react-query';
import { leaveApi } from '@/api';

export const LEAVE_TYPE_KEYS = {
  all: ['leave-types'],
};

// /leave/types returns lean Mongo docs (only `_id`), so every consumer needs the same `id`
// mapping. Leave types were previously fetched under two keys in two different shapes
// (['leaveTypes'] -> { leaveTypes }, ['leave-types'] -> array); keep everything on this hook.
export function useLeaveTypes(options = {}) {
  return useQuery({
    queryKey: LEAVE_TYPE_KEYS.all,
    queryFn: async () => {
      const res = await leaveApi.getLeaveTypes();
      const list = Array.isArray(res) ? res : res?.data || [];
      return list.map(type => ({ ...type, id: type.id || type._id }));
    },
    ...options,
  });
}
