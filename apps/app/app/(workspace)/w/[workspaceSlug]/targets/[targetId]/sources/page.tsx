export default function SourcesPage({
  params,
}: {
  params: { workspaceSlug: string; targetId: string };
}) {
  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold">Sources</h1>
      <p className="text-muted-foreground">Target: {params.targetId}</p>
      {/* TODO: Implement sources in Unit 30 */}
    </div>
  );
}
