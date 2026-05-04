'use client';

import { useEffect, useMemo, useState, useTransition } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Loader2, Plus } from 'lucide-react';
import { toast } from 'sonner';

import { createProductAction, updateProductAction } from '@/app/(admin)/admin/products/actions';
import { VariantCard } from '@/components/admin/product-editor/variant-card';
import {
  DEFAULT_VARIANT_ID,
  createFallbackVariant,
} from '@/components/admin/product-editor/variant-helpers';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
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
import type { Category, ColorVariant, Product, ProductStatus } from '@/lib/types';
import { normalizeSlug } from '@/lib/utils/slug';
import { deriveProductStatus, PRODUCT_STATUS_DOT_CLASSES, PRODUCT_STATUS_LABELS } from '@/lib/utils/product-visibility';
import {
  buildProductUpsertInput,
  cloneMeasurements,
  formatDateTimeLocal,
  hasAnyMeasurements,
  parseDateTimeLocal,
  prepareVariantForEditor,
  serializeProductUpsertInput,
} from './product-editor/product-editor-utils';

type ProductEditorProps = {
  mode: 'create' | 'edit';
  productId?: string;
  initialProduct?: Product;
  categories: Category[];
};

const STATUS_VALUES = ['draft', 'pending', 'private', 'scheduled', 'published'] as const;

const STATUS_OPTIONS: Array<{
  value: ProductStatus;
  label: string;
}> = STATUS_VALUES.map((status) => ({
  value: status,
  label: PRODUCT_STATUS_LABELS[status],
}));

