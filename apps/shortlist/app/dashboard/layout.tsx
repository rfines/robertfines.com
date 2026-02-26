import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { AppSidebar } from "@/components/layout/app-sidebar";
import { Header } from "@/components/layout/header";
import { ConsentModal } from "@/components/shared/consent-modal";
import { prisma } from "@/lib/prisma";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();
  if (!session) {
    redirect("/auth/signin");
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { marketingConsent: true },
  });
  const showConsentModal = user?.marketingConsent === null || user?.marketingConsent === undefined;

  return (
    <div className="flex min-h-screen">
      {showConsentModal && <ConsentModal />}
      <AppSidebar />
      <div className="flex-1 flex flex-col min-w-0">
        <Header />
        <main className="flex-1 p-8">{children}</main>
      </div>
    </div>
  );
}
