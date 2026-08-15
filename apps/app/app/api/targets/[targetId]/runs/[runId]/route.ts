import { NextRequest } from "next/server";
import { prisma } from "@flank/database";
import { TargetRunParams } from "@flank/shared";
import { withApiGuard } from "@/lib/api-guard";
import { successResponse, errorResponse } from "@/lib/api-response";
import { requireWorkspaceMember } from "@/lib/access";

export const GET = withApiGuard(
  {
    paramsSchema: TargetRunParams,
  },
  async (req: NextRequest, { params, session: _session }) => {
    const { targetId, runId } = params;

    // Verify run belongs to target
    const run = await prisma.run.findUnique({
      where: { id: runId, targetId },
      include: {
        stages: {
          orderBy: { attempt: "desc" },
        },
        target: {
          include: { workspace: true },
        },
      },
    });

    if (!run) {
      return errorResponse("NOT_FOUND", "Run not found", 404);
    }

    const isMember = await requireWorkspaceMember(run.targetId);
    if (!isMember) {
      return errorResponse("NOT_FOUND", "Run not found", 404);
    }

    // Strip out target before sending
    const { target: _target, ...runData } = run;

    return successResponse(runData);
  },
);
