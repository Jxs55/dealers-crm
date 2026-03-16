export type Prospect = {
  id: string
  name: string
  businessType: string
  contactPhone: string
  location: string
  companyType: string
  contacted: boolean
}

export type ProspectImportInput = {
  name: string
  businessType: string
  contactPhone: string
  location: string
  companyType: string
}

export type ProspectImportRow = ProspectImportInput & {
  localId: string
}
