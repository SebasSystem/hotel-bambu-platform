import {
  type ArgumentsHost,
  Catch,
  type ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import type { FastifyReply, FastifyRequest } from 'fastify';
import { Prisma } from '../generated/prisma/client.js';

export interface ErrorBody {
  statusCode: number;
  error: string;
  message: string;
  details?: unknown;
  requestId?: string;
  [extra: string]: unknown;
}

const STATUS_TEXT: Record<number, string> = {
  400: 'Bad Request',
  401: 'Unauthorized',
  403: 'Forbidden',
  404: 'Not Found',
  405: 'Method Not Allowed',
  406: 'Not Acceptable',
  409: 'Conflict',
  413: 'Payload Too Large',
  415: 'Unsupported Media Type',
  422: 'Unprocessable Entity',
  429: 'Too Many Requests',
  500: 'Internal Server Error',
  503: 'Service Unavailable',
};

function statusText(status: number): string {
  return STATUS_TEXT[status] ?? (status >= 500 ? 'Server Error' : 'Client Error');
}

/** Maps any thrown value to `{ status, body }` without leaking internals (requirement 12.10/16.6). */
export function toErrorResponse(exception: unknown): { status: number; body: ErrorBody } {
  if (exception instanceof HttpException) {
    const status = exception.getStatus();
    const response = exception.getResponse();
    const base: ErrorBody = {
      statusCode: status,
      error: statusText(status),
      message: exception.message,
    };
    if (typeof response === 'string') return { status, body: { ...base, message: response } };
    const extras = { ...(response as Record<string, unknown>) };
    // Nest's default shape uses `message` (string | string[]) and `error`; keep ours canonical.
    const message = Array.isArray(extras['message'])
      ? (extras['message'] as unknown[]).join('; ')
      : typeof extras['message'] === 'string'
        ? extras['message']
        : base.message;
    delete extras['message'];
    delete extras['error'];
    delete extras['statusCode'];
    return { status, body: { ...base, message, ...extras } };
  }

  if (exception instanceof Prisma.PrismaClientKnownRequestError) {
    switch (exception.code) {
      case 'P2002':
        return conflict('A record with the same unique value already exists.');
      case 'P2003':
      case 'P2014':
        return conflict('The record is referenced by other data or references missing data.');
      case 'P2025':
        return {
          status: 404,
          body: { statusCode: 404, error: statusText(404), message: 'Resource not found.' },
        };
    }
  }

  // Fastify/plugin errors (body too large, malformed JSON, multipart limits) carry a 4xx statusCode.
  const statusCode = (exception as { statusCode?: unknown } | null)?.statusCode;
  if (typeof statusCode === 'number' && statusCode >= 400 && statusCode < 500) {
    return {
      status: statusCode,
      body: { statusCode, error: statusText(statusCode), message: statusText(statusCode) },
    };
  }

  return {
    status: 500,
    body: { statusCode: 500, error: statusText(500), message: 'Internal server error.' },
  };
}

function conflict(message: string): { status: number; body: ErrorBody } {
  return { status: 409, body: { statusCode: 409, error: statusText(409), message } };
}

/** Uniform error format: `{ statusCode, error, message, details?, requestId }`. Never a stack. */
@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger('HttpError');

  catch(exception: unknown, host: ArgumentsHost): void {
    const http = host.switchToHttp();
    const request = http.getRequest<FastifyRequest>();
    const reply = http.getResponse<FastifyReply>();
    const { status, body } = toErrorResponse(exception);

    if (status >= HttpStatus.INTERNAL_SERVER_ERROR && !(exception instanceof HttpException)) {
      this.logger.error(
        { err: exception, requestId: request.id, route: request.routeOptions?.url },
        'Unhandled error',
      );
    }
    void reply
      .status(status)
      .header('cache-control', 'no-store')
      .send({ ...body, requestId: request.id });
  }
}
