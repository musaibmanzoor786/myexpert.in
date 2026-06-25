
import { servicesList } from '@/lib/constants';
import { safeStringify } from '@/lib/utils';
import type { Service } from '@/lib/types';

const CACHE_KEY = 'cached_services';
const EXPIRY_TIME = 24 * 60 * 60 * 1000; // 24 hours

export const getCachedServices = (): Service[] => {
    return servicesList;
};
