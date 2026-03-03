import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { AppSidebar } from "@/components/layout/app-sidebar";
import { Header } from "@/components/layout/header";
import { MobileNav } from "@/components/layout/mobile-nav";
import { SidebarProvider } from "@/components/layout/sidebar-context";
import { CommandPalette } from "@/components/layout/command-palette";
import { PageTransition } from "@/components/layout/page-transition";
import { WelcomeTutorial } from "@/components/shared/consent-modal";
import { UpgradeModalProvider } from "@/components/shared/upgrade-modal";
import { FeedbackProvider } from "@/components/shared/feedback-modal";
import { getUserPlan } from "@/lib/get-user-plan";
import { prisma } from "@/lib/prisma";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();
  if (!session?.user?.id) {
    redirect("/auth/signin");
  }

  const [user, plan] = await Promise.all([
    prisma.user.findUnique({
      where: { id: session.user.id },
      select: { marketingConsent: true },
    }),
    getUserPlan(session.user.id),
  ]);
  const showConsentModal = user?.marketingConsent === null || user?.marketingConsent === undefined;

  return (
    <SidebarProvider>
      <UpgradeModalProvider>
        <FeedbackProvider plan={plan}>
          <div className="flex min-h-screen">
            {showConsentModal && <WelcomeTutorial />}
            <AppSidebar />
            <div className="flex-1 flex flex-col min-w-0">
              <Header />
              <main id="main-content" className="flex-1 p-6 lg:p-8 pb-20 lg:pb-8">
                <PageTransition>{children}</PageTransition>
              </main>
              <CommandPalette />
            </div>
            <MobileNav />
          </div>
        </FeedbackProvider>
      </UpgradeModalProvider>
    </SidebarProvider>
  );
}
