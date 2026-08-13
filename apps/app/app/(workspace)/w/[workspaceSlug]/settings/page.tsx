export default function SettingsPage({ params }: { params: { workspaceSlug: string } }) {
  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold">Settings</h1>
      <p className="text-muted-foreground">Workspace: {params.workspaceSlug}</p>
      {/* TODO: Implement settings UI in later units */}
    </div>
  );
}
