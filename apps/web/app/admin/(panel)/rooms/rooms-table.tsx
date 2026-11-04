'use client';

import Link from 'next/link';
import { useAction } from '@/components/admin/hooks';
import { MediaThumb } from '@/components/admin/media-thumb';
import { ReorderButtons, moveItem } from '@/components/admin/reorder-buttons';
import { Button, EmptyState, StatusBadge } from '@/components/admin/ui';
import { browserApi } from '@/lib/api/browser';
import type { Room } from '@/lib/api/types';
import { ROOM_TYPE_LABELS } from '@/lib/labels';
import { formatPrice } from './room-format';

export function RoomsTable({ rooms }: { rooms: Room[] }) {
  const { run, busy } = useAction();

  if (rooms.length === 0) return <EmptyState>Todavía no hay habitaciones.</EmptyState>;

  const move = (from: number, to: number) => {
    const ids = moveItem(rooms, from, to).map((room) => room.id);
    void run('order', () => browserApi.put('/admin/rooms/order', { ids }), 'Orden actualizado.');
  };

  return (
    <div className="overflow-x-auto rounded-md border border-border bg-card">
      <table className="w-full text-left text-sm">
        <caption className="sr-only">Habitaciones en el orden en que aparecen en el sitio</caption>
        <thead className="border-b border-border bg-muted">
          <tr>
            <th scope="col" className="p-3">
              Habitación
            </th>
            <th scope="col" className="p-3">
              Tipo
            </th>
            <th scope="col" className="p-3">
              Tarifa
            </th>
            <th scope="col" className="p-3">
              Estado
            </th>
            <th scope="col" className="p-3">
              Orden
            </th>
            <th scope="col" className="p-3">
              <span className="sr-only">Acciones</span>
            </th>
          </tr>
        </thead>
        <tbody>
          {rooms.map((room, index) => {
            const cover = room.images.find((image) => image.isCover);
            const published = room.status === 'PUBLISHED';
            return (
              <tr key={room.id} className="border-b border-border last:border-0">
                <td className="p-3">
                  <div className="flex items-center gap-3">
                    <MediaThumb
                      variants={cover?.media.variants}
                      alt=""
                      className="h-12 w-16 shrink-0 rounded-xs"
                    />
                    <div>
                      <Link
                        href={`/admin/rooms/${room.id}`}
                        className="font-semibold text-primary underline-offset-4 hover:underline"
                      >
                        {room.name}
                      </Link>
                      {room.publicationIssues.length > 0 && !published ? (
                        <p className="text-xs text-muted-foreground">Incompleta para publicar</p>
                      ) : null}
                    </div>
                  </div>
                </td>
                <td className="p-3">{ROOM_TYPE_LABELS[room.type]}</td>
                <td className="p-3 tabular-nums">{formatPrice(room) ?? 'Sin tarifa'}</td>
                <td className="p-3">
                  <StatusBadge status={room.status} />
                </td>
                <td className="p-3">
                  <ReorderButtons
                    index={index}
                    count={rooms.length}
                    label={room.name}
                    onMove={move}
                    disabled={busy !== null}
                  />
                </td>
                <td className="p-3">
                  <div className="flex justify-end gap-2">
                    <Button
                      variant="secondary"
                      size="sm"
                      loading={busy === `status:${room.id}`}
                      onClick={() =>
                        void run(
                          `status:${room.id}`,
                          () =>
                            browserApi.patch(`/admin/rooms/${room.id}/status`, {
                              status: published ? 'DRAFT' : 'PUBLISHED',
                            }),
                          published ? 'Habitación despublicada.' : 'Habitación publicada.',
                        )
                      }
                    >
                      {published ? 'Despublicar' : 'Publicar'}
                    </Button>
                    <Link
                      href={`/admin/rooms/${room.id}`}
                      className="inline-flex min-h-9 items-center px-2 text-sm text-primary underline underline-offset-4"
                    >
                      Editar<span className="sr-only"> {room.name}</span>
                    </Link>
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
