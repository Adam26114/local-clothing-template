"use client";

import { useState } from "react";
import { z } from "zod";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/../convex/_generated/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { RichTextEditor } from "@/components/admin/rich-text-editor";
import { Skeleton } from "@/components/ui/skeleton";
import { Switch } from "@/components/ui/switch";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Field, FieldDescription, FieldLabel } from "@/components/ui/field";
import { Eye, EyeOff, Pencil, Plus, Package, Trash2 } from "lucide-react";
import { AdminDataTable, type AdminTableColumn } from "@/components/admin/data-table";
import { notify } from "@/lib/notifications";
import { type FormErrors, zodToFormErrors } from "@/lib/zod-errors";
import { createEmptyColorVariant, type ColorVariant } from "@/lib/product-types";
import { VariantCard } from "@/components/admin/variant-card";

interface Product {
  _id: string;
  name: string;
  slug: string;
  description: string;
  price: number;
  salePrice?: number;
  stock: number;
  sizes: string[];
  colors: { name: string; hex: string; stock: number }[];
  images: string[];
  imageRefs?: string[];
  isFeatured: boolean;
  isPublished?: boolean;
  isActive: boolean;
  isOutOfStock: boolean;
  categoryId: string;
  colorVariants: ColorVariant[];
}

const productSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, "Product name is required")
    .max(150, "Product name is too long"),
  slug: z
    .string()
    .trim()
    .min(1, "Slug is required")
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Use lowercase letters, numbers, and hyphens only"),
  description: z
    .string()
    .trim()
    .min(1, "Description is required")
    .max(1000, "Description is too long"),
  price: z.coerce.number().min(1, "Price must be greater than 0"),
  salePrice: z.coerce.number().min(1, "Discount price must be greater than 0").optional().or(z.literal("")),
  categoryId: z.string().min(1, "Category is required"),
  colorVariants: z.array(z.object({
    id: z.string(),
    colorName: z.string(),
    colorHex: z.string(),
    images: z.array(z.string()),
    selectedSizes: z.array(z.string()),
    stock: z.record(z.string(), z.number()),
    measurements: z.record(z.string(), z.object({
      shoulder: z.number().optional(),
      chest: z.number().optional(),
      sleeve: z.number().optional(),
      waist: z.number().optional(),
      length: z.number().optional(),
    })),
  })),
  isFeatured: z.boolean(),
  isPublished: z.boolean(),
}).superRefine((data, ctx) => {
  if (
    data.salePrice !== undefined &&
    data.salePrice !== "" &&
    Number(data.salePrice) > data.price
  ) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["salePrice"],
      message: "Discount price must be less than or equal to price",
      fatal: true,
    });
  }
});

