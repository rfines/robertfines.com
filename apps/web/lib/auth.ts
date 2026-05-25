import NextAuth from "next-auth";
import Google from "next-auth/providers/google";
import { isAllowed, parseAllowlist } from "./auth-allowlist";

const allowlist = parseAllowlist(process.env.ADMIN_EMAILS);

export const { handlers, auth, signIn, signOut } = NextAuth({
  providers: [Google],
  session: { strategy: "jwt" },
  pages: { signIn: "/admin/signin" },
  callbacks: {
    async signIn({ user }) {
      return isAllowed(user.email, allowlist);
    },
  },
});
