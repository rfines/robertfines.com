import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { isAllowed, parseAllowlist } from "@/lib/auth-allowlist";

export default async function AuthedAdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();
  const allowlist = parseAllowlist(process.env.ADMIN_EMAILS);

  if (!isAllowed(session?.user?.email, allowlist)) {
    redirect("/admin/signin");
  }

  return (
    <div className="max-w-3xl mx-auto px-6 py-16 space-y-10">{children}</div>
  );
}
