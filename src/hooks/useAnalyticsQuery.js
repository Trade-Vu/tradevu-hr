import { useQuery } from '@tanstack/react-query';
import { analyticsApi } from '@/api';

export const ANALYTICS_KEYS = {
  all: ['analytics'],
  summary: () => [...ANALYTICS_KEYS.all, 'summary'],
  headcountDept: () => [...ANALYTICS_KEYS.all, 'headcount-dept'],
  headcountTrend: (months) => [...ANALYTICS_KEYS.all, 'headcount-trend', months],
  myDashboard: () => [...ANALYTICS_KEYS.all, 'my-dashboard'],
};

export function useHrSummary() {
  return useQuery({
    queryKey: ANALYTICS_KEYS.summary(),
    queryFn: () => analyticsApi.getHrSummary(),
    staleTime: 60 * 1000, // 1 minute
  });
}

export function useHeadcountByDepartment() {
  return useQuery({
    queryKey: ANALYTICS_KEYS.headcountDept(),
    queryFn: () => analyticsApi.getHeadcountByDepartment(),
    staleTime: 60 * 1000,
  });
}

export function useHeadcountTrend(months = 6) {
  return useQuery({
    queryKey: ANALYTICS_KEYS.headcountTrend(months),
    queryFn: () => analyticsApi.getHeadcountTrend(months),
    staleTime: 60 * 1000,
  });
}

export function useMyDashboard() {
  return useQuery({
    queryKey: ANALYTICS_KEYS.myDashboard(),
    queryFn: () => analyticsApi.getMyDashboard(),
    staleTime: 60 * 1000,
  });
}
