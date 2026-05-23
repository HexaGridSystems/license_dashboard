import { useEffect, useMemo, useState } from 'react'
import {
  emptyHospitalDraft,
  emptyHospitalErrors,
  emptyLicenseErrors,
  makeLicenseDraft,
  seedHospitals,
  seedLicenses,
} from '../../licenses/data/seed'
import {
  DASHBOARD_STORAGE_KEY,
  LEGACY_RECORD_STORAGE_KEY,
} from '../../../shared/constants/storageKeys'
import type {
  Hospital,
  HospitalLicense,
  InlineDraft,
  LicenseDraft,
  LicenseFieldErrors,
  LicenceCategory,
  RenewalUrgency,
  WizardLicenseDraft,
} from '../../../shared/types/domain'
import { getRenewalSignals, defaultStatusFromExpiry } from '../../licenses/utils/renewal'
import { createId } from '../../../shared/utils/id'
import { migrateLegacyRecords } from '../../licenses/utils/migrateLegacy'
import { exportRowsToExcel } from '../../../shared/utils/exportExcel'

export type EnrichedLicense = HospitalLicense & {
  hospitalName: string
  renewal: {
    countdownDays: number | null
    countdownLabel: string
    reminder3Months: boolean
    reminder15Days: boolean
    urgency: RenewalUrgency
  }
}

