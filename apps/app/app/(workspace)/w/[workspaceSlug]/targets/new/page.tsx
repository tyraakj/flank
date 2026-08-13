export default function NewTargetPage({ params }: { params: { workspaceSlug: string } }) {
  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold">New Analysis</h1>
      <p className="text-muted-foreground">Workspace: {params.workspaceSlug}</p>
      {/* TODO: Implement URL submission flow in Unit 21 */}
    </div>
  );
}
