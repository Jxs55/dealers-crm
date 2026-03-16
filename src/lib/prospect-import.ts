import type { ProspectImportInput } from "@/types/prospect"

type GenericRecord = Record<string, unknown>

const FIELD_ALIASES = {
  name: ["name", "nombre", "empresa", "company"],
  businessType: ["businesstype", "business_type", "tipo_negocio", "business"],
  phone: ["contactphone", "phone", "telefono", "teléfono", "contact"],
  whatsappPhone: ["whatsapp", "whatsappphone", "whatsapp_phone", "wa", "wa_phone"],
  instagram: ["instagram", "instagram_user", "instagramuser", "ig", "ig_user"],
  contactMethod: ["contactmethod", "contact_method", "metodo_contacto", "método_contacto"],
  location: ["location", "ubicacion", "ubicación", "city"],
  companyType: ["companytype", "company_type", "tipo_empresa", "segmento"],
} as const

function normalizeKey(key: string) {
  return key
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .replace(/[^a-zA-Z0-9]/g, "")
    .toLowerCase()
}

function getValue(record: GenericRecord, aliases: readonly string[]) {
  const entry = Object.entries(record).find(([key]) =>
    aliases.includes(normalizeKey(key))
  )

  if (!entry) {
    return ""
  }

  return String(entry[1] ?? "").trim()
}

export function mapRecordToProspect(record: GenericRecord): ProspectImportInput {
  return {
    name: getValue(record, FIELD_ALIASES.name),
    businessType: getValue(record, FIELD_ALIASES.businessType),
    phone: getValue(record, FIELD_ALIASES.phone),
    whatsappPhone: getValue(record, FIELD_ALIASES.whatsappPhone),
    instagram: getValue(record, FIELD_ALIASES.instagram),
    contactMethod: getValue(record, FIELD_ALIASES.contactMethod) as
      | "whatsapp"
      | "instagram"
      | "both"
      | "none"
      | "",
    location: getValue(record, FIELD_ALIASES.location),
    companyType: getValue(record, FIELD_ALIASES.companyType),
  }
}

export function mapPdfLineToProspect(line: string): ProspectImportInput | null {
  const normalizedLine = line.trim()

  if (!normalizedLine) {
    return null
  }

  const parts = normalizedLine
    .split(/\s{2,}|\||,|\t/)
    .map((part) => part.trim())
    .filter(Boolean)

  if (parts.length < 2) {
    return null
  }

  return {
    name: parts[0] ?? "",
    businessType: parts[1] ?? "",
    phone: parts[2] ?? "",
    whatsappPhone: parts[3] ?? "",
    instagram: parts[4] ?? "",
    contactMethod: (parts[5] as "whatsapp" | "instagram" | "both" | "none" | "") ?? "",
    location: parts[6] ?? "",
    companyType: parts[7] ?? "",
  }
}
