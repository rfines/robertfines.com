import { requireAdmin } from "@/lib/admin";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";

export default async function AdminPage() {
  await requireAdmin();

  const [totalUsers, planDistribution, totalResumes, totalTailored, recentSignups] =
    await Promise.all([
      prisma.user.count(),
      prisma.user.groupBy({ by: ["plan"], _count: { plan: true } }),
      prisma.resume.count(),
      prisma.tailoredResume.count(),
      prisma.user.findMany({
        orderBy: { createdAt: "desc" },
        take: 10,
        select: { id: true, email: true, name: true, plan: true, createdAt: true },
      }),
    ]);

  const planMap = Object.fromEntries(
    planDistribution.map((r) => [r.plan, r._count.plan])
  );

  const stats = [
    { label: "Total Users", value: totalUsers },
    { label: "Resumes", value: totalResumes },
    { label: "Tailored Versions", value: totalTailored },
  ];

  const planOrder = ["free", "starter", "pro"] as const;

  return (
    <div className="space-y-8">
      <h1 className="text-xl font-semibold text-foreground">Overview</h1>

      {/* Stat cards */}
      <div className="grid grid-cols-3 gap-4">
        {stats.map(({ label, value }) => (
          <div
            key={label}
            className="bg-surface border border-border rounded-xl p-5"
          >
            <p className="text-xs text-muted mb-1">{label}</p>
            <p className="text-3xl font-bold text-foreground">
              {value.toLocaleString()}
            </p>
          </div>
        ))}
      </div>

      {/* Plan distribution */}
      <div className="bg-surface border border-border rounded-xl p-5">
        <h2 className="text-sm font-medium text-foreground mb-4">Plan Distribution</h2>
        <div className="space-y-3">
          {planOrder.map((plan) => {
            const count = planMap[plan] ?? 0;
            const pct = totalUsers > 0 ? Math.round((count / totalUsers) * 100) : 0;
            return (
              <div key={plan} className="flex items-center gap-3">
                <span className="text-xs text-muted w-14 capitalize">{plan}</span>
                <div className="flex-1 h-2 bg-border rounded-full overflow-hidden">
                  <div
                    className="h-2 bg-accent rounded-full"
                    style={{ width: `${pct}%` }}
                  />
                </div>
                <span className="text-xs text-muted w-8 text-right">{count}</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Recent signups */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-medium text-foreground">Recent Signups</h2>
          <Link
            href="/admin/users"
            className="text-xs text-muted hover:text-foreground transition-colors"
          >
            View all →
          </Link>
        </div>
        <div className="bg-surface border border-border rounded-xl overflow-hidden">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-border">
                <th className="text-left px-4 py-2.5 text-muted font-medium">User</th>
                <th className="text-left px-4 py-2.5 text-muted font-medium">Plan</th>
                <th className="text-left px-4 py-2.5 text-muted font-medium">Joined</th>
              </tr>
            </thead>
            <tbody>
              {recentSignups.map((user) => (
                <tr
                  key={user.id}
                  className="border-b border-border last:border-0"
                >
                  <td className="px-4 py-2.5">
                    <Link
                      href={`/admin/users/${user.id}`}
                      className="text-foreground hover:text-accent transition-colors"
                    >
                      {user.name ?? user.email ?? user.id}
                    </Link>
                    {user.name && (
                      <p className="text-muted">{user.email}</p>
                    )}
                  </td>
                  <td className="px-4 py-2.5">
                    <Badge variant="muted" className="capitalize">
                      {user.plan}
                    </Badge>
                  </td>
                  <td className="px-4 py-2.5 text-muted">
                    {user.createdAt.toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                    })}
                  </td>
                </tr>
              ))}
              {recentSignups.length === 0 && (
                <tr>
                  <td colSpan={3} className="px-4 py-6 text-center text-muted">
                    No users yet
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