export function ProductEditor({ mode, productId, initialProduct, categories }: ProductEditorProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [saveAction, setSaveAction] = useState<'save' | 'publish' | null>(null);

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

  const sourceStatus = sourceProduct ? deriveProductStatus(sourceProduct) : 'draft';

  const initialForm = useMemo<Product>(() => {
    if (sourceProduct) {
      return {
        ...sourceProduct,
        sku: sourceProduct.sku ?? '',
        status: sourceStatus,
        publishAt: sourceProduct.publishAt,
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
      status: 'draft',
      publishAt: undefined,
      isPublished: false,
      colorVariants: initialVariants,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };
  }, [initialVariants, sourceProduct, sourceStatus]);

  const [form, setForm] = useState<Product>(() => initialForm);
  const [baselineSnapshot, setBaselineSnapshot] = useState(() =>
    serializeProductUpsertInput(initialForm)
  );

  useEffect(() => {
    setForm(initialForm);
    setBaselineSnapshot(serializeProductUpsertInput(initialForm));
  }, [initialForm]);

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

  const currentSnapshot = useMemo(() => serializeProductUpsertInput(form), [form]);
  const isDirty = currentSnapshot !== baselineSnapshot;

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

  const saveProduct = (options?: { forcePublish?: boolean }) => {
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

    if (imageUploadSummary.pending > 0) {
      toast.error('Please wait for all image uploads to finish.');
      return;
    }

    if (imageUploadSummary.failed > 0) {
      toast.error('Fix or remove failed image uploads before saving.');
      return;
    }

    const nextPayload = buildProductUpsertInput(form, {
      forcePublish: options?.forcePublish,
    });

    if (nextPayload.status === 'scheduled' && !nextPayload.publishAt) {
      toast.error('Scheduled products need a publish date.');
      return;
    }

    setSaveAction(options?.forcePublish ? 'publish' : 'save');
    startTransition(async () => {
      try {
        const result =
          mode === 'create'
            ? await createProductAction(nextPayload)
            : await updateProductAction(productId ?? form._id, nextPayload);

        if (!result.ok) {
          toast.error(result.error);
          return;
        }

        setBaselineSnapshot(serializeProductUpsertInput(result.data));
        toast.success(mode === 'create' ? 'Product created.' : 'Product updated.');

        window.location.assign('/admin/products');
      } finally {
        setSaveAction(null);
      }
    });
  };

  const isSaving = isPending || imageUploadSummary.pending > 0 || imageUploadSummary.failed > 0;
  const canSubmit = isDirty && !isSaving;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex items-start gap-3">
          <Button asChild variant="outline" size="icon" className="shrink-0">
            <Link href="/admin/products">
              <ArrowLeft className="size-4" />
              <span className="sr-only">Back to products</span>
            </Link>
          </Button>
          <div className="space-y-1">
            <h1 className="text-3xl font-semibold tracking-tight">
              {mode === 'create' ? 'Add Product' : 'Edit Product'}
            </h1>
            <p className="text-sm text-muted-foreground">
              {mode === 'create'
                ? 'Create a new item with variants, stock, and pricing.'
                : 'Update product details, media, variants, and stock mapping.'}
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {isDirty ? (
            <Badge variant="secondary" className="border-dashed">
              Unsaved changes
            </Badge>
          ) : null}
          <Button
            type="button"
            variant="outline"
            onClick={() => router.push('/admin/products')}
            disabled={isSaving}
          >
            Discard
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={() => saveProduct()}
            disabled={!canSubmit}
          >
            {saveAction === 'save' ? <Loader2 className="size-4 animate-spin" /> : null}
            Save Changes
          </Button>
          <Button
            type="button"
            className="bg-black text-white hover:bg-zinc-800"
            onClick={() => saveProduct({ forcePublish: true })}
            disabled={!canSubmit}
          >
            {saveAction === 'publish' ? <Loader2 className="size-4 animate-spin" /> : null}
            Publish Now
          </Button>
        </div>
      </div>

      <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_364px] xl:items-start">
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Product Details</CardTitle>
              <CardDescription>Core product identity and description.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="product-name">Name</Label>
                <Input
                  id="product-name"
                  value={form.name}
                  onChange={(event) => setForm((prev) => ({ ...prev, name: event.target.value }))}
                />
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="product-sku">SKU</Label>
                  <Input
                    id="product-sku"
                    value={form.sku}
                    onChange={(event) => setForm((prev) => ({ ...prev, sku: event.target.value }))}
                    placeholder="e.g. HNLY-001"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="product-slug">Slug</Label>
                  <Input
                    id="product-slug"
                    value={autoSlug}
                    readOnly
                    className="bg-muted/40 text-muted-foreground"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="product-tags">Tags</Label>
                <Input
                  id="product-tags"
                  value={tagsInput}
                  onChange={(event) => setTagsInput(event.target.value)}
                  placeholder="cloth, anime, soft"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="product-description">Description</Label>
                <Textarea
                  id="product-description"
                  rows={5}
                  value={form.description}
                  onChange={(event) =>
                    setForm((prev) => ({ ...prev, description: event.target.value }))
                  }
                  placeholder="Write product description..."
                />
              </div>
            </CardContent>
          </Card>

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

        </div>

        <div className="space-y-4 xl:sticky xl:top-6 xl:self-start">
          <Card>
            <CardHeader className="gap-2 pb-0">
              <CardTitle>Pricing</CardTitle>
              <CardDescription>Base and sale pricing for this product.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="grid gap-2">
                  <Label htmlFor="product-base-price">Base Price (ks)</Label>
                  <Input
                    id="product-base-price"
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
                <div className="grid gap-2">
                  <Label htmlFor="product-sale-price">Sale Price (ks)</Label>
                  <Input
                    id="product-sale-price"
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
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Status</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-2">
                <Select
                  value={form.status}
                  onValueChange={(value) =>
                    setForm((prev) => ({
                      ...prev,
                      status: value as ProductStatus,
                    }))
                  }
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Draft" />
                  </SelectTrigger>
                  <SelectContent className="w-[320px]" align="start">
                    {STATUS_OPTIONS.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        <div className="flex items-center gap-2">
                          <span
                            className={`size-2 rounded-full ${PRODUCT_STATUS_DOT_CLASSES[option.value]}`}
                          />
                          <span className="font-medium">{option.label}</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-sm text-muted-foreground">Set the product status.</p>
              </div>

              {form.status === 'scheduled' ? (
                <div className="grid gap-2">
                  <Label htmlFor="product-publish-at">Publish date</Label>
                  <Input
                    id="product-publish-at"
                    type="datetime-local"
                    value={formatDateTimeLocal(form.publishAt)}
                    onChange={(event) =>
                      setForm((prev) => ({ ...prev, publishAt: parseDateTimeLocal(event.target.value) }))
                    }
                  />
                  <p className="text-xs text-muted-foreground">
                    Scheduled products will go live automatically at this time.
                  </p>
                </div>
              ) : null}

              <Separator />

              <label className="flex items-center gap-3 text-sm">
                <Switch
                  checked={form.isFeatured}
                  onCheckedChange={(checked) =>
                    setForm((prev) => ({ ...prev, isFeatured: checked }))
                  }
                />
                Featured
              </label>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <div className="flex items-center justify-between gap-3">
                <div>
                  <CardTitle>Categories</CardTitle>
                  <CardDescription>Choose where this product lives.</CardDescription>
                </div>
                <Link
                  href="/admin/categories"
                  className="text-xs font-medium text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
                >
                  Manage categories
                </Link>
              </div>
            </CardHeader>
            <CardContent>
              <Select
                value={form.categoryId || undefined}
                onValueChange={(value) => setForm((prev) => ({ ...prev, categoryId: value }))}
                disabled={categories.length === 0}
              >
                <SelectTrigger className="w-full">
                  <SelectValue
                    placeholder={categories.length === 0 ? 'No categories available' : 'Select Category'}
                  />
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
            </CardContent>
          </Card>
        </div>
      </div>

    </div>
  );
}
