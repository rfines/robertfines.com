import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent } from "@/components/ui/card";

export default function DashboardLoading() {
  return (
    <div className="max-w-3xl space-y-8">
      {/* Header */}
      <div>
        <Skeleton className="h-7 w-48" />
        <Skeleton className="h-4 w-72 mt-2" />
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 gap-4">
        <Card>
          <CardContent className="p-5 flex items-center gap-4">
            <Skeleton variant="circle" className="w-10 h-10" />
            <div>
              <Skeleton className="h-8 w-10" />
              <Skeleton className="h-3 w-20 mt-1" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5 flex items-center gap-4">
            <Skeleton variant="circle" className="w-10 h-10" />
            <div>
              <Skeleton className="h-8 w-10" />
              <Skeleton className="h-3 w-24 mt-1" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick actions */}
      <div>
        <Skeleton className="h-4 w-24 mb-3" />
        <div className="flex gap-3">
          <Skeleton className="h-9 w-28 rounded-lg" />
          <Skeleton className="h-9 w-32 rounded-lg" />
        </div>
      </div>
    </div>
  );
}
