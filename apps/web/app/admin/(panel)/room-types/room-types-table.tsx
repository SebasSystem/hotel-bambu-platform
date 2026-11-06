'use client';

import { Pencil } from 'lucide-react';
import Link from 'next/link';
import { useAction } from '@/components/admin/hooks';
import { MediaThumb } from '@/components/admin/media-thumb';
import { PublishSwitch } from '@/components/admin/publish-switch';
import { ReorderButtons, moveItem } from '@/components/admin/reorder-buttons';
import { EmptyState, WarningBadge, buttonClasses, panelClasses } from '@/components/admin/ui';
import { browserApi } from '@/lib/api/browser';
import type { RoomType } from '@/lib/api/types';
import { ROOM_TYPE_LABELS } from '@/lib/labels';
import { formatPrice } from './room-type-format';

const th =
  'px-2.5 py-3 text-[0.6875rem] font-bold tracking-[0.08em] text-muted-foreground uppercase';
/** Below `tab` each row is a card: cells stack, and the mobile-only labels name them. */
const td = 'px-2.5 py-1 tab:py-3.5';
const mobileLabel = 'mr-1.5 text-muted-foreground tab:hidden';

/**
 * Room type list (mockup `.data-table`): cover, name, kind, published rooms, rate, an inline publish
 * switch, order and edit. A table from `tab` up; a card per type on phones (no horizontal scroll).
 */
export function RoomTypesTable({ rooms }: { rooms: RoomType[] }) {
  const { run, busy } = useAction();

  if (rooms.length === 0) return <EmptyState>Todavía no hay tipos de habitación.</EmptyState>;

  const move = (from: number, to: number) => {
    const ids = moveItem(rooms, from, to).map((room) => room.id);
    void run(
      'order',
      () => browserApi.put('/admin/room-types/order', { ids }),
      'Orden actualizado.',
    );
  };

  return (
    <div className={`${panelClasses} p-2 tab:px-[22px] tab:py-3`}>
      <table className="w-full text-left text-[0.875rem] max-tab:block">
        <caption className="sr-only">
          Tipos de habitación en el orden en que aparecen en el sitio
        </caption>
        <thead className="border-b border-line max-tab:sr-only">
          <tr>
            <th scope="col" className={th}>
              Tipo de habitación
            </th>
            <th scope="col" className={th}>
              Categoría
            </th>
            <th scope="col" className={th}>
              Habitaciones publicadas
            </th>
            <th scope="col" className={th}>
              Tarifa
            </th>
            <th scope="col" className={th}>
              Publicación
            </th>
            <th scope="col" className={th}>
              Orden
            </th>
            <th scope="col" className={th}>
              <span className="sr-only">Acciones</span>
            </th>
          </tr>
        </thead>
        <tbody className="max-tab:grid max-tab:gap-2">
          {rooms.map((room, index) => {
            const cover = room.images.find((image) => image.isCover);
            const published = room.status === 'PUBLISHED';
            const blocked = !published && room.publicationIssues.length > 0;
            const price = formatPrice(room);
            return (
              <tr
                key={room.id}
                className="border-line max-tab:grid max-tab:grid-cols-2 max-tab:gap-x-3 max-tab:rounded-sm max-tab:border max-tab:p-3 tab:border-b tab:last:border-0"
              >
                <td className={`${td} max-tab:col-span-2`}>
                  <div className="flex items-center gap-3">
                    <MediaThumb
                      variants={cover?.media.variants}
                      alt=""
                      className="h-10 w-12 shrink-0 rounded-xs"
                    />
                    <div className="min-w-0">
                      <Link
                        href={`/admin/room-types/${room.id}`}
                        className="font-bold text-foreground underline-offset-4 hover:text-green hover:underline"
                      >
                        {room.name}
                      </Link>
                      {blocked ? (
                        <p className="mt-1">
                          <WarningBadge>Incompleto para publicar</WarningBadge>
                        </p>
                      ) : null}
                    </div>
                  </div>
                </td>
                <td className={td}>
                  <span className={mobileLabel}>Categoría:</span>
                  {ROOM_TYPE_LABELS[room.type]}
                </td>
                <td className={`${td} tabular-nums`}>
                  <span className={mobileLabel}>Publicadas:</span>
                  {room.publishedRoomCount} de {room.roomCount}
                </td>
                <td className={`${td} max-tab:col-span-2`}>
                  <span className={mobileLabel}>Tarifa:</span>
                  {price ? (
                    <span className="tabular-nums">{price}</span>
                  ) : (
                    <Link
                      href={`/admin/room-types/${room.id}#tarifa`}
                      className="font-bold text-warn-fg underline underline-offset-4"
                    >
                      Sin tarifa
                      <span className="sr-only"> en {room.name}: agregar</span>
                    </Link>
                  )}
                </td>
                <td className={td}>
                  <PublishSwitch
                    endpoint={`/admin/room-types/${room.id}/status`}
                    name={room.name}
                    status={room.status}
                    disabled={blocked}
                    title={blocked ? 'Complete los datos del tipo para publicarlo.' : undefined}
                  />
                </td>
                <td className={`${td} max-tab:justify-self-end`}>
                  <ReorderButtons
                    index={index}
                    count={rooms.length}
                    label={room.name}
                    onMove={move}
                    disabled={busy !== null}
                  />
                </td>
                <td className={`${td} max-tab:col-span-2 tab:text-right`}>
                  <Link
                    href={`/admin/room-types/${room.id}`}
                    className={buttonClasses('secondary', 'sm', 'max-tab:w-full')}
                  >
                    <Pencil aria-hidden="true" className="size-4" />
                    Editar<span className="sr-only"> {room.name}</span>
                  </Link>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
