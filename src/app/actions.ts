"use server"

import { revalidatePath } from "next/cache"

import { prisma } from "@/lib/prisma"

export async function createDealer(formData: FormData) {
  const name = String(formData.get("name") ?? "").trim()
  const businessType = String(formData.get("businessType") ?? "").trim()
  const contactPhone = String(formData.get("contactPhone") ?? "").trim()
  const location = String(formData.get("location") ?? "").trim()
  const companyType = String(formData.get("companyType") ?? "").trim()

  if (!name || !businessType || !contactPhone || !location || !companyType) {
    throw new Error("All fields are required")
  }

  await prisma.dealer.create({
    data: {
      name,
      businessType,
      contactPhone,
      location,
      companyType,
    },
  })

  revalidatePath("/")
}

export async function updateDealerContacted(id: string, contacted: boolean) {
  await prisma.dealer.update({
    where: { id },
    data: { contacted },
  })

  revalidatePath("/")
}
