import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { requireSession } from './access';
import { errorResponse } from './api-response';

type HandlerContext = {
  params?: any;
};

type ApiGuardOptions<BodySchema extends z.ZodTypeAny, ParamsSchema extends z.ZodTypeAny> = {
  bodySchema?: BodySchema;
  paramsSchema?: ParamsSchema;
  requireAuth?: boolean;
};

export function withApiGuard<
  BodySchema extends z.ZodTypeAny = z.ZodTypeAny,
  ParamsSchema extends z.ZodTypeAny = z.ZodTypeAny
>(
  options: ApiGuardOptions<BodySchema, ParamsSchema>,
  handler: (
    req: NextRequest,
    ctx: {
      body: z.infer<BodySchema>;
      params: z.infer<ParamsSchema>;
      session: any; // The session object
    }
  ) => Promise<NextResponse>
) {
  return async (req: NextRequest, rawCtx: HandlerContext): Promise<NextResponse> => {
    try {
      // 1. Auth check
      let session = null;
      if (options.requireAuth !== false) {
        session = await requireSession();
        if (!session) {
          return errorResponse('UNAUTHORIZED', 'Authentication required', 401);
        }
      }

      // 2. Params validation
      let parsedParams = {} as z.infer<ParamsSchema>;
      if (options.paramsSchema && rawCtx.params) {
        const resolvedParams = await rawCtx.params;
        const paramsResult = options.paramsSchema.safeParse(resolvedParams);
        if (!paramsResult.success) {
          return errorResponse('INVALID_PARAMS', 'Invalid URL parameters', 400, paramsResult.error.flatten().fieldErrors);
        }
        parsedParams = paramsResult.data;
      }

      // 3. Body validation
      let parsedBody = {} as z.infer<BodySchema>;
      if (options.bodySchema) {
        // Enforce basic request size limit by checking content-length
        const contentLength = req.headers.get('content-length');
        if (contentLength && parseInt(contentLength, 10) > 5 * 1024 * 1024) { // 5MB limit
          return errorResponse('PAYLOAD_TOO_LARGE', 'Request body is too large', 413);
        }

        let bodyData;
        try {
          bodyData = await req.json();
        } catch (e) {
          return errorResponse('BAD_REQUEST', 'Invalid JSON body', 400);
        }

        const bodyResult = options.bodySchema.safeParse(bodyData);
        if (!bodyResult.success) {
          return errorResponse('VALIDATION_ERROR', 'Invalid request body', 422, bodyResult.error.flatten().fieldErrors);
        }
        parsedBody = bodyResult.data;
      }

      // Execute handler
      return await handler(req, { body: parsedBody, params: parsedParams, session });

    } catch (error: any) {
      console.error('[API Error]', error);
      // Don't leak internal stacks in response
      return errorResponse('INTERNAL_ERROR', 'An unexpected error occurred', 500);
    }
  };
}
