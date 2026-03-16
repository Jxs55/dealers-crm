import { prisma } from "@/lib/prisma"
import { requireAuthUser } from "@/lib/auth"
import { ProspectsTable } from "@/components/prospects-table"

export const dynamic = "force-dynamic"

export default async function PosiblesClientesPage() {
  const user = await requireAuthUser()

  const [prospects, templates] = await Promise.all([
    prisma.dealer.findMany({
      where: {
        
      },
      orderBy: { createdAt: "desc" },
    }),
    prisma.messageTemplate.findMany({
      where: {
        
      },
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        name: true,
        messageTemplate: true,
        createdAt: true,
      },
    }),
  ])

  return <ProspectsTable prospects={prospects} templates={templates} />
}
