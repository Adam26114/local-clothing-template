'use client';

import { useMemo, useState, useTransition } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Loader2, Plus } from 'lucide-react';
import { toast } from 'sonner';

import { createProductAction, updateProductAction } from '@/app/(admin)/admin/products/actions';
import { VariantCard } from '@/components/admin/product-editor/variant-card';
import {
  DEFAULT_VARIANT_ID,
  createFallbackVariant,
  orderSizes,
  sanitizeVariantForPersist,
} from '@/components/admin/product-editor/variant-helpers';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import type { Category, ColorVariant, Product, SizeKey, VariantMeasurement } from '@/lib/types';

type ProductEditorProps = {
  mode: 'create' | 'edit';
  productId?: string;
  initialProduct?: Product;
  categories: Category[];
};

function normalizeSlug(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-');
}

function hasAnyMeasurements(variant: ColorVariant) {
  const measurements = variant.measurements;
  if (!measurements) return false;

  return Object.values(measurements).some((sizeMeasurements) => {
    if (!sizeMeasurements) return false;
    return Object.values(sizeMeasurements).some((value) => typeof value === 'number' && value > 0);
  });
}

function cloneMeasurements(
  source: Partial<Record<SizeKey, VariantMeasurement>> | undefined,
  sizeFilter: SizeKey[]
): Partial<Record<SizeKey, VariantMeasurement>> | undefined {
  if (!source) return undefined;

  const result: Partial<Record<SizeKey, VariantMeasurement>> = {};

  for (const size of sizeFilter) {
    const row = source[size];
    if (!row) continue;

    const nextRow: VariantMeasurement = {};
    for (const [field, value] of Object.entries(row)) {
      if (typeof value !== 'number' || value <= 0) continue;
      nextRow[field as keyof VariantMeasurement] = value;
    }

    if (Object.keys(nextRow).length > 0) {
      result[size] = nextRow;
    }
  }

  return Object.keys(result).length > 0 ? result : undefined;
}

function prepareVariantForEditor(variant: ColorVariant): ColorVariant {
  const selectedSizes = orderSizes(
    variant.selectedSizes.length > 0 ? variant.selectedSizes : (Object.keys(variant.stock) as SizeKey[])
  );

  const withRequiredSize = selectedSizes.length > 0 ? selectedSizes : (['M'] as SizeKey[]);

  return sanitizeVariantForPersist({
    ...variant,
    id: variant.id || DEFAULT_VARIANT_ID,
    selectedSizes: withRequiredSize,
    stock:
      selectedSizes.length > 0
        ? variant.stock
        : {
            ...variant.stock,
            M: variant.stock.M ?? 0,
          },
  });
}

