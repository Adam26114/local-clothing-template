"use client";

import { useCallback, useRef } from "react";
import { ImagePlus, X } from "lucide-react";
import { cn } from "@/lib/utils";
import type { ImageFile } from "@/lib/product-types";

interface ImageDropzoneProps {
  images: ImageFile[];
  onAdd: (files: ImageFile[]) => void;
  onRemove: (id: string) => void;
}

export function ImageDropzone({ images, onAdd, onRemove }: ImageDropzoneProps) {
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFiles = useCallback(
    (fileList: FileList) => {
      const newImages: ImageFile[] = Array.from(fileList)
        .filter((f) => f.type.startsWith("image/"))
        .map((file) => ({
          id: crypto.randomUUID(),
          file,
          preview: URL.createObjectURL(file),
          label: file.name,
        }));
      if (newImages.length > 0) onAdd(newImages);
    },
    [onAdd]
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      if (e.dataTransfer.files.length > 0) {
        handleFiles(e.dataTransfer.files);
      }
    },
    [handleFiles]
  );

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
  }, []);

  return (
    <div className="flex flex-col gap-3">
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        className={cn(
          "flex flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed border-border/60 px-6 py-8",
          "cursor-pointer transition-colors hover:border-primary/50 hover:bg-primary/5",
          "text-muted-foreground"
        )}
      >
        <ImagePlus className="size-8 opacity-50" />
        <div className="text-center">
          <span className="text-sm font-medium text-foreground/80">
            Drop images here
          </span>
          <p className="mt-0.5 text-xs text-muted-foreground">
            or click to browse
          </p>
        </div>
      </button>

      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        multiple
        className="sr-only"
        onChange={(e) => {
          if (e.target.files) handleFiles(e.target.files);
          e.target.value = "";
        }}
      />

      {/* Preview Section */}
      {images.length > 0 && (
        <div className="flex flex-wrap gap-3">
          {images.map((img) => (
            <div
              key={img.id}
              className="group relative h-24 w-24 shrink-0 overflow-hidden rounded-md border border-border bg-secondary [transform:translateZ(0)]"
            >
              {/* Image */}
              <img
                src={img.preview}
                alt={img.label}
                className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
              />

              {/* Remove Button */}
              <button
                type="button"
                onClick={() => onRemove(img.id)}
                className="absolute right-1 top-1 flex h-5 w-5 items-center justify-center rounded-full bg-background/80 text-foreground opacity-0 backdrop-blur-sm transition-opacity group-hover:opacity-100"
              >
                <X className="h-3 w-3" />
                <span className="sr-only">Remove image</span>
              </button>

              {/* Image Label Overlay */}
              <div className="absolute inset-x-0 bottom-0  bg-background/80 px-1.5 py-0.5  transition-transform duration-300 translate-y-full group-hover:translate-y-0">
                <p className="truncate text-[10px] text-foreground font-medium">
                  {img.label}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}