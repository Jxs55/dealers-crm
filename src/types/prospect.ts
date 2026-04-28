export type ContactMethod = "whatsapp" | "instagram" | "both" | "none"

export type Prospect = {
  id: string
  name: string
  businessType: string
  phone: string
  instagram: string | null
  contactMethod: ContactMethod
  location: string
  companyType: string
  contacted: boolean
  contactedAt: string | null
  isActive: boolean
}

export type ProspectImportInput = {
  name: string
  businessType: string
  phone: string
  instagram: string
  contactMethod: ContactMethod | ""
  location: string
  companyType: string
}

export type ProspectImportRow = ProspectImportInput & {
  localId: string
}
