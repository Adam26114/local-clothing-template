'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { ImagePlus, Link2, Upload, X } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card, CardAction, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { uploadProductImage } from '@/lib/storage';
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
  const [isUrlDialogOpen, setIsUrlDialogOpen] = useState(false);
  const [urlInput, setUrlInput] = useState('');
  const [isDragging, setIsDragging] = useState(false);

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
    (event: React.DragEvent<HTMLDivElement>) => {
      event.preventDefault();
      setIsDragging(false);
      if (!event.dataTransfer.files.length) return;
      pushFiles(event.dataTransfer.files);
    },
    [pushFiles]
  );

  const addImageUrl = useCallback(() => {
    const normalized = urlInput.trim();
    if (!normalized) return false;

    onAddUrl(normalized);
    setUrlInput('');
    return true;
  }, [onAddUrl, urlInput]);

  const handleUrlSubmit = useCallback(
    (event: React.FormEvent<HTMLFormElement>) => {
      event.preventDefault();

      if (addImageUrl()) {
        setIsUrlDialogOpen(false);
      }
    },
    [addImageUrl]
  );

  const uploadedCount = imageUrls.length;
  const pendingCount = mockPreviews.length;
  const hasImages = uploadedCount > 0 || pendingCount > 0;

  return (
    <Card className="gap-4 py-6">
      <CardHeader className="gap-2 pb-0">
        <CardTitle className="text-base">Product Images</CardTitle>
        <CardAction>
          <Button
            type="button"
            variant="link"
            size="sm"
            className="mt-0 h-auto rounded-md gap-1.5 p-0"
            onClick={() => setIsUrlDialogOpen(true)}
          >
            <span className="hidden lg:block">Add media from URL</span>
            <span className="block lg:hidden">Add URL</span>
          </Button>
        </CardAction>
      </CardHeader>

      <CardContent>
        <div className="flex flex-col gap-2">
          <div
            className="border-input data-[dragging=true]:bg-accent/50 has-[input:focus]:border-ring has-[input:focus]:ring-ring/50 relative flex min-h-52 flex-col items-center overflow-hidden rounded-xl border border-dashed p-4 transition-colors not-data-[files]:justify-center has-[input:focus]:ring-[3px]"
            data-dragging={isDragging || undefined}
            data-files={hasImages || undefined}
            onDrop={handleDrop}
            onDragEnter={() => setIsDragging(true)}
            onDragLeave={(event) => {
              const relatedTarget = event.relatedTarget as Node | null;
              if (relatedTarget && event.currentTarget.contains(relatedTarget)) {
                return;
              }
              setIsDragging(false);
            }}
            onDragOver={(event) => {
              event.preventDefault();
              setIsDragging(true);
            }}
          >
            <input
              ref={inputRef}
              type="file"
              accept="image/png,image/jpeg,image/jpg"
              multiple
              className="sr-only"
              aria-label="Upload image file"
              onChange={(event) => {
                if (!event.target.files) return;
                pushFiles(event.target.files);
                event.target.value = '';
              }}
            />

            {hasImages ? (
              <div className="flex w-full flex-col gap-3">
                <div className="flex items-center justify-between gap-2">
                  <h3 className="truncate text-sm font-medium">
                    {uploadedCount > 0
                      ? `Uploaded Files (${uploadedCount})`
                      : `Uploading Files (${pendingCount})`}
                  </h3>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => inputRef.current?.click()}
                  >
                    <Upload className="size-3.5 -ms-0.5 opacity-60" />
                    Add more
                  </Button>
                </div>

                <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
                  {imageUrls.map((url, index) => (
                    <div
                      key={`${url}-${index}`}
                      className="bg-accent relative aspect-square rounded-md border"
                    >
                      <img
                        src={url}
                        alt={`Product image ${index + 1}`}
                        className="size-full rounded-[inherit] object-cover"
                      />
                      <Button
                        type="button"
                        variant="default"
                        size="icon-xs"
                        onClick={() => onRemoveUrl(index)}
                        className="absolute -top-2 -right-2 size-6 rounded-full border-2 border-background shadow-none focus-visible:border-background"
                      >
                        <X className="size-3.5" />
                        <span className="sr-only">Remove image</span>
                      </Button>
                    </div>
                  ))}

                  {mockPreviews.map((preview) => (
                    <div
                      key={preview.id}
                      className="bg-accent relative aspect-square rounded-md border"
                    >
                      <img
                        src={preview.previewUrl}
                        alt={preview.name}
                        className="size-full rounded-[inherit] object-cover"
                      />
                      <div
                        className={cn(
                          'absolute inset-x-1 bottom-1 rounded px-1.5 py-0.5 text-center text-[10px] font-medium text-white',
                          preview.status === 'error' ? 'bg-red-500/90' : 'bg-black/60'
                        )}
                      >
                        {preview.status === 'uploading' ? 'Uploading' : preview.errorMessage ?? 'Upload failed'}
                      </div>
                      <Button
                        type="button"
                        variant="default"
                        size="icon-xs"
                        onClick={() => removePreview(preview.id)}
                        className="absolute -top-2 -right-2 size-6 rounded-full border-2 border-background shadow-none focus-visible:border-background"
                      >
                        <X className="size-3.5" />
                        <span className="sr-only">Remove local preview</span>
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => inputRef.current?.click()}
                className={cn(
                  'flex flex-col items-center justify-center px-4 py-3 text-center',
                  'hover:bg-accent/20'
                )}
              >
                <div
                  className="bg-background mb-2 flex size-11 shrink-0 items-center justify-center rounded-full border"
                  aria-hidden="true"
                >
                  <ImagePlus className="size-4 opacity-60" />
                </div>

                <div className="text-center">
                  <p className="mb-1.5 text-sm font-medium text-foreground">Drop your images here</p>
                  <p className="text-xs text-muted-foreground">PNG or JPG (max. 5MB)</p>
                </div>

                <span className="mt-4 inline-flex h-9 items-center justify-center gap-2 rounded-md border bg-background px-4 text-sm font-medium text-foreground shadow-xs hover:bg-accent hover:text-accent-foreground dark:bg-input/30 dark:border-input dark:hover:bg-input/50">
                  <Upload className="size-4 -ms-1 opacity-60" />
                  Select images
                </span>
              </button>
            )}
          </div>
        </div>

        <Dialog
          open={isUrlDialogOpen}
          onOpenChange={(open) => {
            setIsUrlDialogOpen(open);
            if (!open) {
              setUrlInput('');
            }
          }}
        >
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Add Media From URL</DialogTitle>
              <DialogDescription>
                Paste an image link to add it to this color variant.
              </DialogDescription>
            </DialogHeader>

            <form className="space-y-4" onSubmit={handleUrlSubmit}>
              <div className="relative">
                <Link2 className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  value={urlInput}
                  onChange={(event) => setUrlInput(event.target.value)}
                  placeholder="https://example.com/product-image.jpg"
                  className="pl-9"
                  autoFocus
                />
              </div>

              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setIsUrlDialogOpen(false);
                    setUrlInput('');
                  }}
                >
                  Cancel
                </Button>
                <Button type="submit" className="bg-black text-white hover:bg-zinc-800">
                  Add
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  );
}
