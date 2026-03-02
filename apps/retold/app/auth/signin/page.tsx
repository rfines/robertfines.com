import { auth, signIn } from "@/lib/auth";
import { redirect } from "next/navigation";
import { SignInClient } from "./signin-client";

export default async function SignInPage({
  searchParams,
}: {
  searchParams: Promise<{ callbackUrl?: string; error?: string }>;
}) {
  const session = await auth();
  const params = await searchParams;

  if (session) {
    redirect(params.callbackUrl ?? "/dashboard");
  }

  const callbackUrl = params.callbackUrl ?? "/dashboard";

  const signInGoogle = async () => {
    "use server";
    await signIn("google", { redirectTo: callbackUrl });
  };
  const signInGitHub = async () => {
    "use server";
    await signIn("github", { redirectTo: callbackUrl });
  };
  const signInLinkedIn = async () => {
    "use server";
    await signIn("linkedin", { redirectTo: callbackUrl });
  };

  return (
    <SignInClient
      error={params.error}
      signInGoogle={signInGoogle}
      signInGitHub={signInGitHub}
      signInLinkedIn={signInLinkedIn}
    />
  );
}
