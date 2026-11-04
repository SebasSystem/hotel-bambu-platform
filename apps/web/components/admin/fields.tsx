'use client';

import { useId, type ReactNode } from 'react';
import type { FieldError, UseFormRegisterReturn } from 'react-hook-form';
import { cx } from './ui';

export const inputClasses = cx(
  'block w-full rounded-sm border border-input bg-card px-3 py-2 text-base text-foreground',
  'placeholder:text-muted-foreground aria-invalid:border-destructive',
  'disabled:cursor-not-allowed disabled:opacity-60',
);

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
    <div className={cx('flex flex-col gap-1.5', className)}>
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
        <p id={hintId} className="text-xs text-muted-foreground">
          {hint}
        </p>
      ) : null}
      {errorId ? (
        <p id={errorId} className="text-sm font-semibold text-destructive">
          {error?.message}
        </p>
      ) : null}
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
        <textarea {...control} {...registration} rows={rows} className={inputClasses} />
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
        <select {...control} {...registration} className={inputClasses}>
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
    <div className="flex items-start gap-3">
      <input
        id={id}
        type="checkbox"
        {...registration}
        aria-describedby={hintId}
        className="mt-0.5 size-5 shrink-0 accent-(--primary)"
      />
      <div>
        <label htmlFor={id} className="text-sm font-semibold">
          {label}
        </label>
        {hint ? (
          <p id={hintId} className="text-xs text-muted-foreground">
            {hint}
          </p>
        ) : null}
        {error?.message ? (
          <p className="text-sm font-semibold text-destructive">{error.message}</p>
        ) : null}
      </div>
    </div>
  );
}

export function FormSection({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children: ReactNode;
}) {
  return (
    <fieldset className="rounded-md border border-border bg-card p-5">
      <legend className="px-1 text-base font-semibold text-bamboo-900">{title}</legend>
      {description ? <p className="mb-4 text-sm text-muted-foreground">{description}</p> : null}
      <div className="grid gap-4 md:grid-cols-2">{children}</div>
    </fieldset>
  );
}

/** Banner for errors not tied to a field. */
export function FormAlert({ message }: { message?: string | null }) {
  if (!message) return null;
  return (
    <div
      role="alert"
      className="rounded-sm border border-destructive bg-card p-3 text-sm font-semibold text-destructive"
    >
      {message}
    </div>
  );
}
