export default function OverviewPage({
  params,
}: {
  params: { workspaceSlug: string; targetId: string };
}) {
  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold">Overview</h1>
      <p className="text-muted-foreground">Target: {params.targetId}</p>
      {/* TODO: Implement overview in Unit 23 */}
    </div>
  );
}
