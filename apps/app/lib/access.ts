import { auth } from "@/lib/auth";
import { prisma } from "@flank/database";
import type { WorkspaceRole } from "@prisma/client";
import { headers } from "next/headers";

export class ApiError extends Error {
  constructor(public statusCode: number, message: string) {
    super(message);
    this.name = "ApiError";
  }
}

export async function requireSession() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });
  if (!session) {
    throw new ApiError(401, "Unauthorized");
  }
  return session;
}

export async function requireWorkspaceMember(workspaceSlug: string) {
  const session = await requireSession();
  
  const member = await prisma.workspaceMember.findFirst({
    where: {
      userId: session.user.id,
      workspace: { slug: workspaceSlug, archivedAt: null },
    },
    include: {
      workspace: true,
    },
  });

  if (!member) {
    throw new ApiError(404, "Workspace not found or access denied");
  }

  return { session, member, workspace: member.workspace };
}

export async function requireWorkspaceRole(workspaceSlug: string, roles: WorkspaceRole[]) {
  const context = await requireWorkspaceMember(workspaceSlug);
  
  if (!roles.includes(context.member.role)) {
    throw new ApiError(403, "Insufficient workspace role");
  }

  return context;
}

export async function requireTargetAccess(targetId: string) {
  const session = await requireSession();

  const target = await prisma.target.findFirst({
    where: {
      id: targetId,
      archivedAt: null,
      workspace: {
        members: {
          some: { userId: session.user.id },
        },
        archivedAt: null,
      },
    },
    include: {
      workspace: true,
    },
  });

  if (!target) {
    throw new ApiError(404, "Target not found or access denied");
  }

  return { session, target, workspace: target.workspace };
}

export async function requireRunAccess(runId: string) {
  const session = await requireSession();

  const run = await prisma.run.findFirst({
    where: {
      id: runId,
      target: {
        archivedAt: null,
        workspace: {
          members: {
            some: { userId: session.user.id },
          },
          archivedAt: null,
        },
      },
    },
    include: {
      target: {
        include: { workspace: true },
      },
    },
  });

  if (!run) {
    throw new ApiError(404, "Run not found or access denied");
  }

  return { session, run, target: run.target, workspace: run.target.workspace };
}
