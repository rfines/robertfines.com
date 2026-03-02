import { auth } from "./auth";
import { redirect } from "next/navigation";

export async function getRequiredSession() {
  const session = await auth();
  if (!session?.user?.id) {
    redirect("/auth/signin");
  }
  return session as typeof session & { user: { id: string } };
}
