import { NextRequest } from 'next/server';
import { prisma } from '@flank/database';
import { z } from 'zod';
import { withApiGuard } from '@/lib/api-guard';
import { successResponse, errorResponse } from '@/lib/api-response';
import { requireWorkspaceMember } from '@/lib/access';

const ReportSectionParams = z.object({
  targetId: z.string(),
  runId: z.string(),
  section: z.enum(['overview', 'competitors', 'pricing', 'features', 'positioning', 'edge', 'sources', 'history']),
});

export const GET = withApiGuard(
  {
    paramsSchema: ReportSectionParams,
  },
  async (req: NextRequest, { params, session }: any) => {
    const { targetId, runId, section } = params;
    
    const run = await prisma.run.findUnique({
      where: { id: runId, targetId },
      include: { target: { include: { workspace: true } } }
    });

    if (!run) {
      return errorResponse('NOT_FOUND', 'Report not found', 404);
    }

    const isMember = await requireWorkspaceMember(run.targetId);
    if (!isMember) {
      return errorResponse('NOT_FOUND', 'Report not found', 404);
    }

    // A placeholder switch for when we actually query evidence/snapshots for each section
    let sectionData = {};
    switch(section) {
      case 'overview':
        sectionData = { message: 'Overview data here' };
        break;
      case 'competitors':
        const competitors = await prisma.competitor.findMany({ where: { runId } });
        sectionData = { competitors };
        break;
      // ... other cases
    }

    return successResponse(sectionData);
  }
);
