import { notFound } from 'next/navigation';

/**
 * Unknown public URLs render the branded 404 inside the site shell (header, footer, WhatsApp)
 * instead of the bare root not-found page. Static routes and `/api/v1/*` rewrites match first.
 */
export default function MissingPage() {
  notFound();
}
