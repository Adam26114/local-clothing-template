import { toNextJsHandler } from 'better-auth/next-js';

import { auth } from '@/lib/auth/better-auth';

export const { GET, POST, PATCH, PUT, DELETE } = toNextJsHandler(auth);
