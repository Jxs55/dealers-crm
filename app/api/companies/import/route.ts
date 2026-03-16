import { NextResponse } from "next/server"

import { getSession } from "@/lib/auth"
import { isValidDominicanPhone, sanitizePhone } from "@/lib/phone"
import { prisma } from "@/lib/prisma"

type CompanyImportPayload = {
  name?: string
  business_type?: string
  phone?: string
  whatsapp_phone?: string
  instagram?: string
  contact_method?: "whatsapp" | "instagram" | "both" | "none"
  location?: string
  company_size?: string
  status?: string
}

function normalizeName(value: string) {
  return value.trim().toLowerCase().replace(/\s+/g, " ")
}

function sanitizeInstagramHandle(value: string) {
  return value
    .trim()
    .replace(/^@+/, "")
    .replace(/^https?:\/\/(www\.)?instagram\.com\//i, "")
    .replace(/\?.*$/, "")
    .replace(/\/.*/, "")
    .replace(/[^a-zA-Z0-9._]/g, "")
    .toLowerCase()
}

function resolveContactMethod(whatsappPhone: string, instagram: string) {
  if (whatsappPhone && instagram) {
    return "both" as const
  }

  if (whatsappPhone) {
    return "whatsapp" as const
  }

  if (instagram) {
    return "instagram" as const
  }

  return "none" as const
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
    const whatsappPhoneRaw = String(row.whatsapp_phone ?? "").trim()
    const instagramRaw = String(row.instagram ?? "").trim()
    const contactMethodRaw = row.contact_method
    const location = String(row.location ?? "").trim()
    const companyType = String(row.company_size ?? "").trim()
    const status = String(row.status ?? "lead").trim().toLowerCase()
    const phone = sanitizePhone(phoneRaw)
    const whatsappPhone = sanitizePhone(whatsappPhoneRaw)
    const instagram = sanitizeInstagramHandle(instagramRaw)

    return {
      name,
      businessType,
      phone,
      phoneRaw,
      whatsappPhone,
      whatsappPhoneRaw,
      instagram,
      contactMethodRaw,
      location,
      companyType,
      status,
    }
  })

  const existing = await prisma.dealer.findMany({
    where: {
      
      OR: [
        {
          phone: {
            in: preparedRows.map((row) => row.phone).filter(Boolean),
          },
        },
        {
          whatsappPhone: {
            in: preparedRows.map((row) => row.whatsappPhone).filter(Boolean),
          },
        },
        {
          instagram: {
            in: preparedRows.map((row) => row.instagram).filter(Boolean),
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
      phone: true,
      whatsappPhone: true,
      instagram: true,
      name: true,
    },
  })

  const existingPhones = new Set(existing.map((record) => record.phone))
  const existingWhatsappPhones = new Set(
    existing.map((record) => record.whatsappPhone).filter(Boolean)
  )
  const existingInstagrams = new Set(
    existing.map((record) => record.instagram).filter(Boolean)
  )
  const existingNames = new Set(existing.map((record) => normalizeName(record.name)))
  const seenPhones = new Set<string>()
  const seenWhatsappPhones = new Set<string>()
  const seenInstagrams = new Set<string>()
  const seenNames = new Set<string>()

  const insertable = preparedRows.filter((row) => {
    if (!row.name || !row.phone) {
      return false
    }

    if (!isValidDominicanPhone(row.phoneRaw)) {
      return false
    }

    if (row.whatsappPhoneRaw && !isValidDominicanPhone(row.whatsappPhoneRaw)) {
      return false
    }

    const normalizedName = normalizeName(row.name)

    const isDuplicate =
      existingPhones.has(row.phone) ||
      (row.whatsappPhone &&
        (existingWhatsappPhones.has(row.whatsappPhone) ||
          seenWhatsappPhones.has(row.whatsappPhone))) ||
      (row.instagram &&
        (existingInstagrams.has(row.instagram) || seenInstagrams.has(row.instagram))) ||
      existingNames.has(normalizedName) ||
      seenPhones.has(row.phone) ||
      seenNames.has(normalizedName)

    if (isDuplicate) {
      return false
    }

    seenPhones.add(row.phone)
    if (row.whatsappPhone) {
      seenWhatsappPhones.add(row.whatsappPhone)
    }
    if (row.instagram) {
      seenInstagrams.add(row.instagram)
    }
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
        phone: row.phone,
        whatsappPhone: row.whatsappPhone || null,
        instagram: row.instagram || null,
        contactMethod:
          row.contactMethodRaw === "whatsapp" ||
          row.contactMethodRaw === "instagram" ||
          row.contactMethodRaw === "both" ||
          row.contactMethodRaw === "none"
            ? row.contactMethodRaw
            : resolveContactMethod(row.whatsappPhone, row.instagram),
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
