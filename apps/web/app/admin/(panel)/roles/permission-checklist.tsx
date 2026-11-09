'use client';

import { hasPermission, type Permission } from '@hotel-bambu/shared';
import { useId } from 'react';
import { Notice, cx } from '@/components/admin/ui';
import {
  PERMISSION_AREA_HINTS,
  permissionRows,
  togglePermission,
} from '@/lib/admin/permission-checklist';

const box = 'size-5 shrink-0 accent-(--primary) disabled:cursor-not-allowed';

/**
 * Role permissions grouped by area: one fieldset per area with native "Ver" and "Gestionar"
 * checkboxes (keyboard operable). Gestionar implies Ver, so Ver is checked and locked while
 * Gestionar is on (lib/admin/permission-checklist.ts).
 */
export function PermissionChecklist({
  value,
  onChange,
  readOnly = false,
  error,
}: {
  value: readonly Permission[];
  onChange: (next: Permission[]) => void;
  readOnly?: boolean;
  error?: string;
}) {
  const id = useId();
  const lockedHintId = `${id}-locked`;
  const rows = permissionRows(value);
  const fullControl = hasPermission(value, 'users.manage');

  return (
    <fieldset className="flex min-w-0 flex-col gap-3">
      <legend className="mb-1 text-sm font-semibold text-foreground">Permisos</legend>
      <p className="text-[0.8125rem] leading-snug text-muted-foreground">
        «Ver» permite abrir la sección; «Gestionar» permite además crear, editar y eliminar (incluye
        «Ver»).
      </p>
      <span id={lockedHintId} className="sr-only">
        Incluido en Gestionar.
      </span>
      <ul className="grid gap-2">
        {rows.map((row) => (
          <li key={row.area}>
            <fieldset className="flex flex-wrap items-center gap-x-6 gap-y-2 rounded-sm border border-line bg-ivory/60 px-3.5 py-3">
              <legend className="sr-only">{row.label}</legend>
              <div aria-hidden="true" className="min-w-[12rem] flex-1">
                <p className="text-sm font-semibold">{row.label}</p>
                <p className="text-[0.8125rem] leading-snug text-muted-foreground">
                  {PERMISSION_AREA_HINTS[row.area]}
                </p>
              </div>
              <label
                className={cx(
                  'inline-flex min-h-11 items-center gap-2 text-sm',
                  (readOnly || row.viewLocked) && 'text-muted-foreground',
                )}
              >
                <input
                  type="checkbox"
                  className={box}
                  checked={row.view}
                  disabled={readOnly || row.viewLocked}
                  aria-describedby={row.viewLocked ? lockedHintId : undefined}
                  onChange={(event) =>
                    onChange(togglePermission(value, `${row.area}.view`, event.target.checked))
                  }
                />
                Ver
              </label>
              <label
                className={cx(
                  'inline-flex min-h-11 items-center gap-2 text-sm',
                  readOnly && 'text-muted-foreground',
                )}
              >
                <input
                  type="checkbox"
                  className={box}
                  checked={row.manage}
                  disabled={readOnly}
                  onChange={(event) =>
                    onChange(togglePermission(value, `${row.area}.manage`, event.target.checked))
                  }
                />
                Gestionar
              </label>
            </fieldset>
          </li>
        ))}
      </ul>
      {fullControl && !readOnly ? (
        <Notice tone="warning" title="Gestionar usuarios y roles da control total">
          Quien tenga este permiso puede crear usuarios y roles con cualquier permiso, incluido
          este. Asígnelo solo a personas de plena confianza.
        </Notice>
      ) : null}
      {error ? (
        <p role="alert" className="text-[0.8125rem] font-semibold text-danger">
          {error}
        </p>
      ) : null}
    </fieldset>
  );
}
