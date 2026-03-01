import type { Role } from '@/lib/types';

export type AuthIdentity = {
  id: string;
  email: string;
  name: string;
};

export type AuthSession = {
  session: {
    id: string;
    userId: string;
    token: string;
    expiresAt: Date;
    createdAt: Date;
    updatedAt: Date;
  };
  user: AuthIdentity;
};

export type RoleSyncResult = {
  role: Role;
  betterAuthId: string;
  userId: string;
};
