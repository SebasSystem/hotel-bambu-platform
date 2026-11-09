# Legal checklist before publishing (requirement 17.8)

> **A lawyer must review the legal texts before publication.** The texts in `/legal/*` are templates written from requirements 17.1–17.7. They are not legal advice and do not guarantee compliance. They follow Ley 1581 de 2012 and Decreto 1377 de 2013 (compiled in Decreto Único Reglamentario 1074 de 2015, Libro 2, Parte 2, Título 2, Capítulo 25). The hotel must confirm that they describe its real operation.

## How the legal pages work

- **Pages:**
  - `/legal/tratamiento-de-datos`: data-processing policy
  - `/legal/aviso-de-privacidad`: privacy notice
  - `/legal/cookies`: cookie policy, with the inventory and the "Configurar cookies" button
- **Source:** `apps/web/components/legal/legal-documents.tsx`. Hotel facts come from admin › Información del hotel. The controller's identity is never invented: a missing fact shows as a highlighted `[pendiente: …]` marker.
- **Draft mode** (default, `LEGAL_APPROVED` unset):
  - Each page shows a "Borrador pendiente de aprobación" banner that lists every `TODO(hotel)`.
  - The pages answer `noindex` and are left out of `sitemap.xml`.
- **Approval:**
  1. Fill in the data in the admin (see below).
  2. Have the adviser review and edit the texts in code.
  3. Set `LEGAL_EFFECTIVE_DATE=YYYY-MM-DD` and `LEGAL_APPROVED=true`, then restart the web.
- **Material change to the cookie policy:** bump `CONSENT_POLICY_VERSION` in `apps/web/lib/consent/consent.ts`. Every visitor is asked again (17.5.10).

## Data the hotel must provide (admin › Información del hotel)

| Field | Used for |
|---|---|
| Razón social (`legalName`) | Controller identity. Write the legal name **and NIT**, e.g. "Hotel Bambú Plaza S.A.S. — NIT 900.000.000-0" |
| Dirección, municipio, departamento | Controller's address |
| Correo | Channel for consultas y reclamos |
| Teléfono (or WhatsApp) | Contact channel |
| `LEGAL_EFFECTIVE_DATE` (environment) | Effective date shown in every document |

## Checklist (17.8)

- [ ] The hotel is identified as the data controller (razón social, NIT, address, contact channels).
- [ ] The data actually processed is defined, and providers and processors are identified: hosting/VPS, Cloudflare, object storage, email provider, WhatsApp (Meta) as an external service.
- [ ] The data-processing policy matches the real operation: purposes, guest registration (tarjeta de registro hotelero, migration reports) and retention periods.
- [ ] The privacy notice is accessible and the inquiry/claim channel works (someone answers within the legal terms: consultas 10 business days, reclamos 15 business days).
- [ ] Authorization is requested where the law requires it, with no pre-ticked boxes and optional purposes (advertising) separated. Today the site has no forms; review again if one is added.
- [ ] Purposes and retention periods are defined. Aggregated analytics: up to 24 months.
- [ ] Reviewed whether RNBD registration applies (assets > 100,000 UVT, etc., 17.4).
- [ ] Cookies, maps and third-party tools are reviewed and inventoried. In production, confirm cookies set by Cloudflare (e.g. `__cf_bm`) and add them to the inventory if present.
- [ ] Provider contracts and terms reviewed (data-processing terms of the hosting, CDN and storage providers; international transfers if servers are outside Colombia).
- [ ] The hotel decided whether to publish the RNT number (recommended if it is registered; Ley 1558 de 2012 art. 30).
- Removed 2026-11-09 (owner decision): the ESCNNA code of conduct (Ley 1336 de 2009) is the physical notice posted at reception, so neither the site nor the admin carries a notice field.
- [ ] Rates are published with taxes included, or the conditions are approved (Ley 1480 de 2011).
- [ ] Status of the reforms to Ley 1581 verified (bills filed in 2025–2026).
- [ ] The analytics decision is confirmed: by default the aggregated counter runs only with analytics consent (11.2). Measuring without consent requires the adviser's approval and a change to the cookie policy.
- [ ] A lawyer reviewed the three documents. The hotel approved them, and `LEGAL_APPROVED=true` and `LEGAL_EFFECTIVE_DATE` are set.

## Consent evidence

Each decision stores `ConsentRecord` (`POST /api/v1/public/consents`) with: a random id, the categories, the policy version and the timestamp. No IP and no user agent. The same random id is kept in the visitor's `hb_consent` cookie, so a person can identify their own records if they ask.
