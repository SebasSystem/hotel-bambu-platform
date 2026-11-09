import {
  PERMISSION_AREAS,
  expandPermissions,
  type Permission,
  type PermissionArea,
} from '@hotel-bambu/shared';
import { PERMISSION_AREA_LABELS } from './access';

/**
 * Role permission checklist logic (roles page): one row per area with "Ver" and "Gestionar".
 * Gestionar implies Ver, so checking it adds Ver and Ver stays locked while Gestionar is on.
 */

export interface PermissionRow {
  area: PermissionArea;
  label: string;
  view: boolean;
  manage: boolean;
  /** Ver is implied by Gestionar and cannot be unchecked. */
  viewLocked: boolean;
}

export function togglePermission(
  current: readonly Permission[],
  permission: Permission,
  checked: boolean,
): Permission[] {
  const next = new Set<Permission>(expandPermissions(current));
  const area = permission.split('.')[0] as PermissionArea;
  if (checked) {
    next.add(permission);
  } else if (permission.endsWith('.view') && next.has(`${area}.manage`)) {
    // Locked: Gestionar implies Ver.
  } else {
    next.delete(permission);
  }
  return expandPermissions([...next]);
}

export function permissionRows(current: readonly Permission[]): PermissionRow[] {
  const granted = new Set(expandPermissions(current));
  return PERMISSION_AREAS.map((area) => {
    const manage = granted.has(`${area}.manage`);
    return {
      area,
      label: PERMISSION_AREA_LABELS[area],
      view: granted.has(`${area}.view`),
      manage,
      viewLocked: manage,
    };
  });
}

/** What each area covers, shown under its name in the checklist. */
export const PERMISSION_AREA_HINTS: Record<PermissionArea, string> = {
  dashboard: 'Página de inicio del panel.',
  hotel: 'Datos del hotel, ubicación, lugares cercanos y redes sociales.',
  rooms: 'Tipos de habitación, habitaciones y comodidades.',
  content: 'Portada, carrusel, galería, políticas y preguntas frecuentes.',
  media: 'Biblioteca de fotos: subir, describir y eliminar.',
  activity: 'Registro de cambios y métricas de visitas.',
  users: 'Usuarios del panel y sus roles.',
};

/** Short Spanish summary of a role's permissions ("Habitaciones: gestionar"). */
export function describePermissions(current: readonly Permission[]): string[] {
  return permissionRows(current)
    .filter((row) => row.view)
    .map((row) => `${row.label}: ${row.manage ? 'gestionar' : 'ver'}`);
}
