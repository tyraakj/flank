import { NextRequest } from "next/server";
import { prisma } from "@flank/database";
import { TargetParams } from "@flank/shared";
import { withApiGuard } from "@/lib/api-guard";
import { successResponse, errorResponse } from "@/lib/api-response";
import { requireWorkspaceMember } from "@/lib/access";
import { enqueueRunExecute } from "@/lib/queue-producer";

export const POST = withApiGuard(
  {
    paramsSchema: TargetParams,
  },
  async (req: NextRequest, { params, session }) => {
    const { targetId } = params;

    // Validate target ownership
    const target = await prisma.target.findUnique({
      where: { id: targetId },
      include: { workspace: true },
    });

    if (!target) {
      return errorResponse("NOT_FOUND", "Target not found", 404);
    }

    void target;
    const isMember = await requireWorkspaceMember(target.workspace.slug);
    if (!isMember) {
      return errorResponse("NOT_FOUND", "Target not found", 404);
    }

    // Create the run and pre-populate stages (mock stages for now, these will be fleshed out in orchestrator)
    const run = await prisma.run.create({
      data: {
        targetId,
        status: "QUEUED",
        stages: {
          create: [
            { key: "PROFILER", attempt: 0, status: "QUEUED" },
            { key: "DISCOVERY", attempt: 0, status: "QUEUED" },
          ],
        },
      },
    });

    // Enqueue job via Unit 07 producer
    await enqueueRunExecute({
      runId: run.id,
      targetId: run.targetId,
      requestedBy: session.user.id,
      idempotencyKey: `run-execute-${run.id}`,
      version: 1,
    });

    return successResponse(run, undefined, 201);
  },
);
