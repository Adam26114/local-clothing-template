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

function delay(ms: number) {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

async function waitForImageToBeReady(url: string, timeoutMs = 15000) {
  const startedAt = Date.now();

  while (Date.now() - startedAt < timeoutMs) {
    const loaded = await new Promise<boolean>((resolve) => {
      const image = new Image();
      let settled = false;

      const finish = (value: boolean) => {
        if (settled) return;
        settled = true;
        window.clearTimeout(timerId);
        resolve(value);
      };

      const timerId = window.setTimeout(() => finish(false), 2500);

      image.onload = () => finish(true);
      image.onerror = () => finish(false);
      image.src = `${url}${url.includes('?') ? '&' : '?'}cb=${Date.now()}`;
    });

    if (loaded) {
      return;
    }

    await delay(400);
  }

  throw new Error('Uploaded image is taking too long to become available.');
}

async function resolveUploadedImageUrl(client: ConvexHttpClient, storageId: string) {
  const url = await client.query(refs.resolveImageUrl, {
    storageId,
  });

  if (!url) {
    return null;
  }

  try {
    await waitForImageToBeReady(url);
    return url;
  } catch {
    return null;
  }
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

  const resolvedUrl = await resolveUploadedImageUrl(client, uploadResult.storageId);
  if (!resolvedUrl) {
    throw new Error('Unable to resolve uploaded image URL.');
  }

  return {
    storageId: uploadResult.storageId,
    url: resolvedUrl,
  };
}