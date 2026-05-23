import type { Hospital, HospitalLicense, LicenceCategory, LicenceStatus } from '../../../shared/types/domain'
import { createId } from '../../../shared/utils/id'

export function migrateLegacyRecords(savedLegacy: string | null) {
  if (!savedLegacy) {
    return null
  }

  try {
    const legacy = JSON.parse(savedLegacy) as Array<{
      id: string
      hospital: string
      item: string
      type: LicenceCategory
      dueDate: string
      owner: string
      regulator: string
      status: LicenceStatus
    }>

    if (!Array.isArray(legacy) || legacy.length === 0) {
      return null
    }

    const hospitalMap = new Map<string, string>()
    const hospitals: Hospital[] = []

    legacy.forEach((record) => {
      if (!hospitalMap.has(record.hospital)) {
        const hospitalId = createId('H')
        hospitalMap.set(record.hospital, hospitalId)
        hospitals.push({
          id: hospitalId,
          name: record.hospital,
          address: '',
          contactPerson: '',
          complianceOwner: record.owner,
        })
      }
    })

    const licenses: HospitalLicense[] = legacy.map((record) => ({
      id: createId('L'),
      hospitalId: hospitalMap.get(record.hospital) ?? '',
      licenceName: record.item,
      category: record.type,
      issueDate: '',
      expiryDate: record.dueDate,
      owner: record.owner,
      regulator: record.regulator,
      status: record.status,
    }))

    return { hospitals, licenses }
  } catch {
    return null
  }
}
