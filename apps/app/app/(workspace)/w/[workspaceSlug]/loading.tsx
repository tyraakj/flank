import { Skeleton } from '@/components/ui/skeleton';

export default function WorkspaceLoading() {
  return (
    <div className="flex h-screen flex-col">
      {/* Top bar skeleton */}
      <div className="flex h-14 items-center justify-between border-b px-4">
        <Skeleton className="h-8 w-32" />
        <div className="flex items-center gap-2">
          <Skeleton className="h-9 w-24" />
          <Skeleton className="h-10 w-10" />
          <Skeleton className="h-10 w-10" />
        </div>
      </div>
      
      <div className="flex flex-1 overflow-hidden">
        {/* Left nav skeleton */}
        <nav className="flex w-56 flex-col border-r bg-card py-4">
          <div className="space-y-1 px-2">
            {[1, 2, 3, 4].map((i) => (
              <Skeleton key={i} className="h-9 w-full" />
            ))}
          </div>
        </nav>
        
        {/* Main content skeleton */}
        <main className="flex-1 overflow-auto p-6">
          <Skeleton className="h-8 w-64 mb-4" />
          <Skeleton className="h-4 w-96 mb-8" />
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-24 w-full" />
            ))}
          </div>
        </main>
      </div>
    </div>
  );
}
