import { requireAuthUser } from "@/lib/auth"
import { AppSidebar } from "@/components/app-sidebar"
import { prisma } from "@/lib/prisma"
import { SidebarInset, SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar"

export default async function DashboardLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  const sessionUser = await requireAuthUser()

  const user = await prisma.user.findUnique({
    where: { id: sessionUser.id },
    select: {
      name: true,
      email: true,
    },
  })

  const userName = user?.name ?? "Usuario"
  const userEmail = user?.email ?? ""

  return (
    <SidebarProvider>
      <AppSidebar userName={userName} userEmail={userEmail} />
      <SidebarInset>
        <header className="flex h-14 items-center border-b px-4 md:px-6">
          <SidebarTrigger className="mr-2" />
          <h1 className="text-sm font-medium text-muted-foreground">
            ORBIZ Dashboard
          </h1>
        </header>
        <div className="flex-1">{children}</div>
      </SidebarInset>
    </SidebarProvider>
  )
}
