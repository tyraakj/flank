import { Skeleton } from "@/components/ui/skeleton";

export default function TargetLoading() {
  return (
    <div className="flex h-full flex-col">
      {/* Report tabs skeleton */}
      <div className="border-b bg-card">
        <div className="flex overflow-x-auto">
          {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
            <Skeleton key={i} className="h-12 w-24 border-b-2 border-transparent" />
          ))}
        </div>
      </div>

      {/* Content skeleton */}
      <div className="flex-1 overflow-auto p-6">
        <Skeleton className="h-8 w-64 mb-4" />
        <Skeleton className="h-4 w-96 mb-8" />
        <div className="space-y-4">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-32 w-full" />
          ))}
        </div>
      </div>
    </div>
  );
}
