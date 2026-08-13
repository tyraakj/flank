export default function FeaturesPage({ params }: { params: { workspaceSlug: string; targetId: string } }) {
  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold">Features</h1>
      <p className="text-muted-foreground">Target: {params.targetId}</p>
      {/* TODO: Implement features in Unit 27 */}
    </div>
  );
}