export default function ProductsPage() {
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [colorVariants, setColorVariants] = useState<ColorVariant[]>([]);
  const [expandedVariantIndex, setExpandedVariantIndex] = useState<number | null>(0);
  const [formErrors, setFormErrors] = useState<FormErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const products = useQuery(api.products.getAll, {});
  const categories = useQuery(api.categories.getActive);
  const createProduct = useMutation(api.products.create);
  const updateProduct = useMutation(api.products.update);
  const removeProduct = useMutation(api.products.remove);
  const generateUploadUrl = useMutation(api.products.generateUploadUrl);

  const resetDialogState = () => {
    setIsAddDialogOpen(false);
    setEditingProduct(null);
    setColorVariants([]);
    setExpandedVariantIndex(0);
    setFormErrors({});
  };

  const openCreate = () => {
    setEditingProduct(null);
    setColorVariants([createEmptyColorVariant()]);
    setExpandedVariantIndex(0);
    setFormErrors({});
    setIsAddDialogOpen(true);
  };

  const openEdit = (product: Product) => {
    setEditingProduct(product);
    
    // Map existing colorVariants which have string[] images into ImageFile[] objects
    const mappedVariants = product.colorVariants?.length 
      ? product.colorVariants.map(cv => ({
          ...cv,
          images: (cv.images as unknown as string[]).map(imgId => ({
            id: crypto.randomUUID(),
            preview: `/api/storage/${imgId}`,
            label: `Image ${imgId.slice(0, 6)}...`,
            storageId: imgId,
          }))
        }))
      : [createEmptyColorVariant()];

    setColorVariants(mappedVariants as any[]);
    setExpandedVariantIndex(product.colorVariants?.length ? 0 : null);
    setFormErrors({});
    setIsAddDialogOpen(true);
  };

  const handleAddVariant = () => {
    setColorVariants([...colorVariants, createEmptyColorVariant()]);
    setExpandedVariantIndex(colorVariants.length);
  };

  const handleRemoveVariant = (index: number) => {
    setColorVariants(colorVariants.filter((_, i) => i !== index));
    if (expandedVariantIndex !== null && index <= expandedVariantIndex) {
      setExpandedVariantIndex(Math.max(0, expandedVariantIndex - 1));
    }
  };

  const handleUpdateVariant = (index: number, updated: ColorVariant) => {
    const newVariants = [...colorVariants];
    newVariants[index] = updated;
    setColorVariants(newVariants);
  };

  const handleCopyMeasurements = (sourceIndex: number, targetIndex: number) => {
    const source = colorVariants[sourceIndex];
    if (!source) return;
    
    const target = colorVariants[targetIndex];
    const updated: ColorVariant = {
      ...target,
      measurements: { ...source.measurements },
    };
    handleUpdateVariant(targetIndex, updated);
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);
    const formData = new FormData(e.currentTarget);

    try {
      // 1. Upload any new images first
      const uploadedVariants = await Promise.all(
        colorVariants.map(async (cv) => {
          const uploadedImages = await Promise.all(
            cv.images.map(async (img) => {
              if (img.file && !img.storageId) {
                const uploadUrl = await generateUploadUrl();
                const response = await fetch(uploadUrl, {
                  method: "POST",
                  headers: { "Content-Type": img.file.type },
                  body: img.file,
                });
                if (!response.ok) throw new Error(`Failed to upload image ${img.label}`);
                const { storageId } = await response.json();
                return storageId;
              }
              // It's already an uploaded storageId (or a legacy URL)
              return img.storageId || img.preview || img.id;
            })
          );
          
          return {
            id: cv.id,
            colorName: cv.colorName,
            colorHex: cv.colorHex,
            images: uploadedImages,
            selectedSizes: cv.selectedSizes,
            stock: cv.stock,
            measurements: cv.measurements,
          };
        })
      );

      const parsed = productSchema.safeParse({
        name: String(formData.get("name") ?? ""),
        slug: String(formData.get("slug") ?? ""),
        description: String(formData.get("description") ?? ""),
        price: formData.get("price") ?? "0",
        salePrice: formData.get("salePrice") || undefined,
        categoryId: String(formData.get("categoryId") ?? ""),
        colorVariants: uploadedVariants,
        isFeatured: formData.get("isFeatured") === "on",
        isPublished: formData.get("isPublished") === "on",
      });

      if (!parsed.success) {
        setFormErrors(zodToFormErrors(parsed.error));
        notify.validation();
        setIsSubmitting(false);
        return;
      }

      const data = parsed.data;
      setFormErrors({});

      if (editingProduct) {
        await updateProduct({
          id: editingProduct._id as any,
          updates: {
            name: data.name,
            slug: data.slug,
            description: data.description,
            price: data.price,
            salePrice: data.salePrice === "" ? undefined : data.salePrice,
            categoryId: data.categoryId as any,
            colorVariants: data.colorVariants,
            isFeatured: data.isFeatured,
            isPublished: data.isPublished,
          },
        });
        notify.updated("Product");
      } else {
        await createProduct({
          name: data.name,
          slug: data.slug,
          description: data.description,
          price: data.price,
          salePrice: data.salePrice === "" ? undefined : data.salePrice,
          categoryId: data.categoryId as any,
          colorVariants: data.colorVariants,
          isFeatured: data.isFeatured,
          isPublished: data.isPublished,
        });
        notify.created("Product");
      }
      resetDialogState();
    } catch (error) {
      notify.actionError("save product", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (productId: string) => {
    if (!confirm("Are you sure you want to delete this product?")) return;
    try {
      await removeProduct({ id: productId as any });
      notify.deleted("Product");
    } catch (error) {
      notify.actionError("delete product", error);
    }
  };

  const handleTogglePublished = async (product: Product) => {
    const nextPublished = product.isPublished === false;
    try {
      await updateProduct({
        id: product._id as any,
        updates: {
          isPublished: nextPublished,
        },
      });
      notify.success(`Product ${nextPublished ? "published" : "unpublished"}`);
    } catch (error) {
      notify.actionError("update product visibility", error);
    }
  };

  const handleBulkDelete = async (rows: Product[]) => {
    if (rows.length === 0) return;
    if (!confirm(`Are you sure you want to delete ${rows.length} selected products?`)) return;

    let deletedCount = 0;
    for (const row of rows) {
      try {
        await removeProduct({ id: row._id as any });
        deletedCount += 1;
      } catch (error) {
        notify.actionError(`delete product "${row.name}"`, error);
      }
    }

    if (deletedCount > 0) {
      notify.success(`${deletedCount} products deleted successfully`);
    }
  };

  if (products === undefined || categories === undefined) {
    return (
      <div>
        <h1 className="text-3xl font-bold mb-8">Products</h1>
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-20 w-full" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Products</h1>
      </div>

      <AdminDataTable
        data={(products as any[]) || []}
        getRowId={(product) => product._id}
        emptyTitle="Empty"
        emptyDescription="No products found."
        emptyIcon={Package}
        searchPlaceholder="Filter products..."
        toolbarActions={[
          {
            label: "Create Product",
            icon: Plus,
            onClick: openCreate,
          },
        ]}
        rowActions={(product) => [
          {
            label: "Update",
            icon: Pencil,
            onClick: () => openEdit(product),
          },
          {
            label: product.isPublished === false ? "Make Public" : "Make Unpublic",
            icon: product.isPublished === false ? Eye : EyeOff,
            onClick: () => handleTogglePublished(product),
          },
          {
            label: "Delete",
            icon: Trash2,
            destructive: true,
            onClick: () => handleDelete(product._id),
          },
        ]}
        onBulkDelete={handleBulkDelete}
        bulkDeleteLabel="Delete selected products"
        columns={[
          {
            id: "name",
            header: "Product",
            searchAccessor: (product) => `${product.name} ${product.description ?? ""} ${product.slug}`,
            cell: (product) => (
              <span className="font-medium">{product.name}</span>
            ),
          },
          {
            id: "slug",
            header: "Slug",
            defaultHidden: true,
            searchAccessor: (product) => product.slug,
            cell: (product) => (
              <span className="text-sm text-muted-foreground">{product.slug}</span>
            ),
          },
          {
            id: "stock",
            header: "Stock",
            cell: (product) => <span className="font-medium tabular-nums">{product.stock}</span>,
          },
          {
            id: "status",
            header: "Status",
            searchAccessor: (product) => (product.isPublished === false ? "unpublic" : "public"),
            sortAccessor: (product) => (product.isPublished === false ? 0 : 1),
            cell: (product) => (
              <span className={product.isPublished === false ? "text-muted-foreground" : "text-foreground"}>
                {product.isPublished === false ? "Unpublic" : "Public"}
              </span>
            ),
          },
          {
            id: "price",
            header: "Price",
            searchAccessor: (product) =>
              `${product.price} ${product.salePrice ?? ""} ${product.isFeatured ? "featured" : ""}`,
            cell: (product) => {
              const hasDiscount = !!product.salePrice && product.salePrice > 0 && product.salePrice < product.price;
              return (
                <div className="flex flex-col">
                  {hasDiscount ? (
                    <>
                      <span className="text-[10px] text-muted-foreground line-through">Ks {product.price.toLocaleString()}</span>
                      <span className="font-medium text-destructive tabular-nums bg-destructive/10 px-1.5 py-0.5 rounded-sm w-fit">Ks {product.salePrice!.toLocaleString()}</span>
                    </>
                  ) : (
                    <span className="font-medium tabular-nums">Ks {product.price.toLocaleString()}</span>
                  )}
                </div>
              );
            },
          },
        ] satisfies AdminTableColumn<Product>[]}
      />

      <Dialog
        open={isAddDialogOpen}
        onOpenChange={(open) => {
          if (!open) {
            resetDialogState();
            return;
          }
          setIsAddDialogOpen(open);
        }}
      >
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingProduct ? "Edit Product" : "Add New Product"}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 items-start gap-4">
              <Field invalid={Boolean(formErrors.name)}>
                <FieldLabel htmlFor="name">Product Name *</FieldLabel>
                <Input
                  id="name"
                  name="name"
                  defaultValue={editingProduct?.name}
                  aria-invalid={Boolean(formErrors.name)}
                  required
                />
                <FieldDescription className={!formErrors.name ? "invisible" : undefined}>
                  {formErrors.name ?? " "}
                </FieldDescription>
              </Field>
              <Field invalid={Boolean(formErrors.slug)}>
                <FieldLabel htmlFor="slug">Slug *</FieldLabel>
                <Input
                  id="slug"
                  name="slug"
                  defaultValue={editingProduct?.slug}
                  aria-invalid={Boolean(formErrors.slug)}
                  required
                />
                <FieldDescription className={!formErrors.slug ? "invisible" : undefined}>
                  {formErrors.slug ?? " "}
                </FieldDescription>
              </Field>
            </div>

            <Field invalid={Boolean(formErrors.description)}>
              <FieldLabel htmlFor="description">Description *</FieldLabel>
              <RichTextEditor
                id="description"
                name="description"
                defaultValue={editingProduct?.description}
                aria-invalid={Boolean(formErrors.description)}
                key={editingProduct?._id || "new"}
              />
              <FieldDescription className={!formErrors.description ? "invisible" : undefined}>
                {formErrors.description ?? " "}
              </FieldDescription>
            </Field>

            <div className="grid grid-cols-2 items-start gap-4">
              <Field invalid={Boolean(formErrors.price)}>
                <FieldLabel htmlFor="price">Price (Ks) *</FieldLabel>
                <Input
                  id="price"
                  name="price"
                  type="number"
                  defaultValue={editingProduct?.price}
                  aria-invalid={Boolean(formErrors.price)}
                  required
                />
                <FieldDescription className={!formErrors.price ? "invisible" : undefined}>
                  {formErrors.price ?? " "}
                </FieldDescription>
              </Field>
              <Field invalid={Boolean(formErrors.salePrice)}>
                <FieldLabel htmlFor="salePrice">Discount Price (Ks)</FieldLabel>
                <Input
                  id="salePrice"
                  name="salePrice"
                  type="number"
                  defaultValue={editingProduct?.salePrice}
                  aria-invalid={Boolean(formErrors.salePrice)}
                  placeholder="Optional"
                />
                <FieldDescription className={!formErrors.salePrice ? "invisible" : undefined}>
                  {formErrors.salePrice ?? " "}
                </FieldDescription>
              </Field>
            </div>

            <Field invalid={Boolean(formErrors.categoryId)}>
              <FieldLabel htmlFor="categoryId">Category *</FieldLabel>
              <Select name="categoryId" defaultValue={editingProduct?.categoryId}>
                <SelectTrigger aria-invalid={Boolean(formErrors.categoryId)}>
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  {(categories as { _id: string; name: string }[] | undefined)?.map((category) => (
                    <SelectItem key={category._id} value={category._id}>
                      {category.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FieldDescription className={!formErrors.categoryId ? "invisible" : undefined}>
                {formErrors.categoryId ?? " "}
              </FieldDescription>
            </Field>

            <div className="border-t border-border pt-4">
              <div className="flex items-center justify-between mb-4">
                <FieldLabel>Color Variants</FieldLabel>
                <Button type="button" variant="outline" size="sm" onClick={handleAddVariant}>
                  <Plus className="size-4 mr-1" />
                  Add Color
                </Button>
              </div>

              <div className="space-y-3">
                {colorVariants.map((variant, index) => (
                  <VariantCard
                    key={variant.id}
                    variant={variant}
                    index={index}
                    isOpen={expandedVariantIndex === index}
                    onToggleOpen={() => setExpandedVariantIndex(expandedVariantIndex === index ? null : index)}
                    onUpdate={(updated) => handleUpdateVariant(index, updated)}
                    onRemove={() => handleRemoveVariant(index)}
                    canRemove={colorVariants.length > 1}
                    copySourceVariants={colorVariants
                      .filter((_, i) => i !== index)
                      .map((cv, i) => ({ id: String(i), colorName: cv.colorName || `Variant ${i + 1}` }))}
                    onCopyMeasurements={(sourceId) => handleCopyMeasurements(parseInt(sourceId), index)}
                  />
                ))}
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <Switch
                id="isFeatured"
                name="isFeatured"
                defaultChecked={editingProduct?.isFeatured}
              />
              <FieldLabel htmlFor="isFeatured">Featured Product</FieldLabel>
            </div>

            <div className="flex items-center space-x-2">
              <Switch
                id="isPublished"
                name="isPublished"
                defaultChecked={editingProduct?.isPublished ?? true}
              />
              <FieldLabel htmlFor="isPublished">Public Product</FieldLabel>
            </div>

            <div className="flex justify-end gap-2 pt-4">
              <Button type="button" variant="outline" onClick={resetDialogState} disabled={isSubmitting}>
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? "Saving..." : editingProduct ? "Update Product" : "Create Product"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}