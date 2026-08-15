import { NextRequest } from "next/server";
import { prisma } from "@flank/database";
import { TargetRunParams } from "@flank/shared";
import { withApiGuard } from "@/lib/api-guard";
import { successResponse, errorResponse } from "@/lib/api-response";
import { requireWorkspaceMember } from "@/lib/access";
import { enqueueRunCancel } from "@/lib/queue-producer";

export const POST = withApiGuard(
  {
    paramsSchema: TargetRunParams,
  },
  async (req: NextRequest, { params, session }: any) => {
    const { targetId, runId } = params;

    const run = await prisma.run.findUnique({
      where: { id: runId, targetId },
      include: { target: { include: { workspace: true } } },
    });

    if (!run) {
      return errorResponse("NOT_FOUND", "Run not found", 404);
    }

    const isMember = await requireWorkspaceMember(run.target.workspace.slug);
    if (!isMember) {
      return errorResponse("NOT_FOUND", "Run not found", 404);
    }

    if (run.status === "COMPLETED" || run.status === "FAILED" || run.status === "CANCELLED") {
      return errorResponse("INVALID_STATE", "Run cannot be cancelled in its current state", 400);
    }

    const updatedRun = await prisma.run.update({
      where: { id: runId },
      data: {
        status: "CANCELLED",
        cancelRequestedAt: new Date(),
      },
    });

    await enqueueRunCancel({
      runId,
      requestedBy: session.user.id,
      idempotencyKey: `run-cancel-${runId}`,
      version: 1,
    });

    return successResponse(updatedRun);
  },
);
