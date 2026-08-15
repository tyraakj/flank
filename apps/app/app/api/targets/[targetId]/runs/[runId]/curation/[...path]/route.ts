import { NextRequest } from "next/server";
import { prisma } from "@flank/database";
import { z } from "zod";
import { withApiGuard } from "@/lib/api-guard";
import { successResponse, errorResponse } from "@/lib/api-response";
import { requireWorkspaceMember } from "@/lib/access";
import { enqueueStageReplay } from "@/lib/queue-producer";

const CurationParams = z.object({
  targetId: z.string(),
  runId: z.string(),
  path: z.array(z.string()),
});

async function verifyRunAccess(targetId: string, runId: string, _userId: string) {
  const run = await prisma.run.findUnique({
    where: { id: runId, targetId },
    include: { target: { include: { workspace: true } } },
  });

  if (!run) return null;

  const isMember = await requireWorkspaceMember(run.targetId);
  if (!isMember) return null;

  return run;
}

export const PATCH = withApiGuard(
  { paramsSchema: CurationParams },
  async (req: NextRequest, { params, session, _body }: unknown) => {
    const { targetId, runId, path } = params;

    const run = await verifyRunAccess(targetId, runId, session.user.id);
    if (!run) return errorResponse("NOT_FOUND", "Not found", 404);

    const resource = path.join("/");

    if (resource === "target-profile") {
      // Handle target-profile mutation (using body)
      await enqueueStageReplay({
        runId,
        stageKey: "PROFILER",
        requestedBy: session.user.id,
        idempotencyKey: `replay-profiler-${Date.now()}`,
        version: 1,
      });
      return successResponse({ message: "Target profile update queued" });
    }

    if (path[0] === "competitors" && path.length === 2) {
      const _competitorId = path[1];
      // Handle competitor type/pin mutation using body

      // Request re-synthesis from verifier
      await enqueueStageReplay({
        runId,
        stageKey: "VERIFIER",
        requestedBy: session.user.id,
        idempotencyKey: `replay-verifier-${Date.now()}`,
        version: 1,
      });
      return successResponse({ message: "Competitor reclassification queued" });
    }

    return errorResponse("NOT_FOUND", "Curation path not found", 404);
  },
);

export const POST = withApiGuard(
  { paramsSchema: CurationParams },
  async (req: NextRequest, { params, session, _body }: unknown) => {
    const { targetId, runId, path } = params;

    const run = await verifyRunAccess(targetId, runId, session.user.id);
    if (!run) return errorResponse("NOT_FOUND", "Not found", 404);

    if (path[0] === "opportunities" && path[2] === "dismiss") {
      const _opportunityId = path[1];
      // dismiss logic here...

      // Request re-synthesis
      await enqueueStageReplay({
        runId,
        stageKey: "STRATEGIST",
        requestedBy: session.user.id,
        idempotencyKey: `replay-strategist-${Date.now()}`,
        version: 1,
      });
      return successResponse({ message: "Opportunity dismissed" });
    }

    return errorResponse("NOT_FOUND", "Curation path not found", 404);
  },
);
