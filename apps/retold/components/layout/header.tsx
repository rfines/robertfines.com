import { auth, signOut } from "@/lib/auth";
import { getUserPlan } from "@/lib/get-user-plan";
import { ThemeToggle } from "@/components/layout/theme-toggle";
import { Breadcrumbs } from "@/components/layout/breadcrumbs";
import { UserMenu } from "@/components/layout/user-menu";

export async function Header() {
  const session = await auth();
  let plan: string | undefined;

  if (session?.user?.id) {
    plan = await getUserPlan(session.user.id);
  }

  const signOutAction = async () => {
    "use server";
    await signOut({ redirectTo: "/" });
  };

  return (
    <header className="h-14 border-b border-border flex items-center justify-between px-6 shrink-0 bg-surface">
      <Breadcrumbs />
      <div className="flex items-center gap-2">
        <ThemeToggle />
        {session?.user && (
          <UserMenu
            user={{
              name: session.user.name,
              email: session.user.email,
              image: session.user.image,
            }}
            plan={plan}
            signOutAction={signOutAction}
          />
        )}
      </div>
    </header>
  );
}
