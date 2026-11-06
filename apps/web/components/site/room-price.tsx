import { ui } from '@/lib/i18n/es';
import { formatRoomPrice, type RoomPriceInput } from '@/lib/public/format';

/**
 * Informative rate (requirements 4.4, 17.6): "Desde $ X por noche" + taxes note, or "Consultar
 * tarifa" when the type has no published rate (never an invented figure). Never a booking price.
 */
export function RoomPrice({
  room,
  size = 'md',
  showConfirmNote = false,
}: {
  room: RoomPriceInput;
  size?: 'md' | 'lg';
  showConfirmNote?: boolean;
}) {
  const price = formatRoomPrice(room);
  if (!price) {
    return (
      <div>
        <p className={`font-display text-charcoal ${size === 'lg' ? 'text-2xl' : 'text-lg'}`}>
          {ui.rooms.noPrice}
        </p>
        <p className="mt-1 text-sm text-muted-foreground">{ui.rooms.noPriceNote}</p>
      </div>
    );
  }
  return (
    <div>
      <p className="text-sm text-muted-foreground">
        <span className="sr-only">{price.summary}</span>
        <span aria-hidden="true">
          {ui.rooms.from}{' '}
          <span className={`font-display text-charcoal ${size === 'lg' ? 'text-3xl' : 'text-xl'}`}>
            {price.amount}
          </span>{' '}
          {price.unit}
        </span>
      </p>
      <p className="mt-1 text-xs text-muted-foreground" aria-hidden="true">
        {price.taxes}
      </p>
      {showConfirmNote ? (
        <p className="mt-2 text-xs leading-normal text-muted-foreground">{ui.rooms.confirm}</p>
      ) : null}
    </div>
  );
}
