import { ui } from '@/lib/i18n/es';
import { formatRoomPrice, type RoomPriceInput } from '@/lib/public/format';

/**
 * Informative rate (requirements 4.4, 17.6): "Desde $ X por noche" + taxes note, or the
 * "consult the rate" fallback. Never presented as a booking price.
 */
export function RoomPrice({
  room,
  hasWhatsApp,
  size = 'md',
  showConfirmNote = false,
}: {
  room: RoomPriceInput;
  hasWhatsApp: boolean;
  size?: 'md' | 'lg';
  showConfirmNote?: boolean;
}) {
  const price = formatRoomPrice(room);
  if (!price) {
    return (
      <p className="text-sm font-bold text-green">
        {hasWhatsApp ? ui.rooms.noPrice : ui.rooms.noPriceNoWhatsApp}
      </p>
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
