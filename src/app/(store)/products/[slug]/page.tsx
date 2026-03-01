import { DataSourceNotice } from '@/components/shared/data-source-notice';
import { ProductDetailPageClient } from '@/components/store/pages/product-detail-page-client';
import { getServerDataRepositories } from '@/lib/data/repositories';

export default async function ProductDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const { repositories, selection } = getServerDataRepositories();
  const [product, relatedProducts, settings] = await Promise.all([
    repositories.products.getBySlug(slug, { publishedOnly: true }),
    repositories.products.listRelatedBySlug(slug, 4),
    repositories.settings.get(),
  ]);

  return (
    <div className="space-y-6">
      <DataSourceNotice selection={selection} />
      <ProductDetailPageClient
        product={product}
        relatedProducts={relatedProducts}
        storeSettings={settings}
      />
    </div>
  );
}
