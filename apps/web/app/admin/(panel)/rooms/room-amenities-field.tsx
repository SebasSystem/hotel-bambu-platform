'use client';

import type { RoomAmenityOverride } from '@hotel-bambu/shared';
import { Button } from '@/components/admin/ui';
import type { Amenity } from '@/lib/api/types';

/**
 * "Comodidades de esta habitación" (owner review A9): the type's amenities are checked by default
 * (inherited); unchecking one marks it as missing in this room, checking another adds it to this
 * room only. The value is the list of differences from the type (the API drops redundant ones).
 */
export function RoomAmenitiesField({
  typeName,
  typeAmenityIds,
  catalog,
  value,
  onChange,
  error,
}: {
  typeName: string | null;
  typeAmenityIds: readonly string[];
  /** ROOM amenities of the catalog. */
  catalog: readonly Amenity[];
  value: readonly RoomAmenityOverride[];
  onChange: (overrides: RoomAmenityOverride[]) => void;
  error?: string;
}) {
  const typeIds = new Set(typeAmenityIds);
  const overrides = new Map(value.map((o) => [o.amenityId, o.available]));
  const fromType = catalog.filter((a) => typeIds.has(a.id));
  const others = catalog.filter((a) => !typeIds.has(a.id));
  const isAvailable = (id: string) => overrides.get(id) ?? typeIds.has(id);

  const setAvailable = (id: string, available: boolean) => {
    const next = value.filter((o) => o.amenityId !== id);
    if (available !== typeIds.has(id)) next.push({ amenityId: id, available });
    onChange(next);
  };

  const row = (amenity: Amenity, inherited: boolean) => {
    const checked = isAvailable(amenity.id);
    const note = inherited
      ? checked
        ? null
        : 'no está en esta habitación'
      : checked
        ? 'solo en esta habitación'
        : null;
    return (
      <label key={amenity.id} className="flex min-h-6 items-center gap-2 text-sm">
        <input
          type="checkbox"
          className="size-5 accent-(--primary)"
          checked={checked}
          onChange={(event) => setAvailable(amenity.id, event.target.checked)}
        />
        <span>
          {amenity.name}
          {!amenity.active ? <span className="text-muted-foreground"> (inactiva)</span> : null}
          {note ? <span className="font-semibold text-warn-fg"> · {note}</span> : null}
        </span>
      </label>
    );
  };

  return (
    <fieldset className="flex flex-col gap-4 rounded-sm border border-border p-4">
      <legend className="px-1 text-sm font-semibold">Comodidades de esta habitación</legend>
      <p className="text-[0.8125rem] leading-snug text-muted-foreground">
        Por defecto tiene las comodidades de su tipo{typeName ? ` «${typeName}»` : ''}. Desmarque
        las que falten en esta habitación o marque otras que solo tenga ella. En el sitio se
        muestran como «en algunas habitaciones» cuando no todas las habitaciones del tipo las
        tienen.
      </p>
      <div className="flex flex-col gap-2">
        <p className="text-sm font-semibold">Del tipo de habitación</p>
        {fromType.length === 0 ? (
          <p className="text-sm text-muted-foreground">Este tipo no tiene comodidades asignadas.</p>
        ) : (
          <div className="grid gap-2 sm:grid-cols-2">{fromType.map((a) => row(a, true))}</div>
        )}
      </div>
      {others.length > 0 ? (
        <div className="flex flex-col gap-2">
          <p className="text-sm font-semibold">Otras comodidades (solo esta habitación)</p>
          <div className="grid gap-2 sm:grid-cols-2">{others.map((a) => row(a, false))}</div>
        </div>
      ) : null}
      {value.length > 0 ? (
        <div>
          <Button variant="ghost" size="sm" onClick={() => onChange([])}>
            Usar solo las del tipo
          </Button>
        </div>
      ) : null}
      {error ? <p className="text-sm font-semibold text-destructive">{error}</p> : null}
    </fieldset>
  );
}
