"use server"

import { hash } from "bcryptjs"
import { revalidatePath } from "next/cache"
import { Prisma } from "@prisma/client"

import { getSession } from "@/lib/auth"
import { isValidDominicanPhone, sanitizePhone } from "@/lib/phone"
import { prisma } from "@/lib/prisma"

type ActionResult = {
  success: boolean
  error?: string
}

export async function createDealer(formData: FormData) {
  const session = await getSession()

  if (!session?.user?.id) {
    return { success: false, error: "You must be logged in." } satisfies ActionResult
  }

  const name = String(formData.get("name") ?? "").trim()
  const businessType = String(formData.get("businessType") ?? "").trim()
  const contactPhoneRaw = String(formData.get("contactPhone") ?? "").trim()
  const location = String(formData.get("location") ?? "").trim()
  const companyType = String(formData.get("companyType") ?? "").trim()
  const contactPhone = sanitizePhone(contactPhoneRaw)

  if (!name) {
    return { success: false, error: "Name is required." } satisfies ActionResult
  }

  if (!contactPhone) {
    return { success: false, error: "Contact phone is required." } satisfies ActionResult
  }

  if (!isValidDominicanPhone(contactPhoneRaw)) {
    return {
      success: false,
      error: "Phone must be a valid Dominican number.",
    } satisfies ActionResult
  }

  if (!businessType || !location || !companyType) {
    return { success: false, error: "All fields are required." } satisfies ActionResult
  }

  const duplicate = await prisma.dealer.findUnique({
    where: {
      createdById_contactPhone: {
        createdById: session.user.id,
        contactPhone,
      },
    },
  })

  if (duplicate) {
    return {
      success: false,
      error: "Dealer with this phone number already exists.",
    } satisfies ActionResult
  }

  try {
    await prisma.dealer.create({
      data: {
        name,
        businessType,
        contactPhone,
        location,
        companyType,
        createdById: session.user.id,
      },
    })
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2002"
    ) {
      return {
        success: false,
        error: "Dealer with this phone number already exists.",
      } satisfies ActionResult
    }

    return {
      success: false,
      error: "Unable to create dealer right now.",
    } satisfies ActionResult
  }

  revalidatePath("/")
  revalidatePath("/posibles-clientes")

  return { success: true } satisfies ActionResult
}

export async function updateDealerContacted(id: string, contacted: boolean) {
  const session = await getSession()

  if (!session?.user?.id) {
    return { success: false, error: "You must be logged in." } satisfies ActionResult
  }

  if (!id) {
    return { success: false, error: "Invalid dealer id." } satisfies ActionResult
  }

  const result = await prisma.dealer.updateMany({
    where: {
      id,
      createdById: session.user.id,
    },
    data: { contacted },
  })

  if (result.count === 0) {
    return { success: false, error: "Dealer not found." } satisfies ActionResult
  }

  revalidatePath("/")
  revalidatePath("/posibles-clientes")

  return { success: true } satisfies ActionResult
}

export async function updateProfileSettings(formData: FormData) {
  const session = await getSession()

  if (!session?.user?.id) {
    return { success: false, error: "You must be logged in." } satisfies ActionResult
  }

  const name = String(formData.get("name") ?? "").trim()
  const email = String(formData.get("email") ?? "").trim().toLowerCase()
  const password = String(formData.get("password") ?? "").trim()

  if (!name) {
    return { success: false, error: "Name is required." } satisfies ActionResult
  }

  if (!email) {
    return { success: false, error: "Email is required." } satisfies ActionResult
  }

  if (!email.includes("@")) {
    return { success: false, error: "Email is invalid." } satisfies ActionResult
  }

  if (password && password.length < 4) {
    return {
      success: false,
      error: "Password must contain at least 4 characters.",
    } satisfies ActionResult
  }

  const existingUserWithEmail = await prisma.user.findFirst({
    where: {
      email,
      id: {
        not: session.user.id,
      },
    },
    select: { id: true },
  })

  if (existingUserWithEmail) {
    return { success: false, error: "Email is already in use." } satisfies ActionResult
  }

  await prisma.user.update({
    where: { id: session.user.id },
    data: {
      name,
      email,
      ...(password ? { password: await hash(password, 12) } : {}),
    },
  })

  revalidatePath("/configuracion")

  return { success: true } satisfies ActionResult
}
