import type { ReactNode } from 'react';

/**
 * Building blocks for the legal templates (requirement 17.3). A missing hotel fact renders as a
 * visible "pendiente" marker so nobody can publish a document that silently omits it; the draft
 * banner lists the same items as `TODO(hotel)` until `LEGAL_APPROVED=true`.
 */

export interface LegalTodo {
  label: string;
  where: string;
}

/** Value from the hotel profile, or a visible marker naming what is missing. */
export function Fill({ value, label }: { value: string | null | undefined; label: string }) {
  if (value) return <>{value}</>;
  return (
    <mark className="rounded-xs bg-promo/40 px-1 font-semibold text-ink-900">
      [pendiente: {label}]
    </mark>
  );
}

export function DraftBanner({ todos }: { todos: LegalTodo[] }) {
  return (
    <aside
      aria-labelledby="borrador-titulo"
      className="rounded-xl border-2 border-dashed border-earth-600 bg-card p-6"
      data-legal-draft
    >
      <p
        id="borrador-titulo"
        className="text-sm font-semibold tracking-kicker text-earth-600 uppercase"
      >
        Borrador pendiente de aprobación
      </p>
      <p className="mt-3 text-base leading-normal">
        Esta es una plantilla. No es un concepto jurídico. El hotel debe revisarla con su asesor
        legal, completar los datos marcados y confirmar que describe su operación real antes de
        publicarla como definitiva.
      </p>
      {todos.length > 0 ? (
        <ul className="mt-4 grid gap-1 text-sm">
          {todos.map((todo) => (
            <li key={`${todo.label}-${todo.where}`}>
              <code className="font-semibold">TODO(hotel)</code>: {todo.label}{' '}
              <span className="text-muted-foreground">({todo.where})</span>
            </li>
          ))}
        </ul>
      ) : null}
    </aside>
  );
}

export function LegalSection({
  id,
  title,
  children,
}: {
  id: string;
  title: string;
  children: ReactNode;
}) {
  return (
    <section aria-labelledby={id} className="legal-section">
      <h2 id={id}>{title}</h2>
      {children}
    </section>
  );
}
