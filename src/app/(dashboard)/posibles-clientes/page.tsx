import { prisma } from "@/lib/prisma"
import { requireAuthUser } from "@/lib/auth"
import { ProspectsTable } from "@/components/prospects-table"

export const dynamic = "force-dynamic"

export default async function PosiblesClientesPage() {
  const user = await requireAuthUser()

  const prospects = await prisma.dealer.findMany({
    where: {
      createdById: user.id,
    },
    orderBy: { createdAt: "desc" },
  })

  return <ProspectsTable prospects={prospects} />
}
