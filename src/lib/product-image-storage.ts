'use client';

import { ConvexHttpClient } from 'convex/browser';
import { makeFunctionReference } from 'convex/server';

type UploadResponse = {
  storageId?: string;
};

const refs = {
  generateUploadUrl: makeFunctionReference<'mutation'>('products:generateUploadUrl'),
  resolveImageUrl: makeFunctionReference<'query'>('products:resolveImageUrl'),
};

let convexClient: ConvexHttpClient | null = null;

function getConvexClient() {
  if (convexClient) {
    return convexClient;
  }

  const url = process.env.NEXT_PUBLIC_CONVEX_URL;
  if (!url) {
    throw new Error('NEXT_PUBLIC_CONVEX_URL is required for product image uploads.');
  }

  convexClient = new ConvexHttpClient(url);
  return convexClient;
}

export async function uploadProductImage(file: File): Promise<{ storageId: string; url: string }> {
  const client = getConvexClient();
  const uploadUrl = await client.mutation(refs.generateUploadUrl, {});

  const uploadResponse = await fetch(uploadUrl, {
    method: 'POST',
    body: file,
  });

  if (!uploadResponse.ok) {
    throw new Error(await uploadResponse.text());
  }

  const uploadResult = (await uploadResponse.json()) as UploadResponse;
  if (!uploadResult.storageId) {
    throw new Error('Convex did not return a storage ID for the uploaded image.');
  }

  const url = await client.query(refs.resolveImageUrl, {
    storageId: uploadResult.storageId,
  });

  if (!url) {
    throw new Error('Unable to resolve uploaded image URL.');
  }

  return {
    storageId: uploadResult.storageId,
    url,
  };
}
