import { auth } from "@/lib/auth";
import { NextResponse } from "next/server";
import { z, type ZodTypeAny } from "zod";

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
 * Uses z.output<S> so default values are reflected in the return type.
 */
export async function parseBody<S extends ZodTypeAny>(req: Request, schema: S) {
  const body = await req.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return {
      data: null,
      error: NextResponse.json({ error: parsed.error.flatten() }, { status: 400 }),
    };
  }
  return { data: parsed.data as z.output<S>, error: null };
}
