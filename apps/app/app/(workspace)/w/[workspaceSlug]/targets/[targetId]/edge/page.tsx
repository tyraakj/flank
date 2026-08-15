export default function EdgePage({
  params,
}: {
  params: { workspaceSlug: string; targetId: string };
}) {
  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold">Edge</h1>
      <p className="text-muted-foreground">Target: {params.targetId}</p>
      {/* TODO: Implement edge opportunities in Unit 29 */}
    </div>
  );
}
