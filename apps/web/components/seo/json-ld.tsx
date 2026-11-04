import { serializeJsonLd } from '@/lib/seo/json-ld';

/**
 * Structured data block (requirement 19.2). `dangerouslySetInnerHTML` is justified here
 * (requirement 16.4): the payload is JSON built from typed objects and `serializeJsonLd` escapes
 * `<`, so API text cannot close the element. A JSON data block is never executed, so it needs no
 * CSP nonce.
 */
export function JsonLd({ data }: { data: unknown }) {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: serializeJsonLd(data) }}
    />
  );
}
