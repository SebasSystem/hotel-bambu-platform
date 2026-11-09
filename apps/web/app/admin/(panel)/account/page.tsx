import type { Metadata } from 'next';
import { Card, PageHeader } from '@/components/admin/ui';
import { getSession } from '@/lib/admin/session';
import { ChangePasswordForm } from './change-password-form';

export const metadata: Metadata = { title: 'Mi cuenta' };

const dateFormat = new Intl.DateTimeFormat('es-CO', {
  dateStyle: 'medium',
  timeStyle: 'short',
  timeZone: 'America/Bogota',
});

export default async function AccountPage() {
  // Own profile and password: no permission needed (ADR 0017).
  const session = await getSession();
  return (
    <>
      <PageHeader title="Mi cuenta" />
      <div className="flex flex-col gap-6">
        <Card className="max-w-xl">
          <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-2 text-sm">
            <dt className="font-semibold">Correo</dt>
            <dd>{session.user.email}</dd>
            {session.user.name ? (
              <>
                <dt className="font-semibold">Nombre</dt>
                <dd>{session.user.name}</dd>
              </>
            ) : null}
            <dt className="font-semibold">Rol</dt>
            <dd>{session.user.role.name}</dd>
            <dt className="font-semibold">La sesión vence</dt>
            <dd>{dateFormat.format(new Date(session.expiresAt))}</dd>
          </dl>
        </Card>
        <ChangePasswordForm />
      </div>
    </>
  );
}
