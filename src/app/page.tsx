import { prisma } from "@/lib/prisma"
import { DealersCRM } from "@/components/dealers-crm"

export default async function HomePage() {
  const dealers = await prisma.dealer.findMany({
    orderBy: { createdAt: "desc" },
  })

  return <DealersCRM initialDealers={dealers} />
}
