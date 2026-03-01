import { ConvexHttpClient } from 'convex/browser';
import { makeFunctionReference } from 'convex/server';

let convexClient: ConvexHttpClient | null = null;

function getConvexUrl() {
  const url = process.env.NEXT_PUBLIC_CONVEX_URL;
  if (!url) {
    throw new Error('NEXT_PUBLIC_CONVEX_URL is required for Better Auth + Convex integration.');
  }
  return url;
}

export function getAuthConvexClient() {
  if (convexClient) {
    return convexClient;
  }

  convexClient = new ConvexHttpClient(getConvexUrl());
  return convexClient;
}

export const authRefs = {
  authCreate: makeFunctionReference<'mutation'>('auth:create'),
  authFindOne: makeFunctionReference<'query'>('auth:findOne'),
  authFindMany: makeFunctionReference<'query'>('auth:findMany'),
  authCount: makeFunctionReference<'query'>('auth:count'),
  authUpdate: makeFunctionReference<'mutation'>('auth:update'),
  authUpdateMany: makeFunctionReference<'mutation'>('auth:updateMany'),
  authRemove: makeFunctionReference<'mutation'>('auth:remove'),
  authRemoveMany: makeFunctionReference<'mutation'>('auth:removeMany'),

  userByEmail: makeFunctionReference<'query'>('users:byEmail'),
  userByBetterAuthId: makeFunctionReference<'query'>('users:byBetterAuthId'),
  userUpsertFromAuth: makeFunctionReference<'mutation'>('users:upsertFromAuth'),
};
