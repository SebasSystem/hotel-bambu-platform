import { BadRequestException, type PipeTransform } from '@nestjs/common';
import type { z } from 'zod';

export interface ValidationIssue {
  path: string;
  message: string;
  code: string;
}

export function toValidationIssues(error: z.ZodError): ValidationIssue[] {
  return error.issues.map((issue) => ({
    path: issue.path.map(String).join('.'),
    message: issue.message,
    code: issue.code,
  }));
}

/**
 * Validates a request part with a shared Zod schema (ADR 0008 / requirement 12.8). Strict schemas
 * reject unexpected properties. Responds 400 with `details` listing every issue.
 */
export class ZodValidationPipe<T extends z.ZodType> implements PipeTransform<unknown, z.output<T>> {
  constructor(private readonly schema: T) {}

  transform(value: unknown): z.output<T> {
    const result = this.schema.safeParse(value);
    if (!result.success) {
      throw new BadRequestException({
        message: 'Validation failed',
        details: toValidationIssues(result.error),
      });
    }
    return result.data;
  }
}

/** Shorthand: `@Body(zod(schema)) body: z.output<typeof schema>`. */
export function zod<T extends z.ZodType>(schema: T): ZodValidationPipe<T> {
  return new ZodValidationPipe(schema);
}
