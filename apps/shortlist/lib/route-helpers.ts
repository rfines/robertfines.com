import { auth } from "@/lib/auth";
import { NextResponse } from "next/server";
import type { ZodType } from "zod";

/**
 * For API route handlers.
 * Returns { session } on success or { error: NextResponse } on 401.
 * Mirrors the assertAdmin() pattern in lib/admin.ts.
 */
export async function requireAuth() {
  const session = await auth();
  if (!session?.user?.id) {
    return {
      session: null,
      error: NextResponse.json({ error: "Unauthorized" }, { status: 401 }),
    };
  }
  return { session, error: null };
}

/**
 * Parses and validates the request body against a Zod schema.
 * Returns { data } on success or { error: NextResponse } on 400.
 */
export async function parseBody<T>(req: Request, schema: ZodType<T>) {
  const body = await req.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return {
      data: null,
      error: NextResponse.json({ error: parsed.error.flatten() }, { status: 400 }),
    };
  }
  return { data: parsed.data, error: null };
}
