import { NextRequest } from 'next/server';
import { prisma } from '@flank/database';
import { CreateTargetRequest, WorkspaceSlugParam } from '@flank/shared';
import { withApiGuard } from '../../../../../lib/api-guard';
import { successResponse, errorResponse } from '../../../../../lib/api-response';
import { requireWorkspaceMember } from '../../../../../lib/access';

export const POST = withApiGuard(
  {
    bodySchema: CreateTargetRequest,
    paramsSchema: WorkspaceSlugParam,
  },
  async (req: NextRequest, { body, params, session }) => {
    const { workspaceSlug } = params;
    
    // Ensure the user is a member of the workspace
    const workspace = await requireWorkspaceMember(session.user.id, workspaceSlug);
    if (!workspace) {
      return errorResponse('NOT_FOUND', 'Workspace not found', 404);
    }

    // Normalize URL
    let parsedUrl: URL;
    try {
      parsedUrl = new URL(body.url);
    } catch {
      return errorResponse('VALIDATION_ERROR', 'Invalid URL format', 422);
    }
    const domain = parsedUrl.hostname;

    const target = await prisma.target.create({
      data: {
        domain,
        url: body.url,
        workspaceId: workspace.id,
      },
    });

    return successResponse(target, undefined, 201);
  }
);
