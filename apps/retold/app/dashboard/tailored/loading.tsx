import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent } from "@/components/ui/card";

export default function TailoredLoading() {
  return (
    <div className="max-w-2xl">
      {/* Page header */}
      <div className="mb-8">
        <Skeleton className="h-7 w-40" />
        <Skeleton className="h-4 w-72 mt-2" />
      </div>

      {/* Tailored cards */}
      <div className="space-y-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <Card key={i}>
            <CardContent className="p-5 flex items-center justify-between gap-4">
              <div className="flex items-center gap-3 min-w-0">
                <Skeleton variant="circle" className="w-9 h-9 rounded-lg" />
                <div>
                  <Skeleton className="h-4 w-48" />
                  <Skeleton className="h-3 w-32 mt-1.5" />
                </div>
              </div>
              <Skeleton className="h-5 w-20 rounded-full" />
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
