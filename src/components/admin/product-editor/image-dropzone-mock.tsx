'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { ExternalLink, ImagePlus, Link2, Trash2, X } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';

type MockImagePreview = {
  id: string;
  name: string;
  previewUrl: string;
};

type ImageDropzoneMockProps = {
  imageUrls: string[];
  onAddUrl: (url: string) => void;
  onRemoveUrl: (index: number) => void;
};

function createPreviewId() {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }

  return `preview-${Math.random().toString(36).slice(2, 10)}`;
}

export function ImageDropzoneMock({ imageUrls, onAddUrl, onRemoveUrl }: ImageDropzoneMockProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const previewsRef = useRef<MockImagePreview[]>([]);
  const [mockPreviews, setMockPreviews] = useState<MockImagePreview[]>([]);
  const [urlInput, setUrlInput] = useState('');

  useEffect(() => {
    previewsRef.current = mockPreviews;
  }, [mockPreviews]);

  useEffect(() => {
    return () => {
      for (const preview of previewsRef.current) {
        URL.revokeObjectURL(preview.previewUrl);
      }
    };
  }, []);

  const pushFiles = useCallback((files: FileList) => {
    const entries = Array.from(files)
      .filter((file) => file.type.startsWith('image/'))
      .map((file) => ({
        id: createPreviewId(),
        name: file.name,
        previewUrl: URL.createObjectURL(file),
      }));

    if (entries.length === 0) return;
    setMockPreviews((prev) => [...prev, ...entries]);
  }, []);

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
        Local file drops are preview-only in this step. Add image URLs below to persist on save.
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
          <p className="text-xs font-medium text-muted-foreground">Saved image URLs</p>
          <div className="space-y-2">
            {imageUrls.map((url, index) => (
              <div
                key={`${url}-${index}`}
                className="flex items-center gap-2 rounded border border-border/60 bg-muted/20 px-2 py-1.5"
              >
                <a
                  href={url}
                  target="_blank"
                  rel="noreferrer"
                  className="line-clamp-1 flex-1 text-sm text-foreground hover:underline"
                >
                  {url}
                </a>
                <ExternalLink className="size-3.5 text-muted-foreground" />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="size-7"
                  onClick={() => onRemoveUrl(index)}
                >
                  <Trash2 className="size-4 text-muted-foreground" />
                  <span className="sr-only">Remove URL</span>
                </Button>
              </div>
            ))}
          </div>
        </div>
      ) : null}

      {mockPreviews.length > 0 ? (
        <div className="space-y-2 rounded-md border border-border/70 p-3">
          <p className="text-xs font-medium text-muted-foreground">Local previews (not persisted)</p>
          <div className="flex flex-wrap gap-2">
            {mockPreviews.map((preview) => (
              <div
                key={preview.id}
                className="group relative h-20 w-20 overflow-hidden rounded-md border border-border"
              >
                <img src={preview.previewUrl} alt={preview.name} className="h-full w-full object-cover" />
                <button
                  type="button"
                  onClick={() => {
                    setMockPreviews((prev) => {
                      const current = prev.find((entry) => entry.id === preview.id);
                      if (current) {
                        URL.revokeObjectURL(current.previewUrl);
                      }
                      return prev.filter((entry) => entry.id !== preview.id);
                    });
                  }}
                  className="absolute right-1 top-1 hidden size-5 cursor-pointer items-center justify-center rounded-full bg-background/90 text-foreground group-hover:flex"
                >
                  <X className="size-3" />
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
