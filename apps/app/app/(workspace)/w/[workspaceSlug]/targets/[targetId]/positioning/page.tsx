export default function PositioningPage({
  params,
}: {
  params: { workspaceSlug: string; targetId: string };
}) {
  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold">Positioning</h1>
      <p className="text-muted-foreground">Target: {params.targetId}</p>
      {/* TODO: Implement positioning in Unit 28 */}
    </div>
  );
}
