export default function IntegrationsPage({ params }: { params: { workspaceSlug: string } }) {
  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold">Integrations</h1>
      <p className="text-muted-foreground">Workspace: {params.workspaceSlug}</p>
      {/* TODO: Implement integrations UI in Unit 35 */}
    </div>
  );
}
