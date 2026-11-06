'use client';

import { CircleAlert } from 'lucide-react';
import { useId, type ReactNode } from 'react';
import type { FieldError, UseFormRegisterReturn } from 'react-hook-form';
import { cx } from './ui';

/**
 * Form controls (mockup `.field`, defect 10 fixed): 48 px tall, 12 px radius, regular 15 px text.
 * The mockup inputs inherited the label's 11.5 px bold; labels are separate elements here.
 */
export const inputClasses = cx(
  'block min-h-12 w-full rounded-sm border border-input bg-white px-3.5 py-2.5',
  'text-[0.95rem] leading-snug font-normal text-foreground transition-colors',
  'placeholder:text-ink-muted hover:border-ink-muted',
  'aria-invalid:border-danger aria-invalid:bg-[#fdf6f6]',
  'disabled:cursor-not-allowed disabled:bg-ivory disabled:opacity-70',
);

/** Error line under a control: icon + text, announced through aria-describedby. */
function FieldError({ id, message }: { id?: string; message: string }) {
  return (
    <p id={id} className="flex items-start gap-1.5 text-[0.8125rem] font-semibold text-danger">
      <CircleAlert aria-hidden="true" className="mt-px size-4 shrink-0" strokeWidth={2} />
      {message}
    </p>
  );
}

interface ControlProps {
  id: string;
  'aria-describedby'?: string;
  'aria-invalid'?: boolean;
}

export interface FieldProps {
  label: ReactNode;
  hint?: ReactNode;
  error?: Pick<FieldError, 'message'> | { message?: string } | undefined;
  required?: boolean;
  className?: string;
  children: (control: ControlProps) => ReactNode;
}

/** Label + control + hint + error, wired with htmlFor / aria-describedby / aria-invalid (18.3). */
export function Field({ label, hint, error, required, className, children }: FieldProps) {
  const id = useId();
  const hintId = hint ? `${id}-hint` : undefined;
  const errorId = error?.message ? `${id}-error` : undefined;
  const describedBy = [hintId, errorId].filter(Boolean).join(' ') || undefined;
  return (
    <div className={cx('flex min-w-0 flex-col gap-1.5', className)}>
      <label htmlFor={id} className="text-sm font-semibold text-foreground">
        {label}
        {required ? (
          <span className="text-destructive" aria-hidden="true">
            {' '}
            *
          </span>
        ) : null}
        {required ? <span className="sr-only"> (obligatorio)</span> : null}
      </label>
      {children({
        id,
        'aria-describedby': describedBy,
        'aria-invalid': errorId ? true : undefined,
      })}
      {hint ? (
        <p id={hintId} className="text-[0.8125rem] leading-snug text-muted-foreground">
          {hint}
        </p>
      ) : null}
      {errorId ? <FieldError id={errorId} message={error?.message ?? ''} /> : null}
    </div>
  );
}

type BaseProps = Omit<FieldProps, 'children'> & { registration: UseFormRegisterReturn };

export function TextField({
  registration,
  type = 'text',
  autoComplete,
  placeholder,
  inputMode,
  ...field
}: BaseProps & {
  type?: string;
  autoComplete?: string;
  placeholder?: string;
  inputMode?: 'text' | 'numeric' | 'decimal' | 'tel' | 'email' | 'url';
}) {
  return (
    <Field {...field}>
      {(control) => (
        <input
          {...control}
          {...registration}
          type={type}
          autoComplete={autoComplete}
          placeholder={placeholder}
          inputMode={inputMode}
          className={inputClasses}
        />
      )}
    </Field>
  );
}

export function TextAreaField({ registration, rows = 4, ...field }: BaseProps & { rows?: number }) {
  return (
    <Field {...field}>
      {(control) => (
        <textarea
          {...control}
          {...registration}
          rows={rows}
          className={cx(inputClasses, 'min-h-28 resize-y leading-normal')}
        />
      )}
    </Field>
  );
}

export function SelectField({
  registration,
  options,
  placeholder,
  ...field
}: BaseProps & { options: readonly { value: string; label: string }[]; placeholder?: string }) {
  return (
    <Field {...field}>
      {(control) => (
        <select {...control} {...registration} className={cx(inputClasses, 'pr-9')}>
          {placeholder !== undefined ? <option value="">{placeholder}</option> : null}
          {options.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      )}
    </Field>
  );
}

/** Checkbox with label on the right; 24px+ target (18.3). */
export function CheckboxField({
  registration,
  label,
  hint,
  error,
}: {
  registration: UseFormRegisterReturn;
  label: ReactNode;
  hint?: ReactNode;
  error?: { message?: string };
}) {
  const id = useId();
  const hintId = hint ? `${id}-hint` : undefined;
  return (
    <div className="flex items-start gap-3 rounded-sm border border-line bg-ivory/60 px-3.5 py-3">
      <input
        id={id}
        type="checkbox"
        {...registration}
        aria-describedby={hintId}
        className="mt-0.5 size-5 shrink-0 accent-(--primary)"
      />
      <div className="min-w-0">
        <label htmlFor={id} className="text-sm font-semibold">
          {label}
        </label>
        {hint ? (
          <p id={hintId} className="mt-0.5 text-[0.8125rem] leading-snug text-muted-foreground">
            {hint}
          </p>
        ) : null}
        {error?.message ? <FieldError message={error.message} /> : null}
      </div>
    </div>
  );
}

/** A titled group of fields in a white card; `id` makes it a deep-link target (dashboard). */
export function FormSection({
  id,
  title,
  description,
  children,
}: {
  id?: string;
  title: string;
  description?: string;
  children: ReactNode;
}) {
  const titleId = useId();
  return (
    <section
      id={id}
      aria-labelledby={titleId}
      className="scroll-mt-24 rounded-2xl border border-line bg-white p-5 tab:p-6"
    >
      <h2 id={titleId} className="font-sans text-base leading-snug font-bold tracking-normal">
        {title}
      </h2>
      {description ? <p className="mt-1 text-sm text-muted-foreground">{description}</p> : null}
      <div className="mt-5 grid gap-5 md:grid-cols-2">{children}</div>
    </section>
  );
}

/** Banner for errors not tied to a field. */
export function FormAlert({ message }: { message?: string | null }) {
  if (!message) return null;
  return (
    <div
      role="alert"
      className="flex items-start gap-2 rounded-sm border border-danger bg-[#fdf6f6] p-3.5 text-sm font-semibold text-danger"
    >
      <CircleAlert aria-hidden="true" className="mt-px size-4 shrink-0" strokeWidth={2} />
      {message}
    </div>
  );
}
