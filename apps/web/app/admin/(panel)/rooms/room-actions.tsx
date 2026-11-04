'use client';

import { ExternalLink } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useConfirm } from '@/components/admin/feedback';
import { useAction } from '@/components/admin/hooks';
import { Button, Card, StatusBadge } from '@/components/admin/ui';
import { browserApi } from '@/lib/api/browser';
import type { Room } from '@/lib/api/types';
import { translateMessage } from '@/lib/forms/messages';
import { publicRoomPath } from './room-format';

const ISSUE_LABELS: Record<string, string> = {
  name: 'Falta el nombre.',
  slug: 'Falta el identificador (slug).',
  shortDescription: 'Falta la descripción corta.',
  capacity: 'La capacidad debe ser al menos 1.',
  coverImage: 'Falta una imagen principal procesada y con texto alternativo.',
};

/** Status (publish / unpublish / deactivate), "Ver en el sitio" and delete. */
export function RoomActions({ room }: { room: Room }) {
  const router = useRouter();
  const confirm = useConfirm();
  const { run, busy } = useAction();
  const published = room.status === 'PUBLISHED';

  const setStatus = (status: Room['status'], message: string) =>
    void run(
      `status:${status}`,
      () => browserApi.patch(`/admin/rooms/${room.id}/status`, { status }),
      message,
    );

  const remove = async () => {
    const ok = await confirm({
      title: '¿Eliminar habitación?',
      description: `«${room.name}» se eliminará definitivamente. Las imágenes siguen en la biblioteca.`,
      confirmLabel: 'Eliminar',
      destructive: true,
    });
    if (!ok) return;
    const result = await run(
      'delete',
      async () => {
        await browserApi.delete(`/admin/rooms/${room.id}`);
        return true;
      },
      'Habitación eliminada.',
    );
    if (result) router.push('/admin/rooms');
  };

  return (
    <Card>
      <div className="flex flex-wrap items-center gap-3">
        <span className="text-sm font-semibold">Estado:</span>
        <StatusBadge status={room.status} />
        {published ? (
          <Link
            href={publicRoomPath(room.slug)}
            target="_blank"
            className="inline-flex items-center gap-1 text-sm text-primary underline underline-offset-4"
          >
            Ver en el sitio <ExternalLink aria-hidden="true" className="size-4" />
            <span className="sr-only">(se abre en una pestaña nueva)</span>
          </Link>
        ) : null}
      </div>
      {!published && room.publicationIssues.length > 0 ? (
        <div className="mt-3 text-sm">
          <p className="font-semibold">Para publicar falta:</p>
          <ul className="ml-5 list-disc">
            {room.publicationIssues.map((issue) => (
              <li key={issue}>{ISSUE_LABELS[issue] ?? translateMessage(issue)}</li>
            ))}
          </ul>
        </div>
      ) : null}
      <div className="mt-4 flex flex-wrap gap-2">
        {published ? (
          <Button
            variant="secondary"
            loading={busy === 'status:DRAFT'}
            onClick={() => setStatus('DRAFT', 'Habitación despublicada.')}
          >
            Despublicar
          </Button>
        ) : (
          <Button
            loading={busy === 'status:PUBLISHED'}
            onClick={() => setStatus('PUBLISHED', 'Habitación publicada.')}
          >
            Publicar
          </Button>
        )}
        {room.status !== 'INACTIVE' ? (
          <Button
            variant="secondary"
            loading={busy === 'status:INACTIVE'}
            onClick={() => setStatus('INACTIVE', 'Habitación desactivada (oculta del sitio).')}
          >
            Desactivar
          </Button>
        ) : null}
        <Button
          variant="danger"
          loading={busy === 'delete'}
          disabled={published}
          title={published ? 'Despublique la habitación antes de eliminarla.' : undefined}
          onClick={() => void remove()}
        >
          Eliminar
        </Button>
      </div>
      {published ? (
        <p className="mt-2 text-xs text-muted-foreground">
          Para eliminarla, primero despublíquela.
        </p>
      ) : null}
      {room.slugRedirects.length > 0 ? (
        <p className="mt-3 text-xs text-muted-foreground">
          Enlaces anteriores que redirigen aquí:{' '}
          {room.slugRedirects.map((r) => r.oldSlug).join(', ')}
        </p>
      ) : null}
    </Card>
  );
}
