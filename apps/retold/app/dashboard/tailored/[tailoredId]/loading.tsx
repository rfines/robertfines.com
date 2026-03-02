import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent } from "@/components/ui/card";

export default function TailoredDetailLoading() {
  return (
    <div className="max-w-3xl">
      {/* Back link */}
      <Skeleton className="h-4 w-32 mb-6" />

      {/* Page header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <Skeleton className="h-7 w-56" />
          <Skeleton className="h-4 w-40 mt-2" />
        </div>
        <div className="flex items-center gap-2">
          <Skeleton className="h-9 w-9 rounded-lg" />
          <Skeleton className="h-9 w-24 rounded-lg" />
        </div>
      </div>

      {/* Keyword match card */}
      <Card className="mb-6">
        <CardContent className="p-5">
          <div className="flex items-center justify-between mb-3">
            <Skeleton className="h-5 w-32" />
            <Skeleton className="h-6 w-14 rounded-full" />
          </div>
          <Skeleton className="h-1.5 w-full rounded-full" />
          <div className="flex flex-wrap gap-2 mt-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="h-6 w-20 rounded-full" />
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Variation tabs */}
      <div className="flex gap-2 mb-4">
        <Skeleton className="h-8 w-24 rounded-lg" />
        <Skeleton className="h-8 w-24 rounded-lg" />
      </div>

      {/* Content block */}
      <Card>
        <CardContent className="p-6">
          <Skeleton variant="paragraph" />
          <div className="mt-4">
            <Skeleton variant="paragraph" />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
