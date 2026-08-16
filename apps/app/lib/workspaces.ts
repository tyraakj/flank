import { prisma } from "@flank/database";
import { requireSession } from "./access";

export async function getUserWorkspaces() {
  const session = await requireSession();

  const members = await prisma.workspaceMember.findMany({
    where: {
      userId: session.user.id,
      workspace: { archivedAt: null },
    },
    include: {
      workspace: true,
    },
    orderBy: {
      workspace: { name: "asc" },
    },
  });

  return members.map((m) => m.workspace);
}
