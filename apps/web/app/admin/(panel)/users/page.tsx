import { hasPermission, type AdminRoleSummary, type AdminUserSummary } from '@hotel-bambu/shared';
import type { Metadata } from 'next';
import { PageHeader } from '@/components/admin/ui';
import { requirePermission } from '@/lib/admin/session';
import { serverApi } from '@/lib/api/server';
import { UsersManager } from './users-manager';

export const metadata: Metadata = { title: 'Usuarios' };

export default async function UsersPage() {
  const session = await requirePermission('users.view');
  // Both endpoints need users.view, so any role that opens this page can read them.
  const [users, roles] = await Promise.all([
    serverApi.get<AdminUserSummary[]>('/admin/users'),
    serverApi.get<AdminRoleSummary[]>('/admin/roles'),
  ]);
  return (
    <>
      <PageHeader
        title="Usuarios"
        description="Personas con acceso al panel. Cada una tiene un rol que decide qué secciones puede ver o gestionar. Los usuarios no se eliminan: se desactivan."
      />
      <UsersManager
        users={users}
        roles={roles}
        currentUserId={session.user.id}
        canManage={hasPermission(session.user.permissions, 'users.manage')}
      />
    </>
  );
}
