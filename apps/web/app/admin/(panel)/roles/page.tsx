import { hasPermission, type AdminRoleSummary } from '@hotel-bambu/shared';
import type { Metadata } from 'next';
import { PageHeader } from '@/components/admin/ui';
import { requirePermission } from '@/lib/admin/session';
import { serverApi } from '@/lib/api/server';
import { RolesManager } from './roles-manager';

export const metadata: Metadata = { title: 'Roles' };

export default async function RolesPage() {
  const session = await requirePermission('users.view');
  const roles = await serverApi.get<AdminRoleSummary[]>('/admin/roles');
  return (
    <>
      <PageHeader
        title="Roles"
        description="Un rol reúne los permisos por sección del panel. Los cambios de permisos se aplican en la siguiente acción de cada usuario."
      />
      <RolesManager
        roles={roles}
        canManage={hasPermission(session.user.permissions, 'users.manage')}
      />
    </>
  );
}
