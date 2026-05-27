import type { Hospital, HospitalLicense, WizardLicenseDraft } from '../../../shared/types/domain'
import { createId } from '../../../shared/utils/id'

export const seedHospitals: Hospital[] = [
  {
    id: 'H-001',
    name: 'St. Mary Medical Center',
    address: '12 Central Avenue, Bengaluru',
    contactPerson: 'Dr. Anita Prasad',
    complianceOwner: 'Asha Nair',
  },
  {
    id: 'H-002',
    name: 'Northside Cancer Institute',
    address: '44 Lakeview Road, Hyderabad',
    contactPerson: 'Dr. Rohit Jain',
    complianceOwner: 'Mihir Joshi',
  },
  {
    id: 'H-003',
    name: 'Crescent Children Hospital',
    address: '9 Riverfront Street, Chennai',
    contactPerson: 'Dr. Meera Thomas',
    complianceOwner: 'Neha Rao',
  },
]

export const seedLicenses: HospitalLicense[] = [
  {
    id: 'L-001',
    hospitalId: 'H-001',
    licenceName: 'Clinical Establishment Licence',
    category: 'Renewal',
    issueDate: '2025-06-05',
    expiryDate: '2026-06-04',
    owner: 'Asha Nair',
    regulator: 'State Health Authority',
    status: 'Due Soon',
  },
  {
    id: 'L-002',
    hospitalId: 'H-002',
    licenceName: 'Biomedical Waste Handling Permit',
    category: 'Permit',
    issueDate: '2025-07-13',
    expiryDate: '2026-07-12',
    owner: 'Ritwik Das',
    regulator: 'Pollution Control Board',
    status: 'Due Soon',
  },
  {
    id: 'L-003',
    hospitalId: 'H-003',
    licenceName: 'Fire Safety NOC',
    category: 'Legal Certificate',
    issueDate: '2025-05-30',
    expiryDate: '2026-05-29',
    owner: 'Neha Rao',
    regulator: 'Municipal Fire Department',
    status: 'Expired',
  },
  {
    id: 'L-004',
    hospitalId: 'H-001',
    licenceName: 'Pharmacy Operations Licence',
    category: 'Licence',
    issueDate: '2025-08-02',
    expiryDate: '2026-08-01',
    owner: 'Asha Nair',
    regulator: 'Drug Control Office',
    status: 'Active',
  },
]

export const emptyHospitalDraft = {
  name: '',
  address: '',
  contactPerson: '',
  complianceOwner: '',
}

export const emptyHospitalErrors = {
  name: '',
}

export const emptyLicenseErrors = {
  licenceName: '',
  category: '',
  expiryDate: '',
}

export const makeLicenseDraft = (hospitalId = ''): WizardLicenseDraft => ({
  tempId: createId('tmp'),
  hospitalId,
  licenceName: '',
  category: 'Licence',
  issueDate: '',
  expiryDate: '',
  owner: '',
  regulator: '',
  status: 'Active',
})
