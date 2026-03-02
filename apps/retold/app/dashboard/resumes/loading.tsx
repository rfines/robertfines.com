import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent } from "@/components/ui/card";

export default function ResumesLoading() {
  return (
    <div className="max-w-2xl">
      {/* Page header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <Skeleton className="h-7 w-32" />
          <Skeleton className="h-4 w-64 mt-2" />
        </div>
        <Skeleton className="h-9 w-28 rounded-lg" />
      </div>

      {/* Resume cards */}
      <div className="space-y-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <Card key={i}>
            <CardContent className="p-5 flex items-center justify-between gap-4">
              <div className="flex items-center gap-3 min-w-0">
                <Skeleton variant="circle" className="w-9 h-9 rounded-lg" />
                <div>
                  <Skeleton className="h-4 w-40" />
                  <Skeleton className="h-3 w-24 mt-1.5" />
                </div>
              </div>
              <Skeleton className="h-5 w-16 rounded-full" />
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
