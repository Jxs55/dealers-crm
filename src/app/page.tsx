import { prisma } from "@/lib/prisma"
import { requireAuthUser } from "@/lib/auth"
import { DealersCRM } from "@/components/dealers-crm"

export const dynamic = "force-dynamic"

export default async function HomePage() {
  const user = await requireAuthUser()

  const dealers = await prisma.dealer.findMany({
    where: {
      createdById: user.id,
    },
    orderBy: { createdAt: "desc" },
  })

  return <DealersCRM initialDealers={dealers} />
}
