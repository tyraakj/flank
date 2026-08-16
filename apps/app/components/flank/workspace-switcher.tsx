"use client";

import { useRouter } from "next/navigation";
import { Select } from "@/components/ui/select";

interface Workspace {
  id: string;
  name: string;
  slug: string;
}

interface WorkspaceSwitcherProps {
  workspaces: Workspace[];
  activeSlug?: string;
}

export function WorkspaceSwitcher({ workspaces, activeSlug }: WorkspaceSwitcherProps) {
  const router = useRouter();

  if (workspaces.length === 0) {
    return (
      <div className="text-sm text-muted-foreground p-2 border rounded-md">
        No workspaces. Please create one.
      </div>
    );
  }

  return (
    <Select
      value={activeSlug || ""}
      onChange={(e: React.ChangeEvent<HTMLSelectElement>) => {
        if (e.target.value) {
          router.push(`/w/${e.target.value}`);
        }
      }}
    >
      <option value="" disabled>
        Select a workspace
      </option>
      {workspaces.map((ws) => (
        <option key={ws.id} value={ws.slug}>
          {ws.name}
        </option>
      ))}
    </Select>
  );
}
