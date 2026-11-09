'use client';

import {
  adminUserCreateSchema,
  adminUserPasswordResetSchema,
  adminUserUpdateSchema,
  type AdminRoleSummary,
  type AdminUserCreateInput,
  type AdminUserPasswordResetInput,
  type AdminUserSummary,
  type AdminUserUpdateInput,
} from '@hotel-bambu/shared';
import { KeyRound, Pencil, Plus, ShieldCheck } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { useForm, type FieldValues, type Path, type UseFormSetError } from 'react-hook-form';
import { useConfirm, useToast } from '@/components/admin/feedback';
import {
  CheckboxField,
  FormAlert,
  PasswordField,
  SelectField,
  TextField,
} from '@/components/admin/fields';
import { FormModal } from '@/components/admin/form-modal';
import {
  Badge,
  BooleanBadge,
  Button,
  Notice,
  buttonClasses,
  panelClasses,
} from '@/components/admin/ui';
import { browserApi } from '@/lib/api/browser';
import { isApiError } from '@/lib/api/client';
import { applyApiError, describeApiError } from '@/lib/forms/form-errors';
import { formResolver } from '@/lib/forms/resolver';

const PASSWORD_HINT =
  'Entre 12 y 128 caracteres. Use una frase larga; no repita un solo carácter ni incluya el nombre del correo. Comuníquela por un medio seguro.';
const SESSIONS_NOTE = 'Cambiar el rol o desactivar al usuario cierra sus sesiones abiertas.';
const SELF_NOTE =
  'No puede cambiar su propio rol ni desactivar su cuenta. Pida a otro usuario con permiso para gestionar usuarios que lo haga.';

const dateFormat = new Intl.DateTimeFormat('es-CO', {
  dateStyle: 'medium',
  timeStyle: 'short',
  timeZone: 'America/Bogota',
});

const th =
  'px-2.5 py-3 text-[0.6875rem] font-bold tracking-[0.08em] text-muted-foreground uppercase';
const td = 'px-2.5 py-1 tab:py-3.5';
const mobileLabel = 'mr-1.5 text-muted-foreground tab:hidden';

const label = (user: AdminUserSummary) => user.name ?? user.email;

/** API error codes that belong to one form field (the rest go to the form alert). */
const CODE_FIELDS: Record<string, string> = {
  EMAIL_TAKEN: 'email',
  ROLE_NOT_FOUND: 'roleId',
  SELF_ROLE_CHANGE: 'roleId',
  SELF_DEACTIVATION: 'active',
};

/** Attaches an API error to its field when possible; returns the message for the form alert. */
function showApiError<T extends FieldValues>(
  error: unknown,
  setError: UseFormSetError<T>,
  fields: readonly Path<T>[],
): string | null {
  const code = isApiError(error) ? error.body.code : undefined;
  const field = typeof code === 'string' ? CODE_FIELDS[code] : undefined;
  if (field && (fields as readonly string[]).includes(field)) {
    setError(
      field as Path<T>,
      { type: 'server', message: describeApiError(error) },
      { shouldFocus: true },
    );
    return null;
  }
  const result = applyApiError(error, setError, fields);
  return result.fieldErrors > 0 ? null : result.message;
}

type Panel =
  | { kind: 'create' }
  | { kind: 'edit'; user: AdminUserSummary }
  | { kind: 'reset'; user: AdminUserSummary };

/**
 * Admin users (feature admin-users-roles): table, create, edit (name, role, active) and password
 * reset, each in a `FormModal`. Users are never deleted, only deactivated. The current user cannot change their own role
 * or deactivate themselves (the API refuses it too: SELF_ROLE_CHANGE, SELF_DEACTIVATION).
 */
