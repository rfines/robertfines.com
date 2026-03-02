import { auth } from "./auth";
import { redirect } from "next/navigation";
import { NextResponse } from "next/server";

/**
 * For Server Components / layouts.
 * Redirects to /auth/signin if unauthenticated, /dashboard if not admin.
 */
export async function requireAdmin() {
  const session = await auth();
  if (!session?.user?.id) redirect("/auth/signin");
  if (session.user.role !== "admin") redirect("/dashboard");
  return session;
}

/**
 * For API route handlers.
 * Returns { session } on success or { error: NextResponse } on 401/403.
 */
export async function assertAdmin() {
  const session = await auth();
  if (!session?.user?.id) {
    return {
      session: null,
      error: NextResponse.json({ error: "Unauthorized" }, { status: 401 }),
    };
  }
  if (session.user.role !== "admin") {
    return {
      session: null,
      error: NextResponse.json({ error: "Forbidden" }, { status: 403 }),
    };
  }
  return { session, error: null };
}
