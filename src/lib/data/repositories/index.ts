import type { DataSourceSelection } from '@/lib/data/source';
import { resolveServerDataSource } from '@/lib/data/source';
import { createConvexRepositories } from '@/lib/data/repositories/convex';
import { createMockRepositories } from '@/lib/data/repositories/mock';
import type { DataRepositories } from '@/lib/data/repositories/types';

const mockRepositories = createMockRepositories();
let convexRepositories: DataRepositories | null = null;

function getConvexRepositories(): DataRepositories {
  if (!convexRepositories) {
    convexRepositories = createConvexRepositories();
  }
  return convexRepositories;
}

export function getServerDataRepositories(): {
  repositories: DataRepositories;
  selection: DataSourceSelection;
} {
  const selection = resolveServerDataSource();

  if (selection.source === 'convex') {
    return {
      repositories: getConvexRepositories(),
      selection,
    };
  }

  return {
    repositories: mockRepositories,
    selection,
  };
}
