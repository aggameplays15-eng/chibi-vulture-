import { cn } from "@/lib/utils";

interface SkeletonProps {
  className?: string;
}

export function Skeleton({ className }: SkeletonProps) {
  return (
    <div
      className={cn("animate-pulse rounded-md bg-gray-100 dark:bg-white/5", className)}
    />
  );
}

export function PostSkeleton() {
  return (
    <div className="bg-white dark:bg-[hsl(224,20%,10%)] rounded-[32px] overflow-hidden border border-gray-50 dark:border-white/5 mb-6 shadow-sm">
      <div className="p-4 flex items-center gap-3">
        <Skeleton className="w-10 h-10 rounded-2xl" />
        <div className="space-y-2">
          <Skeleton className="h-3 w-24" />
          <Skeleton className="h-2 w-16" />
        </div>
      </div>
      <Skeleton className="w-full aspect-square" />
      <div className="p-4 space-y-3">
        <div className="flex gap-4">
          <Skeleton className="w-6 h-6 rounded-lg" />
          <Skeleton className="w-6 h-6 rounded-lg" />
          <Skeleton className="w-6 h-6 rounded-lg" />
        </div>
        <Skeleton className="h-3 w-full" />
        <Skeleton className="h-3 w-2/3" />
      </div>
    </div>
  );
}

export function StorySkeleton() {
  return (
    <div className="flex flex-col items-center gap-2 flex-shrink-0">
      <div className="w-16 h-16 rounded-[22px] border-2 border-gray-100 dark:border-white/5 p-1 flex items-center justify-center">
        <Skeleton className="w-full h-full rounded-[18px]" />
      </div>
      <Skeleton className="h-2 w-12" />
    </div>
  );
}
