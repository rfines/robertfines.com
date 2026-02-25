import { test as base, expect } from "@playwright/test";
import { SignJWT } from "jose";

const AUTH_SECRET = process.env.AUTH_SECRET ?? "test-secret-32-chars-minimum!!x";

const TEST_USER = {
  id: "user_test123",
  name: "Test User",
  email: "test@example.com",
};

async function createSessionToken(): Promise<string> {
  const secret = new TextEncoder().encode(AUTH_SECRET);
  const now = Math.floor(Date.now() / 1000);

  return new SignJWT({
    name: TEST_USER.name,
    email: TEST_USER.email,
    sub: TEST_USER.id,
    id: TEST_USER.id,
    iat: now,
    exp: now + 30 * 24 * 60 * 60,
    jti: `test-token-${now}`,
  })
    .setProtectedHeader({ alg: "HS256" })
    .sign(secret);
}

export const test = base.extend<{ authenticatedPage: typeof base.prototype.page }>({
  page: async ({ page }, use) => {
    const token = await createSessionToken();
    await page.context().addCookies([
      {
        name: "authjs.session-token",
        value: token,
        domain: "localhost",
        path: "/",
        httpOnly: true,
        secure: false,
        sameSite: "Lax",
      },
    ]);
    await use(page);
  },
});

export { expect };
