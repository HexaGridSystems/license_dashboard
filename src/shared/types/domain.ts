export type LicenceCategory =
  | 'Licence'
  | 'Renewal'
  | 'Permit'
  | 'Statutory Filing'
  | 'Legal Certificate'

export type LicenceStatus = 'Due Soon' | 'Active' | 'Expired' | string

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
  remainingDays?: number | null
  action?: string
  documents?: string
}

export type LicenseDraft = Omit<HospitalLicense, 'id'>

export type WizardLicenseDraft = LicenseDraft & {
  tempId: string
}

export type LicenseFieldErrors = {
  licenceName: string
  category: string
  expiryDate: string
}
