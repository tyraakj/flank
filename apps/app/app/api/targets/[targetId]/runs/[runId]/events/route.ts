import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@flank/database";
import { auth } from "@/lib/auth";
import { requireWorkspaceMember } from "@/lib/access";
import { createProgressStream } from "@/lib/progress/redis-bridge";

// Node runtime required for long-running streaming with external socket connections (Redis)
export const runtime = "nodejs";

export async function GET(
  req: NextRequest,
  { params }: { params: { targetId: string; runId: string } },
) {
  try {
    const session = await auth.api.getSession({ headers: req.headers });
    if (!session) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const { targetId, runId } = params;

    const run = await prisma.run.findUnique({
      where: { id: runId, targetId },
      include: { target: { include: { workspace: true } } },
    });

    if (!run) {
      return new NextResponse("Not Found", { status: 404 });
    }

    const isMember = await requireWorkspaceMember(run.target.workspace.slug);
    if (!isMember) {
      return new NextResponse("Not Found", { status: 404 });
    }

    const lastEventIdHeader = req.headers.get("Last-Event-ID");
    const lastEventId = lastEventIdHeader ? parseInt(lastEventIdHeader, 10) : undefined;

    const stream = await createProgressStream(
      runId,
      isNaN(lastEventId as number) ? undefined : lastEventId,
    );

    return new NextResponse(stream, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache, no-transform",
        Connection: "keep-alive",
      },
    });
  } catch (error) {
    console.error("[SSE Route] Error initializing stream:", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}
