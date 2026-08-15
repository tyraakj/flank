export default function CompetitorsPage({
  params,
}: {
  params: { workspaceSlug: string; targetId: string };
}) {
  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold">Competitors</h1>
      <p className="text-muted-foreground">Target: {params.targetId}</p>
      {/* TODO: Implement competitors in Unit 25 */}
    </div>
  );
}
