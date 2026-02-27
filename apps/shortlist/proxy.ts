import { auth } from "@/lib/auth";

export default auth((req) => {
  const { nextUrl } = req;
  const isAuthenticated = !!req.auth;

  const isAuthRoute = nextUrl.pathname.startsWith("/api/auth");
  const isPublicApi = nextUrl.pathname === "/api/stripe/webhook";
  const isApiRoute = nextUrl.pathname.startsWith("/api");
  const isDashboard = nextUrl.pathname.startsWith("/dashboard");

  if (isAuthRoute || isPublicApi) return;

  if (!isAuthenticated && isApiRoute) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!isAuthenticated && isDashboard) {
    const signInUrl = new URL("/auth/signin", nextUrl.origin);
    signInUrl.searchParams.set("callbackUrl", nextUrl.pathname);
    return Response.redirect(signInUrl);
  }
});

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
