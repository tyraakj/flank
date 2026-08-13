import { NextResponse } from 'next/server';
import { ApiResponse } from '@flank/shared';

export function successResponse<T>(data: T, meta?: Record<string, any>, status = 200): NextResponse<ApiResponse<T>> {
  return NextResponse.json(
    { data, meta },
    {
      status,
      headers: {
        'Cache-Control': 'no-store, max-age=0',
      },
    }
  );
}

export function errorResponse(
  code: string,
  message: string,
  status: number,
  fields?: Record<string, any>
): NextResponse<ApiResponse<any>> {
  return NextResponse.json(
    { error: { code, message, fields } },
    {
      status,
      headers: {
        'Cache-Control': 'no-store, max-age=0',
      },
    }
  );
}
