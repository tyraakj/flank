export default function WorkspaceHomePage({ params }: { params: { workspaceSlug: string } }) {
  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold">Workspace Home</h1>
      <p className="text-muted-foreground">Workspace: {params.workspaceSlug}</p>
      {/* TODO: Implement target list in Unit 21 */}
    </div>
  );
}
