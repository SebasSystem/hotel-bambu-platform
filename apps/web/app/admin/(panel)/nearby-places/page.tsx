import { MapPin, Pencil } from 'lucide-react';
import type { Metadata } from 'next';
import { ButtonLink, Card, CardHeader, PageHeader, WarningBadge } from '@/components/admin/ui';
import { serverApi } from '@/lib/api/server';
import type { HotelProfile, NearbyPlace } from '@/lib/api/types';
import { NearbyPlacesManager } from './nearby-places-manager';

export const metadata: Metadata = { title: 'Ubicación y lugares cercanos' };

export default async function NearbyPlacesPage() {
  const [items, hotel] = await Promise.all([
    serverApi.get<NearbyPlace[]>('/admin/nearby-places'),
    serverApi.get<HotelProfile>('/admin/hotel'),
  ]);
  const address = [hotel.address, hotel.municipality, hotel.department].filter(Boolean).join(', ');
  const hasCoordinates = hotel.latitude !== null && hotel.longitude !== null;
  return (
    <>
      <PageHeader
        title="Ubicación y lugares cercanos"
        description="La ubicación del hotel y los sitios de interés con distancia y tiempo de viaje. Se muestran en la portada y en «Ubicación y cómo llegar»."
      />
      <div className="grid gap-[18px]">
        <Card>
          <CardHeader
            title="Ubicación del hotel"
            description="Se edita en «Datos del hotel», junto con el teléfono y los horarios."
            actions={
              <ButtonLink href="/admin/hotel#ubicacion" variant="secondary" size="sm">
                <Pencil aria-hidden="true" className="size-4" /> Editar ubicación
              </ButtonLink>
            }
          />
          <dl className="grid gap-4 text-sm tab:grid-cols-2">
            <div>
              <dt className="text-[0.8125rem] text-muted-foreground">Dirección</dt>
              <dd className="mt-0.5 flex items-start gap-2 font-semibold">
                <MapPin aria-hidden="true" className="mt-0.5 size-4 shrink-0 text-green" />
                {address || <WarningBadge>Sin dirección</WarningBadge>}
              </dd>
            </div>
            <div>
              <dt className="text-[0.8125rem] text-muted-foreground">Coordenadas del mapa</dt>
              <dd className="mt-0.5 font-semibold tabular-nums">
                {hasCoordinates ? (
                  `${hotel.latitude}, ${hotel.longitude}`
                ) : (
                  <WarningBadge>Sin coordenadas</WarningBadge>
                )}
              </dd>
            </div>
          </dl>
        </Card>
        <section aria-labelledby="lugares" className="grid gap-3">
          <div>
            <h2 id="lugares" className="text-lg">
              Lugares cercanos
            </h2>
            <p className="mt-0.5 text-sm text-muted-foreground">
              Escriba solo medidas reales (por ejemplo, «1,2 km» y «5 min en carro»).
            </p>
          </div>
          <NearbyPlacesManager items={items} />
        </section>
      </div>
    </>
  );
}
