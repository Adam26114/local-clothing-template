'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { ImagePlus, Link2, Trash2, X } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { uploadProductImage } from '@/lib/product-image-storage';
import { cn } from '@/lib/utils';

type MockImagePreview = {
  id: string;
  name: string;
  previewUrl: string;
  file: File;
  status: 'uploading' | 'error';
  errorMessage?: string;
};

type UploadState = {
  pending: number;
  failed: number;
};

type ImageDropzoneMockProps = {
  imageUrls: string[];
  onAddUrl: (url: string) => void;
  onRemoveUrl: (index: number) => void;
  onUploadStateChange?: (state: UploadState) => void;
};

function createPreviewId() {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }

  return `preview-${Math.random().toString(36).slice(2, 10)}`;
}

function getErrorMessage(error: unknown) {
  if (error instanceof Error) {
    return error.message;
  }

  return 'Failed to upload image.';
}

export function ImageDropzoneMock({
  imageUrls,
  onAddUrl,
  onRemoveUrl,
  onUploadStateChange,
}: ImageDropzoneMockProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const isMountedRef = useRef(true);
  const previewsRef = useRef<MockImagePreview[]>([]);
  const removedIdsRef = useRef<Set<string>>(new Set());
  const uploadStateCallbackRef = useRef<ImageDropzoneMockProps['onUploadStateChange']>(undefined);
  const [mockPreviews, setMockPreviews] = useState<MockImagePreview[]>([]);
  const [urlInput, setUrlInput] = useState('');

  useEffect(() => {
    previewsRef.current = mockPreviews;
  }, [mockPreviews]);

  useEffect(() => {
    uploadStateCallbackRef.current = onUploadStateChange;
  }, [onUploadStateChange]);

  useEffect(() => {
    uploadStateCallbackRef.current?.({
      pending: mockPreviews.filter((preview) => preview.status === 'uploading').length,
      failed: mockPreviews.filter((preview) => preview.status === 'error').length,
    });
  }, [mockPreviews]);

  useEffect(() => {
    return () => {
      isMountedRef.current = false;
      for (const preview of previewsRef.current) {
        URL.revokeObjectURL(preview.previewUrl);
      }
    };
  }, []);

  const removePreview = useCallback((id: string) => {
    removedIdsRef.current.add(id);

    setMockPreviews((prev) => {
      const current = prev.find((entry) => entry.id === id);
      if (current) {
        URL.revokeObjectURL(current.previewUrl);
      }
      return prev.filter((entry) => entry.id !== id);
    });
  }, []);

  const handleFile = useCallback(
    async (id: string, file: File) => {
      try {
        const result = await uploadProductImage(file);

        if (!isMountedRef.current || removedIdsRef.current.has(id)) {
          return;
        }

        onAddUrl(result.url);
        removePreview(id);
      } catch (error) {
        if (!isMountedRef.current || removedIdsRef.current.has(id)) {
          return;
        }

        setMockPreviews((prev) =>
          prev.map((entry) =>
            entry.id === id
              ? {
                  ...entry,
                  status: 'error',
                  errorMessage: getErrorMessage(error),
                }
              : entry
          )
        );
      }
    },
    [onAddUrl, removePreview]
  );

  const pushFiles = useCallback(
    (files: FileList) => {
      const entries = Array.from(files)
        .filter((file) => file.type.startsWith('image/'))
        .map((file) => ({
          id: createPreviewId(),
          name: file.name,
          previewUrl: URL.createObjectURL(file),
          file,
          status: 'uploading' as const,
        }));

      if (entries.length === 0) return;
      setMockPreviews((prev) => [...prev, ...entries]);

      for (const entry of entries) {
        void handleFile(entry.id, entry.file);
      }
    },
    [handleFile]
  );

  const handleDrop = useCallback(
    (event: React.DragEvent<HTMLButtonElement>) => {
      event.preventDefault();
      if (!event.dataTransfer.files.length) return;
      pushFiles(event.dataTransfer.files);
    },
    [pushFiles]
  );

  const addImageUrl = useCallback(() => {
    const normalized = urlInput.trim();
    if (!normalized) return;

    onAddUrl(normalized);
    setUrlInput('');
  }, [onAddUrl, urlInput]);

  return (
    <div className="space-y-3">
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        onDrop={handleDrop}
        onDragOver={(event) => event.preventDefault()}
        className={cn(
          'flex w-full flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed border-border/70 px-5 py-8 transition-colors',
          'hover:border-primary/40 hover:bg-accent/40'
        )}
      >
        <ImagePlus className="size-8 text-muted-foreground" />
        <div className="text-center">
          <p className="text-base font-medium text-foreground/90">Drop images here</p>
          <p className="text-sm text-muted-foreground">or click to browse</p>
        </div>
      </button>

      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        multiple
        className="sr-only"
        onChange={(event) => {
          if (!event.target.files) return;
          pushFiles(event.target.files);
          event.target.value = '';
        }}
      />

      <p className="text-xs text-muted-foreground">
        Local image files upload to Convex automatically. Add image URLs below to save external
        images.
      </p>

      <div className="flex flex-col gap-2 sm:flex-row">
        <div className="relative flex-1">
          <Link2 className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={urlInput}
            onChange={(event) => setUrlInput(event.target.value)}
            placeholder="https://example.com/product-image.jpg"
            className="pl-9"
            onKeyDown={(event) => {
              if (event.key !== 'Enter') return;
              event.preventDefault();
              addImageUrl();
            }}
          />
        </div>
        <Button type="button" variant="outline" onClick={addImageUrl}>
          Add URL
        </Button>
      </div>

      {imageUrls.length > 0 ? (
        <div className="space-y-2 rounded-md border border-border/70 p-3">
          <p className="text-xs font-medium text-muted-foreground">Saved images</p>
          <div className="flex flex-wrap gap-2">
            {imageUrls.map((url, index) => (
              <div
                key={`${url}-${index}`}
                className="group relative h-24 w-24 overflow-hidden rounded-md border border-border/60 bg-muted/10 sm:h-28 sm:w-28"
              >
                <img
                  src={url}
                  alt={`Saved product image ${index + 1}`}
                  className="aspect-square h-full w-full object-cover"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="absolute right-1 top-1 hidden size-6 bg-red-600 text-white shadow-sm hover:bg-red-700 group-hover:flex"
                  onClick={() => onRemoveUrl(index)}
                >
                  <Trash2 className="size-4 text-white" />
                  <span className="sr-only">Remove image</span>
                </Button>
              </div>
            ))}
          </div>
        </div>
      ) : null}

      {mockPreviews.length > 0 ? (
        <div className="space-y-2 rounded-md border border-border/70 p-3">
          <p className="text-xs font-medium text-muted-foreground">Local previews</p>
          <div className="flex flex-wrap gap-2">
            {mockPreviews.map((preview) => (
              <div
                key={preview.id}
                className="group relative h-20 w-20 overflow-hidden rounded-md border border-border"
              >
                <img src={preview.previewUrl} alt={preview.name} className="h-full w-full object-cover" />
                <div
                  className={cn(
                    'absolute inset-x-1 bottom-1 rounded px-1.5 py-0.5 text-center text-[10px] font-medium text-white',
                    preview.status === 'error' ? 'bg-red-500/90' : 'bg-black/60'
                  )}
                >
                  {preview.status === 'uploading' ? 'Uploading' : preview.errorMessage ?? 'Upload failed'}
                </div>
                <button
                  type="button"
                  onClick={() => removePreview(preview.id)}
                  className="absolute right-1 top-1 hidden size-5 cursor-pointer items-center justify-center rounded-full bg-red-600 text-white hover:bg-red-700 group-hover:flex"
                >
                  <X className="size-3 text-white" />
                  <span className="sr-only">Remove local preview</span>
                </button>
              </div>
            ))}
          </div>
        </div>
      ) : null}
    </div>
  );
}
