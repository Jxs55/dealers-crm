export type ContactMethod = "whatsapp" | "instagram" | "both" | "none"

export type Prospect = {
  id: string
  name: string
  businessType: string
  phone: string
  whatsappPhone: string | null
  instagram: string | null
  contactMethod: ContactMethod
  location: string
  companyType: string
  contacted: boolean
}

export type ProspectImportInput = {
  name: string
  businessType: string
  phone: string
  whatsappPhone: string
  instagram: string
  contactMethod: ContactMethod | ""
  location: string
  companyType: string
}

export type ProspectImportRow = ProspectImportInput & {
  localId: string
}