export function useDashboardState() {
  const [hospitals, setHospitals] = useState<Hospital[]>(seedHospitals)
  const [licenses, setLicenses] = useState<HospitalLicense[]>(seedLicenses)

  const [selectedHospitalId, setSelectedHospitalId] = useState('all')
  const [selectedCategory, setSelectedCategory] = useState<LicenceCategory | 'All'>('All')

  const [banner, setBanner] = useState('')

  const [inlineEditId, setInlineEditId] = useState<string | null>(null)
  const [inlineDraft, setInlineDraft] = useState<InlineDraft>({
    expiryDate: '',
    owner: '',
    category: 'Licence',
    status: 'Compliant',
  })
  const [inlineErrors, setInlineErrors] = useState<{ owner: string; expiryDate: string }>({
    owner: '',
    expiryDate: '',
  })

  const [isLicenseModalOpen, setIsLicenseModalOpen] = useState(false)
  const [licenseModalMode, setLicenseModalMode] = useState<'create' | 'edit'>('create')
  const [modalLicenseId, setModalLicenseId] = useState<string | null>(null)
  const [modalDraft, setModalDraft] = useState<LicenseDraft>(makeLicenseDraft())
  const [modalErrors, setModalErrors] = useState<LicenseFieldErrors>(emptyLicenseErrors)

  const [isWizardOpen, setIsWizardOpen] = useState(false)
  const [wizardStep, setWizardStep] = useState<1 | 2>(1)
  const [hospitalDraft, setHospitalDraft] = useState(emptyHospitalDraft)
  const [hospitalErrors, setHospitalErrors] = useState(emptyHospitalErrors)
  const [wizardLicenses, setWizardLicenses] = useState<WizardLicenseDraft[]>([
    makeLicenseDraft(),
  ])
  const [wizardLicenseErrors, setWizardLicenseErrors] = useState<
    Record<string, LicenseFieldErrors>
  >({})

  useEffect(() => {
    const saved = localStorage.getItem(DASHBOARD_STORAGE_KEY)
    if (saved) {
      try {
        const parsed = JSON.parse(saved) as {
          hospitals: Hospital[]
          licenses: HospitalLicense[]
        }
        if (Array.isArray(parsed.hospitals) && Array.isArray(parsed.licenses)) {
          setHospitals(parsed.hospitals)
          setLicenses(parsed.licenses)
          return
        }
      } catch {
        // Continue to migration fallback.
      }
    }

    const migrated = migrateLegacyRecords(localStorage.getItem(LEGACY_RECORD_STORAGE_KEY))
    if (migrated) {
      setHospitals(migrated.hospitals)
      setLicenses(migrated.licenses)
    }
  }, [])

  useEffect(() => {
    localStorage.setItem(DASHBOARD_STORAGE_KEY, JSON.stringify({ hospitals, licenses }))
  }, [hospitals, licenses])

  useEffect(() => {
    if (!banner) {
      return
    }
    const timeout = window.setTimeout(() => setBanner(''), 2500)
    return () => window.clearTimeout(timeout)
  }, [banner])

  const hospitalMap = useMemo(() => {
    return new Map(hospitals.map((hospital) => [hospital.id, hospital]))
  }, [hospitals])

  const hospitalCounts = useMemo(() => {
    const counts = new Map<string, number>()
    licenses.forEach((license) => {
      const current = counts.get(license.hospitalId) ?? 0
      counts.set(license.hospitalId, current + 1)
    })
    return counts
  }, [licenses])

  const filteredLicenses = useMemo(() => {
    return licenses.filter((license) => {
      const byHospital = selectedHospitalId === 'all' || license.hospitalId === selectedHospitalId
      const byCategory = selectedCategory === 'All' || license.category === selectedCategory
      return byHospital && byCategory
    })
  }, [licenses, selectedHospitalId, selectedCategory])

  const enrichedFilteredLicenses = useMemo<EnrichedLicense[]>(() => {
    return filteredLicenses.map((license) => ({
      ...license,
      hospitalName: hospitalMap.get(license.hospitalId)?.name ?? 'Unknown Hospital',
      renewal: getRenewalSignals(license.expiryDate),
    }))
  }, [filteredLicenses, hospitalMap])

  const criticalCount = enrichedFilteredLicenses.filter(
    (license) => license.renewal.urgency === 'Critical' || license.renewal.urgency === 'Overdue',
  ).length
  const dueSoonCount = enrichedFilteredLicenses.filter(
    (license) => license.renewal.reminder3Months,
  ).length
  const compliantCount = enrichedFilteredLicenses.filter(
    (license) => license.renewal.urgency === 'Low',
  ).length
  const totalHospitals = hospitals.length

  const actionQueue = useMemo(() => {
    return [...enrichedFilteredLicenses]
      .sort((a, b) => {
        const daysA = a.renewal.countdownDays ?? Number.MAX_SAFE_INTEGER
        const daysB = b.renewal.countdownDays ?? Number.MAX_SAFE_INTEGER
        return daysA - daysB
      })
      .slice(0, 4)
  }, [enrichedFilteredLicenses])

  const upcomingMilestones = useMemo(() => {
    return [...enrichedFilteredLicenses]
      .filter((license) => (license.renewal.countdownDays ?? Number.MAX_SAFE_INTEGER) >= 0)
      .sort((a, b) => {
        const daysA = a.renewal.countdownDays ?? Number.MAX_SAFE_INTEGER
        const daysB = b.renewal.countdownDays ?? Number.MAX_SAFE_INTEGER
        return daysA - daysB
      })
      .slice(0, 4)
  }, [enrichedFilteredLicenses])

  const validateLicenseFields = (draft: Pick<LicenseDraft, 'licenceName' | 'category' | 'expiryDate'>) => {
    return {
      licenceName: draft.licenceName.trim() ? '' : 'Licence name is required.',
      category: draft.category ? '' : 'Category is required.',
      expiryDate: draft.expiryDate.trim() ? '' : 'Expiry date is required.',
    }
  }

  const updateLicense = (id: string, updates: Partial<HospitalLicense>) => {
    setLicenses((prev) =>
      prev.map((license) => (license.id === id ? { ...license, ...updates } : license)),
    )
  }

  const openCreateLicenseModal = () => {
    setLicenseModalMode('create')
    setModalLicenseId(null)
    setModalErrors(emptyLicenseErrors)
    setModalDraft({
      hospitalId: selectedHospitalId === 'all' ? hospitals[0]?.id ?? '' : selectedHospitalId,
      licenceName: '',
      category: 'Licence',
      issueDate: '',
      expiryDate: '',
      owner: '',
      regulator: '',
      status: 'Compliant',
    })
    setIsLicenseModalOpen(true)
  }

  const openEditLicenseModal = (license: HospitalLicense) => {
    setLicenseModalMode('edit')
    setModalLicenseId(license.id)
    setModalErrors(emptyLicenseErrors)
    setModalDraft({ ...license })
    setIsLicenseModalOpen(true)
  }

  const saveLicenseModal = () => {
    const errors = validateLicenseFields(modalDraft)
    setModalErrors(errors)
    if (errors.licenceName || errors.category || errors.expiryDate) {
      return
    }

    const nextStatus =
      modalDraft.status === 'In Review'
        ? 'In Review'
        : defaultStatusFromExpiry(modalDraft.expiryDate)

    if (licenseModalMode === 'create') {
      setLicenses((prev) => [
        ...prev,
        {
          ...modalDraft,
          id: createId('L'),
          status: nextStatus,
        },
      ])
      setBanner('License added successfully.')
    } else if (modalLicenseId) {
      updateLicense(modalLicenseId, {
        ...modalDraft,
        status: nextStatus,
      })
      setBanner('License details updated successfully.')
    }

    setIsLicenseModalOpen(false)
    setModalLicenseId(null)
  }

  const startInlineEdit = (license: HospitalLicense) => {
    setInlineEditId(license.id)
    setInlineErrors({ owner: '', expiryDate: '' })
    setInlineDraft({
      expiryDate: license.expiryDate,
      owner: license.owner,
      category: license.category,
      status: license.status,
    })
  }

  const cancelInlineEdit = () => {
    setInlineEditId(null)
    setInlineErrors({ owner: '', expiryDate: '' })
  }

  const saveInlineEdit = () => {
    if (!inlineEditId) {
      return
    }

    const errors = {
      owner: inlineDraft.owner.trim() ? '' : 'Owner is required.',
      expiryDate: inlineDraft.expiryDate.trim() ? '' : 'Expiry date is required.',
    }
    setInlineErrors(errors)
    if (errors.owner || errors.expiryDate) {
      return
    }

    const nextStatus =
      inlineDraft.status === 'In Review'
        ? 'In Review'
        : defaultStatusFromExpiry(inlineDraft.expiryDate)

    updateLicense(inlineEditId, {
      expiryDate: inlineDraft.expiryDate,
      owner: inlineDraft.owner,
      category: inlineDraft.category,
      status: nextStatus,
    })

    setInlineEditId(null)
    setBanner('Inline update saved.')
  }

  const exportFiltered = () => {
    exportRowsToExcel({
      rows: enrichedFilteredLicenses,
      columns: [
        { header: 'Hospital', value: (row) => row.hospitalName },
        { header: 'Licence Name', value: (row) => row.licenceName },
        { header: 'Category', value: (row) => row.category },
        { header: 'Issue Date', value: (row) => row.issueDate || '-' },
        { header: 'Expiry Date', value: (row) => row.expiryDate },
        {
          header: 'Countdown Days',
          value: (row) =>
            row.renewal.countdownDays === null ? '-' : `${row.renewal.countdownDays}`,
        },
        {
          header: '3 Month Reminder',
          value: (row) => (row.renewal.reminder3Months ? 'Yes' : 'No'),
        },
        {
          header: '15 Day Reminder',
          value: (row) => (row.renewal.reminder15Days ? 'Yes' : 'No'),
        },
        { header: 'Urgency', value: (row) => row.renewal.urgency },
        { header: 'Owner', value: (row) => row.owner || '-' },
        { header: 'Regulator', value: (row) => row.regulator || '-' },
        { header: 'Status', value: (row) => row.status },
      ],
      filePrefix: 'legal-licence-register',
    })
    setBanner('Excel file downloaded for selected hospital and filters.')
  }

  const openWizard = () => {
    setIsWizardOpen(true)
    setWizardStep(1)
    setHospitalDraft(emptyHospitalDraft)
    setHospitalErrors(emptyHospitalErrors)
    setWizardLicenses([makeLicenseDraft()])
    setWizardLicenseErrors({})
  }

  const goWizardNext = () => {
    const errors = {
      name: hospitalDraft.name.trim() ? '' : 'Hospital name is required.',
    }
    setHospitalErrors(errors)
    if (errors.name) {
      return
    }
    setWizardStep(2)
  }

  const addWizardLicense = () => {
    setWizardLicenses((prev) => [...prev, makeLicenseDraft('pending')])
  }

  const updateWizardLicense = (
    tempId: string,
    field: keyof Omit<WizardLicenseDraft, 'tempId'>,
    value: string,
  ) => {
    setWizardLicenses((prev) =>
      prev.map((license) =>
        license.tempId === tempId ? { ...license, [field]: value } : license,
      ),
    )
  }

  const removeWizardLicense = (tempId: string) => {
    setWizardLicenses((prev) => {
      if (prev.length === 1) {
        return prev
      }
      return prev.filter((license) => license.tempId !== tempId)
    })
  }

  const saveWizard = () => {
    const nextErrors: Record<string, LicenseFieldErrors> = {}
    wizardLicenses.forEach((draft) => {
      nextErrors[draft.tempId] = validateLicenseFields(draft)
    })
    setWizardLicenseErrors(nextErrors)

    const hasError = Object.values(nextErrors).some(
      (error) => error.licenceName || error.category || error.expiryDate,
    )
    if (hasError) {
      return
    }

    const newHospitalId = createId('H')
    const newHospital: Hospital = {
      id: newHospitalId,
      name: hospitalDraft.name,
      address: hospitalDraft.address,
      contactPerson: hospitalDraft.contactPerson,
      complianceOwner: hospitalDraft.complianceOwner,
    }

    const newLicenses: HospitalLicense[] = wizardLicenses.map((draft) => ({
      id: createId('L'),
      hospitalId: newHospitalId,
      licenceName: draft.licenceName,
      category: draft.category,
      issueDate: draft.issueDate,
      expiryDate: draft.expiryDate,
      owner: draft.owner,
      regulator: draft.regulator,
      status: defaultStatusFromExpiry(draft.expiryDate),
    }))

    setHospitals((prev) => [...prev, newHospital])
    setLicenses((prev) => [...prev, ...newLicenses])
    setSelectedHospitalId(newHospitalId)
    setIsWizardOpen(false)
    setBanner('Hospital and licenses created successfully.')
  }

  return {
    hospitals,
    licenses,
    selectedHospitalId,
    selectedCategory,
    banner,
    inlineEditId,
    inlineDraft,
    inlineErrors,
    isLicenseModalOpen,
    licenseModalMode,
    modalDraft,
    modalErrors,
    isWizardOpen,
    wizardStep,
    hospitalDraft,
    hospitalErrors,
    wizardLicenses,
    wizardLicenseErrors,
    hospitalCounts,
    enrichedFilteredLicenses,
    criticalCount,
    dueSoonCount,
    compliantCount,
    totalHospitals,
    actionQueue,
    upcomingMilestones,
    setSelectedHospitalId,
    setSelectedCategory,
    setInlineDraft,
    setModalDraft,
    setHospitalDraft,
    setWizardStep,
    setIsLicenseModalOpen,
    setIsWizardOpen,
    setAuthBanner: setBanner,
    openCreateLicenseModal,
    openEditLicenseModal,
    saveLicenseModal,
    startInlineEdit,
    cancelInlineEdit,
    saveInlineEdit,
    exportFiltered,
    openWizard,
    goWizardNext,
    addWizardLicense,
    updateWizardLicense,
    removeWizardLicense,
    saveWizard,
  }
}
