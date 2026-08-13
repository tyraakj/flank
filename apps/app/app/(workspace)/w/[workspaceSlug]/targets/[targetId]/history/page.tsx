export default function HistoryPage({ params }: { params: { workspaceSlug: string; targetId: string } }) {
  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold">History</h1>
      <p className="text-muted-foreground">Target: {params.targetId}</p>
      {/* TODO: Implement history and diffs in Unit 34 */}
    </div>
  );
}
