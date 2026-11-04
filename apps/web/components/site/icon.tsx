import type { IconKey } from '@hotel-bambu/shared';
import {
  Bath,
  BedDouble,
  BedSingle,
  Car,
  Check,
  Clock,
  Coffee,
  Droplets,
  Fan,
  KeyRound,
  MapPin,
  MessageCircle,
  Mountain,
  Phone,
  Router,
  ShieldCheck,
  ShowerHead,
  SolarPanel,
  Sparkles,
  Sun,
  Trees,
  Tv,
  Users,
  Utensils,
  Wifi,
  type LucideIcon,
} from 'lucide-react';

/** Controlled catalog (`ICON_KEYS`) → Lucide components (art direction: 1.5 px stroke). */
const ICONS: Record<IconKey, LucideIcon> = {
  bath: Bath,
  'shower-head': ShowerHead,
  tv: Tv,
  fan: Fan,
  wifi: Wifi,
  router: Router,
  sun: Sun,
  'solar-panel': SolarPanel,
  droplets: Droplets,
  'bed-single': BedSingle,
  'bed-double': BedDouble,
  users: Users,
  clock: Clock,
  'key-round': KeyRound,
  'shield-check': ShieldCheck,
  'map-pin': MapPin,
  car: Car,
  coffee: Coffee,
  utensils: Utensils,
  mountain: Mountain,
  trees: Trees,
  sparkles: Sparkles,
  phone: Phone,
  'message-circle': MessageCircle,
};

/** Decorative icon (the visible label always accompanies it). */
export function SiteIcon({ iconKey, className }: { iconKey: string | null; className?: string }) {
  const Icon = (iconKey && ICONS[iconKey as IconKey]) || Check;
  return <Icon aria-hidden="true" strokeWidth={1.5} className={className ?? 'size-5'} />;
}
