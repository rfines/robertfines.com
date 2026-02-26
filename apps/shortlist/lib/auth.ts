import NextAuth from "next-auth";
import Google from "next-auth/providers/google";
import { PrismaAdapter } from "@auth/prisma-adapter";
import { prisma } from "./prisma";
import { captureEvent } from "./posthog";

const allowedEmails = process.env.ALLOWED_EMAILS
  ? process.env.ALLOWED_EMAILS.split(",").map((e) => e.trim()).filter(Boolean)
  : [];

export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: PrismaAdapter(prisma),
  session: { strategy: "jwt" },
  providers: [
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
  ],
  callbacks: {
    signIn({ user }) {
      if (!user.email) return false;
      if (allowedEmails.length === 0) return false;
      return allowedEmails.includes(user.email);
    },
    async jwt({ token, user }) {
      if (user?.id) {
        token.id = user.id;
        // Fetch role from DB on first sign-in (user object only present then)
        const dbUser = await prisma.user.findUnique({
          where: { id: user.id },
          select: { role: true },
        });
        token.role = dbUser?.role ?? "user";
      }
      return token;
    },
    session({ session, token }) {
      if (session.user && token.id) {
        session.user.id = token.id as string;
        session.user.role = (token.role as string) ?? "user";
      }
      return session;
    },
  },
  events: {
    async signIn({ user }) {
      if (user.id) {
        await captureEvent(user.id, "user_signed_in", {
          email: user.email ?? undefined,
        });
      }
    },
  },
  pages: {
    signIn: "/auth/signin",
    error: "/auth/signin",
  },
});
