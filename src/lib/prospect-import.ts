import type { ProspectImportInput } from "@/types/prospect"

type GenericRecord = Record<string, unknown>

const FIELD_ALIASES = {
  name: ["name", "nombre", "empresa", "company"],
  businessType: ["businesstype", "business_type", "tipo_negocio", "business"],
  contactPhone: ["contactphone", "phone", "telefono", "teléfono", "contact"],
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
    contactPhone: getValue(record, FIELD_ALIASES.contactPhone),
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
    contactPhone: parts[2] ?? "",
    location: parts[3] ?? "",
    companyType: parts[4] ?? "",
  }
}
