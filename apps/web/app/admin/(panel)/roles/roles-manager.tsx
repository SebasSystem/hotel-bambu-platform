'use client';

import {
  roleCreateSchema,
  roleUpdateSchema,
  type AdminRoleSummary,
  type Permission,
  type RoleCreateInput,
} from '@hotel-bambu/shared';
import { Pencil, Plus, ShieldCheck, Trash2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useId, useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { useConfirm, useToast } from '@/components/admin/feedback';
import { FormAlert, TextAreaField, TextField } from '@/components/admin/fields';
import { useAction, useUnsavedChangesWarning } from '@/components/admin/hooks';
import { Badge, Button, Notice, cx, panelClasses } from '@/components/admin/ui';
import { describePermissions } from '@/lib/admin/permission-checklist';
import { browserApi } from '@/lib/api/browser';
import { applyApiError } from '@/lib/forms/form-errors';
import { formResolver } from '@/lib/forms/resolver';
import { PermissionChecklist } from './permission-checklist';

const users = (count: number) => (count === 1 ? '1 usuario' : `${count} usuarios`);

/**
 * Roles (feature admin-users-roles): each grants permissions per admin area. The system role
 * (Administrador) has every permission and cannot be edited or deleted; a role still assigned to
 * users cannot be deleted. Permission changes apply on the user's next request.
 */
export function RolesManager({
  roles,
  canManage,
}: {
  roles: AdminRoleSummary[];
  canManage: boolean;
}) {
  const [editing, setEditing] = useState<AdminRoleSummary | 'new' | null>(null);
  const { run, busy } = useAction();
  const confirm = useConfirm();

  const remove = async (role: AdminRoleSummary) => {
    const ok = await confirm({
      title: '¿Eliminar rol?',
      description: `«${role.name}» se eliminará definitivamente.`,
      confirmLabel: 'Eliminar',
      destructive: true,
    });
    if (!ok) return;
    await run(
      `delete:${role.id}`,
      () => browserApi.delete(`/admin/roles/${role.id}`),
      'Rol eliminado.',
    );
  };

  return (
    <div className="flex flex-col gap-4">
      {canManage ? (
        <div>
          <Button onClick={() => setEditing('new')} disabled={editing === 'new'}>
            <Plus aria-hidden="true" className="size-4" /> Agregar rol
          </Button>
        </div>
      ) : (
        <Notice>Su rol permite ver los roles, no modificarlos.</Notice>
      )}

      {editing === 'new' ? (
        <div className={cx(panelClasses, 'p-5 tab:p-6')}>
          <RoleForm role={null} onDone={() => setEditing(null)} />
        </div>
      ) : null}

      <ul className="flex flex-col gap-2.5">
        {roles.map((role) =>
          editing !== 'new' && editing?.id === role.id ? (
            <li key={role.id} className={cx(panelClasses, 'p-5 tab:p-6')}>
              <RoleForm role={role} onDone={() => setEditing(null)} />
            </li>
          ) : (
            <li key={role.id}>
              <RoleCard
                role={role}
                canManage={canManage}
                deleting={busy === `delete:${role.id}`}
                onEdit={() => setEditing(role)}
                onDelete={() => void remove(role)}
              />
            </li>
          ),
        )}
      </ul>
    </div>
  );
}

function RoleCard({
  role,
  canManage,
  deleting,
  onEdit,
  onDelete,
}: {
  role: AdminRoleSummary;
  canManage: boolean;
  deleting: boolean;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const id = useId();
  const titleId = `${id}-title`;
  const inUseId = `${id}-in-use`;
  const inUse = role.userCount > 0;
  const summary = describePermissions(role.permissions);

  return (
    <article aria-labelledby={titleId} className={cx(panelClasses, 'p-4 tab:px-5')}>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h2 id={titleId} className="font-sans text-base leading-snug font-bold tracking-normal">
              {role.name}
            </h2>
            {role.isSystem ? (
              <Badge tone="success" icon={ShieldCheck}>
                Sistema
              </Badge>
            ) : null}
          </div>
          {role.description ? (
            <p className="mt-1 text-sm text-muted-foreground">{role.description}</p>
          ) : null}
          <p className="mt-1 text-[0.8125rem] text-muted-foreground">{users(role.userCount)}</p>
          {role.isSystem ? <p className="mt-2 text-sm font-semibold">Todos los permisos</p> : null}
          {summary.length > 0 ? (
            <ul aria-label={`Permisos de ${role.name}`} className="mt-2 flex flex-wrap gap-1.5">
              {summary.map((entry) => (
                <li key={entry}>
                  <Badge>{entry}</Badge>
                </li>
              ))}
            </ul>
          ) : (
            <p className="mt-2 text-sm text-muted-foreground">Sin permisos: solo Mi cuenta.</p>
          )}
          {role.isSystem ? (
            <p className="mt-2 text-[0.8125rem] text-muted-foreground">
              El rol del sistema no se puede modificar ni eliminar.
            </p>
          ) : null}
        </div>
        {canManage && !role.isSystem ? (
          <div className="flex flex-col items-end gap-1.5">
            <div className="flex flex-wrap items-center gap-2">
              <Button
                variant="secondary"
                size="sm"
                onClick={onEdit}
                aria-label={`Editar ${role.name}`}
              >
                <Pencil aria-hidden="true" className="size-4" /> Editar
              </Button>
              {/* aria-disabled keeps the button focusable so the reason stays discoverable. */}
              <Button
                variant="ghost"
                size="sm"
                loading={deleting}
                aria-disabled={inUse || undefined}
                aria-describedby={inUse ? inUseId : undefined}
                title={inUse ? 'Asigne otro rol a sus usuarios antes de eliminarlo.' : undefined}
                className={inUse ? 'cursor-not-allowed opacity-60' : undefined}
                onClick={inUse ? undefined : onDelete}
                aria-label={`Eliminar ${role.name}`}
              >
                <Trash2 aria-hidden="true" className="size-4" />
              </Button>
            </div>
            {inUse ? (
              <p
                id={inUseId}
                className="max-w-[16rem] text-right text-[0.75rem] text-muted-foreground"
              >
                Asigne otro rol a sus {users(role.userCount)} antes de eliminarlo.
              </p>
            ) : null}
          </div>
        ) : null}
      </div>
    </article>
  );
}

function RoleForm({ role, onDone }: { role: AdminRoleSummary | null; onDone: () => void }) {
  const toast = useToast();
  const router = useRouter();
  const [formError, setFormError] = useState<string | null>(null);
  const {
    register,
    handleSubmit,
    control,
    setError,
    formState: { errors, isSubmitting, isDirty },
  } = useForm({
    resolver: formResolver(role ? roleUpdateSchema : roleCreateSchema),
    defaultValues: {
      name: role?.name ?? '',
      description: role?.description ?? '',
      permissions: (role?.permissions ?? []) as Permission[],
    },
  });
  useUnsavedChangesWarning(isDirty);
  const title = role ? 'Editar rol' : 'Nuevo rol';

  const onSubmit = handleSubmit(async (values: Partial<RoleCreateInput>) => {
    setFormError(null);
    try {
      if (role) await browserApi.patch(`/admin/roles/${role.id}`, values);
      else await browserApi.post('/admin/roles', values);
    } catch (error) {
      const result = applyApiError(error, setError, ['name', 'description', 'permissions']);
      setFormError(result.fieldErrors > 0 ? null : result.message);
      return;
    }
    toast.success(role ? 'Rol actualizado. Los permisos se aplican de inmediato.' : 'Rol creado.');
    router.refresh();
    onDone();
  });

  return (
    <form onSubmit={onSubmit} noValidate aria-label={title} className="flex flex-col gap-4">
      <h2 className="font-sans text-base font-bold tracking-normal">{title}</h2>
      <FormAlert message={formError} />
      <div className="grid gap-5 md:grid-cols-2">
        <TextField label="Nombre" required error={errors.name} registration={register('name')} />
        <TextAreaField
          className="md:col-span-2"
          label="Descripción"
          rows={2}
          hint="Para qué sirve el rol, por ejemplo «Atiende la recepción»."
          error={errors.description}
          registration={register('description')}
        />
        <div className="md:col-span-2">
          <Controller
            control={control}
            name="permissions"
            render={({ field, fieldState }) => (
              <PermissionChecklist
                value={(field.value ?? []) as Permission[]}
                onChange={field.onChange}
                error={fieldState.error?.message}
              />
            )}
          />
        </div>
      </div>
      <div className="flex flex-wrap gap-2 border-t border-line pt-4">
        <Button type="submit" loading={isSubmitting}>
          {role ? 'Guardar cambios' : 'Crear rol'}
        </Button>
        <Button variant="secondary" onClick={onDone}>
          Cancelar
        </Button>
      </div>
    </form>
  );
}
