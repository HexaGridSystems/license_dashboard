export type LicenceCategory =
  | 'Licence'
  | 'Renewal'
  | 'Permit'
  | 'Statutory Filing'
  | 'Legal Certificate'

export type LicenceStatus = 'Due Soon' | 'In Review' | 'Compliant' | 'Overdue'

export type RenewalUrgency = 'Low' | 'Medium' | 'Critical' | 'Overdue'

export type ThemeMode = 'light' | 'dark'

export type Hospital = {
  id: string
  name: string
  address: string
  contactPerson: string
  complianceOwner: string
}

export type HospitalLicense = {
  id: string
  hospitalId: string
  licenceName: string
  category: LicenceCategory
  issueDate: string
  expiryDate: string
  owner: string
  regulator: string
  status: LicenceStatus
}

export type LicenseDraft = Omit<HospitalLicense, 'id'>

export type WizardLicenseDraft = LicenseDraft & {
  tempId: string
}

export type InlineDraft = Pick<
  HospitalLicense,
  'expiryDate' | 'owner' | 'category' | 'status'
>

export type LicenseFieldErrors = {
  licenceName: string
  category: string
  expiryDate: string
}
