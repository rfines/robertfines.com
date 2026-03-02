import { test as base, expect } from "@playwright/test";
import { EncryptJWT } from "jose";
import { hkdf } from "@panva/hkdf";

const AUTH_SECRET = process.env.AUTH_SECRET ?? "test-secret-32-chars-minimum!!x";

const TEST_USER = {
  id: "user_test123",
  name: "Test User",
  email: "test@example.com",
};

async function createSessionToken(): Promise<string> {
  // NextAuth v5 derives the key via HKDF; the salt AND info string both use the cookie name
  const salt = "authjs.session-token";
  const derived = await hkdf(
    "sha256",
    AUTH_SECRET,
    salt,
    `Auth.js Generated Encryption Key (${salt})`,
    64
  );
  const now = Math.floor(Date.now() / 1000);

  return new EncryptJWT({
    name: TEST_USER.name,
    email: TEST_USER.email,
    sub: TEST_USER.id,
    id: TEST_USER.id,
    iat: now,
    exp: now + 30 * 24 * 60 * 60,
    jti: `test-token-${now}`,
  })
    .setProtectedHeader({ alg: "dir", enc: "A256CBC-HS512" })
    .setIssuedAt(now)
    .setExpirationTime(now + 30 * 24 * 60 * 60)
    .encrypt(derived);
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
