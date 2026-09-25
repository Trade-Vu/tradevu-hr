import { PAGE_ROUTES, getPageUrl } from '@/constants/pageRoutes';

export { PAGE_ROUTES, PAGE_LINKS, PAGE_URLS, ROUTES, getPageUrl } from '@/constants/pageRoutes';

export function createPageUrl(pageName: string) {
  if (!pageName) return '/';
  return getPageUrl(pageName);
}