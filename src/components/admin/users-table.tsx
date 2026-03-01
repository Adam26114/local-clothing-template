'use client';

import Link from 'next/link';
import { useMemo, useState } from 'react';
import type { ColumnDef } from '@tanstack/react-table';

import { AdminDataTable, withRowSelection } from '@/components/admin/data-table';
import { Badge } from '@/components/ui/badge';
import { User } from '@/lib/types';

export function UsersTable({ initialUsers }: { initialUsers: User[] }) {
  const [role, setRole] = useState<'all' | 'customer' | 'admin'>('all');

  const data = useMemo(() => {
    if (role === 'all') return initialUsers;
    return initialUsers.filter((user) => user.role === role);
  }, [role, initialUsers]);

  const columns: Array<ColumnDef<User>> = [
    {
      accessorKey: 'name',
      header: 'Name',
      cell: ({ row }) => (
        <Link href={`/admin/users/${row.original._id}`} className="font-medium hover:underline">
          {row.original.name}
        </Link>
      ),
    },
    { accessorKey: 'email', header: 'Email' },
    { accessorKey: 'phone', header: 'Phone', cell: ({ row }) => row.original.phone ?? '-' },
    {
      accessorKey: 'role',
      header: 'Role',
      cell: ({ row }) => <Badge variant="outline">{row.original.role}</Badge>,
    },
    {
      accessorKey: 'createdAt',
      header: 'Joined Date',
      cell: ({ row }) => new Date(row.original.createdAt).toLocaleDateString(),
    },
  ];

  return (
    <div className="space-y-3">
      <select
        className="rounded border bg-white px-3 py-1 text-sm"
        value={role}
        onChange={(event) => setRole(event.target.value as 'all' | 'customer' | 'admin')}
      >
        <option value="all">All roles</option>
        <option value="customer">Customer</option>
        <option value="admin">Admin</option>
      </select>
      <AdminDataTable
        tableId="users"
        columns={withRowSelection(columns)}
        data={data}
        searchPlaceholder="Search by name, email, phone"
      />
    </div>
  );
}
