import Link from 'next/link';

import { DataSourceNotice } from '@/components/shared/data-source-notice';
import { ProductCard } from '@/components/store/product-card';
import { getServerDataRepositories } from '@/lib/data/repositories';

export default async function HomePage() {
  const { repositories, selection } = getServerDataRepositories();
  const [featuredProducts, storeSettings] = await Promise.all([
    repositories.products.listFeatured(),
    repositories.settings.get(),
  ]);

  return (
    <div className="space-y-12">
      <DataSourceNotice selection={selection} />
      {storeSettings.saleBannerEnabled ? (
        <Link
          href={storeSettings.saleBannerLink ?? '/sale'}
          className="block rounded bg-red-600 px-4 py-2 text-center text-sm text-white"
        >
          {storeSettings.saleBannerText}
        </Link>
      ) : null}

      <section className="grid gap-8 rounded bg-zinc-100 p-8 lg:grid-cols-2">
        <div className="space-y-4">
          <p className="text-xs tracking-[0.12em] text-zinc-600">KHIT SPRING DROP</p>
          <h1 className="text-4xl font-bold tracking-tight lg:text-5xl">
            {storeSettings.heroTitle}
          </h1>
          <p className="max-w-md text-zinc-600">{storeSettings.heroSubtitle}</p>
          <Link
            href={storeSettings.heroCtaLink ?? '/new'}
            className="inline-flex rounded bg-black px-4 py-2 text-sm text-white"
          >
            {storeSettings.heroCtaLabel}
          </Link>
        </div>
        <div className="aspect-[4/3] rounded bg-zinc-300" />
      </section>

      <section className="space-y-4">
        <h2 className="text-2xl font-semibold">Featured Products</h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {featuredProducts.map((product) => (
            <ProductCard key={product._id} product={product} />
          ))}
        </div>
      </section>
    </div>
  );
}
