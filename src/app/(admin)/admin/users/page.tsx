import { UsersTable } from '@/components/admin/users-table';
import { DataSourceNotice } from '@/components/shared/data-source-notice';
import { getServerDataRepositories } from '@/lib/data/repositories';

export default async function AdminUsersPage() {
  const { repositories, selection } = getServerDataRepositories();
  const users = await repositories.users.list();

  return (
    <div className="space-y-6 px-4 lg:px-6">
      <div>
        <h1 className="text-2xl font-semibold">Users</h1>
        <p className="text-sm text-zinc-600">Review customer/admin accounts and account health.</p>
      </div>
      <DataSourceNotice selection={selection} />
      <UsersTable initialUsers={users} />
    </div>
  );
}
