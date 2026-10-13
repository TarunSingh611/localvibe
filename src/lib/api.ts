import { NextResponse } from 'next/server';
import { z, ZodError } from 'zod';

export class ApiError extends Error {
  constructor(
    public status: number,
    message: string
  ) {
    super(message);
  }
}

export const badRequest = (message: string) => new ApiError(400, message);
export const unauthorized = (message = 'Please sign in to continue') => new ApiError(401, message);
export const forbidden = (message = 'You are not allowed to do that') => new ApiError(403, message);
export const notFound = (message = 'Not found') => new ApiError(404, message);

type Handler<C> = (request: Request, context: C) => Promise<Response>;

export function route<C = unknown>(handler: Handler<C>): Handler<C> {
  return async (request, context) => {
    try {
      return await handler(request, context);
    } catch (error) {
      if (error instanceof ApiError) {
        return NextResponse.json({ error: error.message }, { status: error.status });
      }
      if (error instanceof ZodError) {
        const issue = error.issues[0];
        return NextResponse.json(
          { error: issue?.message ?? 'Invalid request', field: issue?.path.join('.') },
          { status: 400 }
        );
      }
      console.error(`[api] ${request.method} ${new URL(request.url).pathname}`, error);
      return NextResponse.json({ error: 'Something went wrong. Please try again.' }, { status: 500 });
    }
  };
}

export async function parseBody<S extends z.ZodType>(request: Request, schema: S): Promise<z.output<S>> {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    throw badRequest('Invalid JSON body');
  }
  return schema.parse(body);
}

export function ok<T>(data: T, init?: ResponseInit) {
  return NextResponse.json(data, init);
}

export function clientIp(request: Request): string {
  return (
    request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
    request.headers.get('x-real-ip') ||
    'unknown'
  );
}

export function escapeRegex(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}
