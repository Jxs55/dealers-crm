import { NextResponse } from "next/server"

import { getSession } from "@/lib/auth"
import { isValidDominicanPhone, sanitizePhone } from "@/lib/phone"
import { prisma } from "@/lib/prisma"

type CompanyImportPayload = {
  name?: string
  business_type?: string
  phone?: string
  location?: string
  company_size?: string
  status?: string
}

function normalizeName(value: string) {
  return value.trim().toLowerCase().replace(/\s+/g, " ")
}

export async function POST(request: Request) {
  const session = await getSession()

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  let payload: CompanyImportPayload[]

  try {
    payload = (await request.json()) as CompanyImportPayload[]
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 })
  }

  if (!Array.isArray(payload) || payload.length === 0) {
    return NextResponse.json({ error: "No records to import." }, { status: 400 })
  }

  const preparedRows = payload.map((row) => {
    const name = String(row.name ?? "").trim()
    const businessType = String(row.business_type ?? "").trim()
    const phoneRaw = String(row.phone ?? "").trim()
    const location = String(row.location ?? "").trim()
    const companyType = String(row.company_size ?? "").trim()
    const status = String(row.status ?? "lead").trim().toLowerCase()
    const phone = sanitizePhone(phoneRaw)

    return {
      name,
      businessType,
      phone,
      phoneRaw,
      location,
      companyType,
      status,
    }
  })

  const existing = await prisma.dealer.findMany({
    where: {
      createdById: session.user.id,
      OR: [
        {
          contactPhone: {
            in: preparedRows.map((row) => row.phone).filter(Boolean),
          },
        },
        {
          name: {
            in: preparedRows.map((row) => row.name).filter(Boolean),
          },
        },
      ],
    },
    select: {
      contactPhone: true,
      name: true,
    },
  })

  const existingPhones = new Set(existing.map((record) => record.contactPhone))
  const existingNames = new Set(existing.map((record) => normalizeName(record.name)))
  const seenPhones = new Set<string>()
  const seenNames = new Set<string>()

  const insertable = preparedRows.filter((row) => {
    if (!row.name || !row.phone) {
      return false
    }

    if (!isValidDominicanPhone(row.phoneRaw)) {
      return false
    }

    const normalizedName = normalizeName(row.name)

    const isDuplicate =
      existingPhones.has(row.phone) ||
      existingNames.has(normalizedName) ||
      seenPhones.has(row.phone) ||
      seenNames.has(normalizedName)

    if (isDuplicate) {
      return false
    }

    seenPhones.add(row.phone)
    seenNames.add(normalizedName)

    return true
  })

  if (insertable.length === 0) {
    return NextResponse.json({ inserted: 0, skipped: payload.length })
  }

  const result = await prisma.$transaction(async (tx) => {
    return tx.dealer.createMany({
      data: insertable.map((row) => ({
        name: row.name,
        businessType: row.businessType || "Sin categoría",
        contactPhone: row.phone,
        location: row.location || "Sin ubicación",
        companyType: row.companyType || "Sin tipo",
        contacted: ["activo", "contactado", "active", "contacted"].includes(
          row.status
        ),
        createdById: session.user.id,
      })),
      skipDuplicates: true,
    })
  })

  return NextResponse.json({
    inserted: result.count,
    skipped: payload.length - result.count,
  })
}
