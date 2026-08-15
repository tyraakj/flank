import { NextRequest } from "next/server";
import { prisma } from "@flank/database";
import { CreateTargetRequest, WorkspaceSlugParam } from "@flank/shared";
import { withApiGuard } from "@/lib/api-guard";
import { successResponse, errorResponse } from "@/lib/api-response";
import { requireWorkspaceMember } from "@/lib/access";

export const POST = withApiGuard(
  {
    bodySchema: CreateTargetRequest,
    paramsSchema: WorkspaceSlugParam,
  },
  async (req: NextRequest, { body, params, _session }: unknown) => {
    const { workspaceSlug } = params;

    // Ensure the user is a member of the workspace
    const isMember = await requireWorkspaceMember(workspaceSlug);
    if (!isMember) {
      return errorResponse("NOT_FOUND", "Workspace not found", 404);
    }

    const workspace = await prisma.workspace.findUnique({ where: { slug: workspaceSlug } });
    if (!workspace) return errorResponse("NOT_FOUND", "Workspace not found", 404);

    // Normalize URL
    let parsedUrl: URL;
    try {
      parsedUrl = new URL(body.url);
    } catch {
      return errorResponse("VALIDATION_ERROR", "Invalid URL format", 422);
    }
    const domain = parsedUrl.hostname;

    const target = await prisma.target.create({
      data: {
        url: body.url,
        canonicalDomain: domain,
        name: domain,
        workspaceId: workspace.id,
      },
    });

    return successResponse(target, undefined, 201);
  },
);
