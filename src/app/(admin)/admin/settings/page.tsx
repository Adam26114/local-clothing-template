import { StoreSettingsForm } from '@/components/admin/store-settings-form';
import { DataSourceNotice } from '@/components/shared/data-source-notice';
import { getServerDataRepositories } from '@/lib/data/repositories';

export default async function AdminSettingsPage() {
  const { repositories, selection } = getServerDataRepositories();
  const settings = await repositories.settings.get();

  return (
    <div className="space-y-6 px-4 lg:px-6">
      <div>
        <h1 className="text-2xl font-semibold">Storefront Controls</h1>
        <p className="text-sm text-zinc-600">
          Manage hero messaging, sale banner, and contact details shown on the storefront.
        </p>
      </div>
      <DataSourceNotice selection={selection} />
      <StoreSettingsForm initialSettings={settings} />
    </div>
  );
}