export function UsersManager({
  users,
  roles,
  currentUserId,
  canManage,
}: {
  users: AdminUserSummary[];
  roles: AdminRoleSummary[];
  currentUserId: string;
  canManage: boolean;
}) {
  const [panel, setPanel] = useState<Panel | null>(null);
  const close = () => setPanel(null);
  const roleOptions = roles.map((role) => ({ value: role.id, label: role.name }));

  return (
    <div className="flex flex-col gap-4">
      {canManage ? (
        <div>
          <Button onClick={() => setPanel({ kind: 'create' })}>
            <Plus aria-hidden="true" className="size-4" /> Agregar usuario
          </Button>
        </div>
      ) : (
        <Notice>Su rol permite ver los usuarios, no modificarlos.</Notice>
      )}

      {panel?.kind === 'create' ? (
        <CreateUserForm roleOptions={roleOptions} onDone={close} />
      ) : null}
      {panel?.kind === 'edit' ? (
        <EditUserForm
          key={panel.user.id}
          user={panel.user}
          isSelf={panel.user.id === currentUserId}
          roleOptions={roleOptions}
          onDone={close}
        />
      ) : null}
      {panel?.kind === 'reset' ? (
        <ResetPasswordForm key={panel.user.id} user={panel.user} onDone={close} />
      ) : null}

      <div className={`${panelClasses} p-2 tab:px-[22px] tab:py-3`}>
        <table className="w-full text-left text-[0.875rem] max-tab:block">
          <caption className="sr-only">Usuarios del panel</caption>
          <thead className="border-b border-line max-tab:sr-only">
            <tr>
              <th scope="col" className={th}>
                Nombre
              </th>
              <th scope="col" className={th}>
                Correo
              </th>
              <th scope="col" className={th}>
                Rol
              </th>
              <th scope="col" className={th}>
                Estado
              </th>
              <th scope="col" className={th}>
                Último ingreso
              </th>
              {canManage ? (
                <th scope="col" className={th}>
                  <span className="sr-only">Acciones</span>
                </th>
              ) : null}
            </tr>
          </thead>
          <tbody className="max-tab:grid max-tab:gap-2">
            {users.map((user) => {
              const isSelf = user.id === currentUserId;
              return (
                <tr
                  key={user.id}
                  className="border-line max-tab:grid max-tab:grid-cols-2 max-tab:gap-x-3 max-tab:rounded-sm max-tab:border max-tab:p-3 tab:border-b tab:last:border-0"
                >
                  <td className={`${td} font-bold max-tab:col-span-2`}>
                    {user.name ?? <span className="text-muted-foreground">Sin nombre</span>}
                    {isSelf ? (
                      <span className="ml-1.5 font-normal text-muted-foreground">(usted)</span>
                    ) : null}
                  </td>
                  <td className={`${td} break-all max-tab:col-span-2`}>
                    <span className={mobileLabel}>Correo:</span>
                    {user.email}
                  </td>
                  <td className={td}>
                    <span className={mobileLabel}>Rol:</span>
                    {user.role.isSystem ? (
                      <Badge tone="success" icon={ShieldCheck}>
                        {user.role.name}
                      </Badge>
                    ) : (
                      user.role.name
                    )}
                  </td>
                  <td className={td}>
                    <span className={mobileLabel}>Estado:</span>
                    <BooleanBadge value={user.active} on="Activo" off="Inactivo" />
                  </td>
                  <td className={`${td} max-tab:col-span-2`}>
                    <span className={mobileLabel}>Último ingreso:</span>
                    {user.lastLoginAt ? (
                      <time dateTime={user.lastLoginAt}>
                        {dateFormat.format(new Date(user.lastLoginAt))}
                      </time>
                    ) : (
                      'Nunca'
                    )}
                  </td>
                  {canManage ? (
                    <td className={`${td} max-tab:col-span-2 tab:text-right`}>
                      <div className="flex flex-wrap gap-2 tab:justify-end">
                        <Button
                          variant="secondary"
                          size="sm"
                          onClick={() => setPanel({ kind: 'edit', user })}
                          aria-label={`Editar ${label(user)}`}
                        >
                          <Pencil aria-hidden="true" className="size-4" /> Editar
                        </Button>
                        {isSelf ? (
                          <Link
                            href="/admin/account"
                            className={buttonClasses('ghost', 'sm')}
                            title="Cambie su propia contraseña en Mi cuenta."
                          >
                            <KeyRound aria-hidden="true" className="size-4" /> Mi contraseña
                          </Link>
                        ) : (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setPanel({ kind: 'reset', user })}
                            aria-label={`Restablecer contraseña de ${label(user)}`}
                          >
                            <KeyRound aria-hidden="true" className="size-4" /> Contraseña
                          </Button>
                        )}
                      </div>
                    </td>
                  ) : null}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

type RoleOptions = readonly { value: string; label: string }[];

function CreateUserForm({ roleOptions, onDone }: { roleOptions: RoleOptions; onDone: () => void }) {
  const toast = useToast();
  const router = useRouter();
  const [formError, setFormError] = useState<string | null>(null);
  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting, isDirty },
  } = useForm({
    resolver: formResolver(adminUserCreateSchema),
    defaultValues: { email: '', name: '', roleId: '', password: '' },
  });

  const onSubmit = handleSubmit(async (values: AdminUserCreateInput) => {
    setFormError(null);
    try {
      await browserApi.post('/admin/users', values);
    } catch (error) {
      setFormError(showApiError(error, setError, ['email', 'name', 'roleId', 'password']));
      return;
    }
    toast.success('Usuario creado.');
    router.refresh();
    onDone();
  });

  return (
    <FormModal
      open
      onClose={onDone}
      title="Agregar usuario"
      description="Comparta la contraseña inicial por un medio seguro."
      dirty={isDirty}
      onSubmit={onSubmit}
      submitting={isSubmitting}
      submitLabel="Crear usuario"
    >
      <FormAlert message={formError} />
      <div className="grid gap-5 md:grid-cols-2">
        <TextField
          label="Correo electrónico"
          type="email"
          autoComplete="off"
          required
          error={errors.email}
          registration={register('email')}
        />
        <TextField label="Nombre" error={errors.name} registration={register('name')} />
        <SelectField
          label="Rol"
          required
          placeholder="Seleccione un rol"
          options={roleOptions}
          hint="Los permisos de cada rol se ven en Roles."
          error={errors.roleId}
          registration={register('roleId')}
        />
        <PasswordField
          label="Contraseña inicial"
          autoComplete="new-password"
          required
          hint={PASSWORD_HINT}
          error={errors.password}
          registration={register('password')}
        />
      </div>
    </FormModal>
  );
}

function EditUserForm({
  user,
  isSelf,
  roleOptions,
  onDone,
}: {
  user: AdminUserSummary;
  isSelf: boolean;
  roleOptions: RoleOptions;
  onDone: () => void;
}) {
  const toast = useToast();
  const router = useRouter();
  const [formError, setFormError] = useState<string | null>(null);
  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting, isDirty },
  } = useForm({
    resolver: formResolver(adminUserUpdateSchema),
    defaultValues: { name: user.name ?? '', roleId: user.role.id, active: user.active },
  });

  const onSubmit = handleSubmit(async (values: AdminUserUpdateInput) => {
    setFormError(null);
    // Only what changed: an unchanged role or status never triggers a session revocation, and the
    // current user never sends role or status at all.
    const body: AdminUserUpdateInput = { name: values.name ?? null };
    if (!isSelf && values.roleId && values.roleId !== user.role.id) body.roleId = values.roleId;
    if (!isSelf && values.active !== undefined && values.active !== user.active) {
      body.active = values.active;
    }
    try {
      await browserApi.patch(`/admin/users/${user.id}`, body);
    } catch (error) {
      setFormError(showApiError(error, setError, ['name', 'roleId', 'active']));
      return;
    }
    toast.success(
      body.roleId || body.active === false
        ? 'Cambios guardados. Las sesiones del usuario se cerraron.'
        : 'Cambios guardados.',
    );
    router.refresh();
    onDone();
  });

  return (
    <FormModal
      open
      onClose={onDone}
      title="Editar usuario"
      description={<span className="break-all">{user.email}</span>}
      dirty={isDirty}
      onSubmit={onSubmit}
      submitting={isSubmitting}
      submitLabel="Guardar cambios"
    >
      <FormAlert message={formError} />
      {isSelf ? <Notice>{SELF_NOTE}</Notice> : <Notice tone="warning">{SESSIONS_NOTE}</Notice>}
      <div className="grid gap-5 md:grid-cols-2">
        <TextField label="Nombre" error={errors.name} registration={register('name')} />
        <SelectField
          label="Rol"
          required
          options={roleOptions}
          error={errors.roleId}
          registration={register('roleId', { disabled: isSelf })}
        />
        <div className="md:col-span-2">
          <CheckboxField
            label="Usuario activo"
            hint="Un usuario inactivo no puede iniciar sesión. Su historial se conserva."
            error={errors.active}
            registration={register('active', { disabled: isSelf })}
          />
        </div>
      </div>
    </FormModal>
  );
}

function ResetPasswordForm({ user, onDone }: { user: AdminUserSummary; onDone: () => void }) {
  const toast = useToast();
  const confirm = useConfirm();
  const [formError, setFormError] = useState<string | null>(null);
  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting, isDirty },
  } = useForm({
    resolver: formResolver(adminUserPasswordResetSchema),
    defaultValues: { password: '' },
  });

  const onSubmit = handleSubmit(async (values: AdminUserPasswordResetInput) => {
    setFormError(null);
    const ok = await confirm({
      title: `¿Restablecer la contraseña de ${label(user)}?`,
      description:
        'La contraseña anterior dejará de funcionar y se cerrarán todas sus sesiones abiertas.',
      confirmLabel: 'Restablecer',
      destructive: true,
    });
    if (!ok) return;
    try {
      await browserApi.post(`/admin/users/${user.id}/reset-password`, values);
    } catch (error) {
      setFormError(showApiError(error, setError, ['password']));
      return;
    }
    toast.success('Contraseña restablecida. Las sesiones del usuario se cerraron.');
    onDone();
  });

  return (
    <FormModal
      open
      onClose={onDone}
      title="Restablecer contraseña"
      description={
        <span className="break-all">
          {label(user)} · {user.email}
        </span>
      }
      size="sm"
      dirty={isDirty}
      onSubmit={onSubmit}
      submitting={isSubmitting}
      submitLabel="Restablecer contraseña"
    >
      <FormAlert message={formError} />
      <div className="grid gap-5">
        <PasswordField
          label="Nueva contraseña"
          autoComplete="new-password"
          required
          hint={PASSWORD_HINT}
          error={errors.password}
          registration={register('password')}
        />
      </div>
    </FormModal>
  );
}