export function ProductEditor({ mode, productId, initialProduct, categories }: ProductEditorProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const sourceProduct = useMemo(() => {
    if (mode === 'edit' && initialProduct) {
      return initialProduct;
    }

    return undefined;
  }, [initialProduct, mode]);

  const initialVariants = useMemo<ColorVariant[]>(() => {
    if (sourceProduct?.colorVariants?.length) {
      return sourceProduct.colorVariants.map((variant) => prepareVariantForEditor(variant));
    }

    return [createFallbackVariant(DEFAULT_VARIANT_ID)];
  }, [sourceProduct]);

  const [form, setForm] = useState<Product>(() => {
    if (sourceProduct) {
      return {
        ...sourceProduct,
        colorVariants: initialVariants,
      };
    }

      return {
        _id: 'draft',
        sku: '',
        name: '',
        slug: '',
        description: '',
        categoryId: '',
        basePrice: 0,
        salePrice: undefined,
        isFeatured: false,
      isPublished: true,
      colorVariants: initialVariants,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };
  });

  const [expandedVariantId, setExpandedVariantId] = useState<string | null>(
    initialVariants[0]?.id ?? null
  );
  const [tagsInput, setTagsInput] = useState('');
  const [imageUploadStateByVariant, setImageUploadStateByVariant] = useState<
    Record<string, { pending: number; failed: number }>
  >({});

  const imageUploadSummary = useMemo(() => {
    return Object.values(imageUploadStateByVariant).reduce(
      (summary, state) => {
        summary.pending += state.pending;
        summary.failed += state.failed;
        return summary;
      },
      { pending: 0, failed: 0 }
    );
  }, [imageUploadStateByVariant]);

  const autoSlug = useMemo(() => {
    const base = form.name.trim() || form.slug.trim() || 'product';
    return normalizeSlug(base);
  }, [form.name, form.slug]);

  const addVariant = () => {
    const nextVariant = createFallbackVariant();
    setForm((prev) => ({
      ...prev,
      colorVariants: [...prev.colorVariants, nextVariant],
    }));
    setExpandedVariantId(nextVariant.id);
  };

  const removeVariant = (variantId: string) => {
    if (form.colorVariants.length <= 1) {
      toast.error('At least one color variant is required.');
      return;
    }

    const nextVariants = form.colorVariants.filter((variant) => variant.id !== variantId);
    setForm((prev) => ({
      ...prev,
      colorVariants: nextVariants,
    }));
    setImageUploadStateByVariant((prev) => {
      const next = { ...prev };
      delete next[variantId];
      return next;
    });

    if (expandedVariantId === variantId) {
      setExpandedVariantId(nextVariants[0]?.id ?? null);
    }
  };

  const updateVariant = (nextVariant: ColorVariant) => {
    setForm((prev) => ({
      ...prev,
      colorVariants: prev.colorVariants.map((variant) =>
        variant.id === nextVariant.id ? nextVariant : variant
      ),
    }));
  };

  const addVariantImage = (variantId: string, url: string) => {
    setForm((prev) => ({
      ...prev,
      colorVariants: prev.colorVariants.map((variant) =>
        variant.id === variantId
          ? {
              ...variant,
              images: [...variant.images, url],
            }
          : variant
      ),
    }));
  };

  const removeVariantImage = (variantId: string, indexToRemove: number) => {
    setForm((prev) => ({
      ...prev,
      colorVariants: prev.colorVariants.map((variant) =>
        variant.id === variantId
          ? {
              ...variant,
              images: variant.images.filter((_, index) => index !== indexToRemove),
            }
          : variant
      ),
    }));
  };

  const copyVariantMeasurements = (targetVariantId: string, sourceVariantId: string) => {
    const sourceVariant = form.colorVariants.find((variant) => variant.id === sourceVariantId);
    const targetVariant = form.colorVariants.find((variant) => variant.id === targetVariantId);

    if (!sourceVariant || !targetVariant) return;

    const copied = cloneMeasurements(sourceVariant.measurements, targetVariant.selectedSizes);

    if (!copied) {
      toast.warning('No measurements to copy for selected target sizes.');
      return;
    }

    setForm((prev) => ({
      ...prev,
      colorVariants: prev.colorVariants.map((variant) =>
        variant.id === targetVariantId
          ? {
              ...variant,
              measurements: copied,
            }
          : variant
      ),
    }));

    toast.success('Measurements copied.');
  };

  const saveProduct = () => {
    if (!form.name.trim()) {
      toast.error('Product name is required.');
      return;
    }

    if (!form.categoryId) {
      toast.error('Category is required.');
      return;
    }

    if (form.colorVariants.length === 0) {
      toast.error('At least one color variant is required.');
      return;
    }

    const sanitizedVariants = form.colorVariants.map((variant) => sanitizeVariantForPersist(variant));

    if (sanitizedVariants.length === 0) {
      toast.error('At least one valid color variant is required.');
      return;
    }

    if (imageUploadSummary.pending > 0) {
      toast.error('Please wait for all image uploads to finish.');
      return;
    }

    if (imageUploadSummary.failed > 0) {
      toast.error('Fix or remove failed image uploads before saving.');
      return;
    }

    startTransition(async () => {
      const payload = {
        sku: undefined,
        name: form.name.trim(),
        slug: autoSlug,
        description: form.description.trim(),
        categoryId: form.categoryId,
        basePrice: Number(form.basePrice) || 0,
        salePrice: form.salePrice && form.salePrice > 0 ? Number(form.salePrice) : undefined,
        isFeatured: form.isFeatured,
        isPublished: form.isPublished,
        colorVariants: sanitizedVariants,
      };

      const result =
        mode === 'create'
          ? await createProductAction(payload)
          : await updateProductAction(productId ?? form._id, payload);

      if (!result.ok) {
        toast.error(result.error);
        return;
      }

      toast.success(mode === 'create' ? 'Product created.' : 'Product updated.');

      if (mode === 'create') {
        router.push('/admin/products');
      } else {
        setForm({
          ...result.data,
          colorVariants: result.data.colorVariants.map((variant) => prepareVariantForEditor(variant)),
        });
      }
      router.refresh();
    });
  };

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <Label>Name</Label>
          <Input
            value={form.name}
            onChange={(event) => setForm((prev) => ({ ...prev, name: event.target.value }))}
          />
        </div>
        <div className="space-y-2">
          <Label>Slug</Label>
          <Input
            value={autoSlug}
            readOnly
            className="bg-muted/40 text-muted-foreground"
          />
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <div className="flex items-center justify-between gap-2">
            <Label>Categories</Label>
            <Link
              href="/admin/categories"
              className="text-xs font-medium text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
            >
              Manage categories
            </Link>
          </div>
          <Select
            value={form.categoryId || undefined}
            onValueChange={(value) => setForm((prev) => ({ ...prev, categoryId: value }))}
            disabled={categories.length === 0}
          >
            <SelectTrigger className="w-full">
              <SelectValue placeholder={categories.length === 0 ? 'No categories available' : 'Select Category'} />
            </SelectTrigger>
            <SelectContent>
              <SelectGroup>
                <SelectLabel>Categories</SelectLabel>
                {categories.map((category) => (
                  <SelectItem key={category._id} value={category._id}>
                    {category.name}
                    {category.isActive ? '' : ' (inactive)'}
                  </SelectItem>
                ))}
              </SelectGroup>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label>Tags</Label>
          <Input
            value={tagsInput}
            onChange={(event) => setTagsInput(event.target.value)}
            placeholder="cloth, anime, soft"
          />
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <Label>Base Price (ks)</Label>
          <Input
            type="number"
            value={form.basePrice ?? 0}
            onChange={(event) => {
              const raw = Number(event.target.value);
              setForm((prev) => ({
                ...prev,
                basePrice: Number.isFinite(raw) && raw > 0 ? Math.floor(raw) : 0,
              }));
            }}
          />
        </div>
        <div className="space-y-2">
          <Label>Sale Price (ks)</Label>
          <Input
            type="number"
            value={form.salePrice ?? ''}
            onChange={(event) => {
              const raw = event.target.value;
              if (!raw) {
                setForm((prev) => ({ ...prev, salePrice: undefined }));
                return;
              }

              const parsed = Number(raw);
              setForm((prev) => ({
                ...prev,
                salePrice: Number.isFinite(parsed) && parsed > 0 ? Math.floor(parsed) : undefined,
              }));
            }}
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label>Description</Label>
        <Textarea
          rows={5}
          value={form.description}
          onChange={(event) => setForm((prev) => ({ ...prev, description: event.target.value }))}
          placeholder="Write product description..."
        />
      </div>

      <div className="flex flex-wrap gap-6">
        <label className="flex items-center gap-2 text-sm">
          <Switch
            checked={form.isPublished}
            onCheckedChange={(checked) => setForm((prev) => ({ ...prev, isPublished: checked }))}
          />
          Published
        </label>
        <label className="flex items-center gap-2 text-sm">
          <Switch
            checked={form.isFeatured}
            onCheckedChange={(checked) => setForm((prev) => ({ ...prev, isFeatured: checked }))}
          />
          Featured
        </label>
      </div>

      <section className="space-y-4 rounded-lg border p-4">
        <div className="flex items-center gap-2">
          <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Color Variants
          </h2>
          <Badge variant="secondary">{form.colorVariants.length}</Badge>
        </div>

        <div className="space-y-3">
          {form.colorVariants.map((variant, index) => (
            <VariantCard
              key={variant.id}
              variant={variant}
              index={index}
              isOpen={expandedVariantId === variant.id}
              canRemove={form.colorVariants.length > 1}
              copySourceVariants={form.colorVariants
                .filter((entry) => entry.id !== variant.id && hasAnyMeasurements(entry))
                .map((entry) => ({ id: entry.id, colorName: entry.colorName }))}
              onToggleOpen={() =>
                setExpandedVariantId((prev) => (prev === variant.id ? null : variant.id))
              }
              onUpdate={updateVariant}
              onRemove={() => removeVariant(variant.id)}
              onCopyMeasurements={(sourceVariantId) =>
                copyVariantMeasurements(variant.id, sourceVariantId)
              }
              onUploadStateChange={(state) =>
                setImageUploadStateByVariant((prev) => ({
                  ...prev,
                  [variant.id]: state,
                }))
              }
              onAddImageUrl={(url) => addVariantImage(variant.id, url)}
              onRemoveImageUrl={(index) => removeVariantImage(variant.id, index)}
            />
          ))}
        </div>

        <Button type="button" variant="outline" className="w-full border-dashed" onClick={addVariant}>
          <Plus className="size-4" />
          Add Color Variant
        </Button>
      </section>

      <div className="flex justify-end gap-2">
        <Button
          className="bg-black text-white hover:bg-zinc-800"
          disabled={isPending || imageUploadSummary.pending > 0 || imageUploadSummary.failed > 0}
          onClick={saveProduct}
        >
          {isPending ? <Loader2 className="size-4 animate-spin" /> : null}
          {mode === 'create' ? 'Create Product' : 'Update Product'}
        </Button>
      </div>
    </div>
  );
}
