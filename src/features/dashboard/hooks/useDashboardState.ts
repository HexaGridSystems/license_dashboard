import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
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
  LAST_SYNC_STORAGE_KEY,
  LEGACY_RECORD_STORAGE_KEY,
} from '../../../shared/constants/storageKeys'
import type {
  Hospital,
  HospitalLicense,
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
import {
  listDashboardData,
  upsertHospitalWithLicenses,
  upsertLicense,
} from '../api/googleSheetsClient'

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

const BACKGROUND_SYNC_INTERVAL_MS = 30000

export function useDashboardState() {
  const appScriptUrl = import.meta.env.VITE_APPS_SCRIPT_URL?.trim() ?? ''
  const hasRemoteSync = appScriptUrl.length > 0

  const [hospitals, setHospitals] = useState<Hospital[]>(() =>
    hasRemoteSync ? [] : seedHospitals,
  )
  const [licenses, setLicenses] = useState<HospitalLicense[]>(() =>
    hasRemoteSync ? [] : seedLicenses,
  )
  const [isSyncing, setIsSyncing] = useState(false)
  const [lastSyncedAt, setLastSyncedAt] = useState<number | null>(() => {
    if (typeof window === 'undefined') {
      return null
    }

    const saved = Number(localStorage.getItem(LAST_SYNC_STORAGE_KEY))
    return Number.isFinite(saved) ? saved : null
  })

  const [selectedHospitalId, setSelectedHospitalId] = useState('all')
  const [selectedCategory, setSelectedCategory] = useState<LicenceCategory | 'All'>('All')

  const [banner, setBanner] = useState('')

  const [isLicenseModalOpen, setIsLicenseModalOpen] = useState(false)
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
  const syncInFlightRef = useRef(false)

  useEffect(() => {
    if (!hasRemoteSync) {
      return
    }

    localStorage.removeItem(DASHBOARD_STORAGE_KEY)
    localStorage.removeItem(LEGACY_RECORD_STORAGE_KEY)
  }, [hasRemoteSync])

  useEffect(() => {
    if (hasRemoteSync) {
      return
    }

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
  }, [hasRemoteSync])

  useEffect(() => {
    localStorage.setItem(DASHBOARD_STORAGE_KEY, JSON.stringify({ hospitals, licenses }))
  }, [hospitals, licenses])

  const markSyncSuccess = (syncedAt: number | null = null) => {
    const timestamp = syncedAt ?? Date.now()
    setLastSyncedAt(timestamp)
    localStorage.setItem(LAST_SYNC_STORAGE_KEY, `${timestamp}`)
  }

  const syncFromGoogleSheets = useCallback(
    async ({ showSuccessBanner, showErrorBanner, markBusy }: {
      showSuccessBanner: boolean
      showErrorBanner: boolean
      markBusy: boolean
    }) => {
      if (!appScriptUrl || syncInFlightRef.current) {
        return
      }

      syncInFlightRef.current = true
      if (markBusy) {
        setIsSyncing(true)
      }

      try {
        const remoteData = await listDashboardData(appScriptUrl)
        setHospitals(remoteData.hospitals)
        setLicenses(remoteData.licenses)
        markSyncSuccess(remoteData.syncedAt)

        if (showSuccessBanner) {
          setBanner('Synced latest data from Google Sheets.')
        }
      } catch {
        if (showErrorBanner) {
          setBanner('Google Sheets sync failed. Showing last available local data.')
        }
      } finally {
        syncInFlightRef.current = false
        if (markBusy) {
          setIsSyncing(false)
        }
      }
    },
    [appScriptUrl],
  )

  useEffect(() => {
    if (!appScriptUrl) {
      setBanner('Apps Script URL is missing. Showing local data only.')
      return
    }

    void syncFromGoogleSheets({
      showSuccessBanner: true,
      showErrorBanner: true,
      markBusy: true,
    })

    const runBackgroundSync = () => {
      void syncFromGoogleSheets({
        showSuccessBanner: false,
        showErrorBanner: false,
        markBusy: false,
      })
    }

    const syncOnVisible = () => {
      if (document.visibilityState === 'visible') {
        runBackgroundSync()
      }
    }

    const intervalId = window.setInterval(() => {
      if (document.visibilityState === 'visible') {
        runBackgroundSync()
      }
    }, BACKGROUND_SYNC_INTERVAL_MS)

    window.addEventListener('focus', runBackgroundSync)
    document.addEventListener('visibilitychange', syncOnVisible)

    return () => {
      window.clearInterval(intervalId)
      window.removeEventListener('focus', runBackgroundSync)
      document.removeEventListener('visibilitychange', syncOnVisible)
    }
  }, [appScriptUrl, syncFromGoogleSheets])

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

  const openCreateLicenseModal = () => {
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

  const saveLicenseModal = async () => {
    if (isSyncing) {
      return
    }

    const errors = validateLicenseFields(modalDraft)
    setModalErrors(errors)
    if (errors.licenceName || errors.category || errors.expiryDate) {
      return
    }

    const nextStatus =
      modalDraft.status === 'In Review'
        ? 'In Review'
        : defaultStatusFromExpiry(modalDraft.expiryDate)

    const nextLicense: HospitalLicense = {
      ...modalDraft,
      id: createId('L'),
      status: nextStatus,
    }

    if (appScriptUrl) {
      setIsSyncing(true)
      try {
        const syncedAt = await upsertLicense(appScriptUrl, nextLicense)
        markSyncSuccess(syncedAt)
      } catch {
        setBanner('Unable to save license to Google Sheets.')
        return
      } finally {
        setIsSyncing(false)
      }
    }

    setLicenses((prev) => [
      ...prev,
      nextLicense,
    ])
    setBanner('License added successfully.')

    setIsLicenseModalOpen(false)
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

  const saveWizard = async () => {
    if (isSyncing) {
      return
    }

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

    if (appScriptUrl) {
      setIsSyncing(true)
      try {
        const syncedAt = await upsertHospitalWithLicenses(appScriptUrl, {
          hospital: newHospital,
          licenses: newLicenses,
        })
        markSyncSuccess(syncedAt)
      } catch {
        setBanner('Unable to create hospital setup in Google Sheets.')
        return
      } finally {
        setIsSyncing(false)
      }
    }

    setHospitals((prev) => [...prev, newHospital])
    setLicenses((prev) => [...prev, ...newLicenses])
    setSelectedHospitalId(newHospitalId)
    setIsWizardOpen(false)
    setBanner('Hospital and licenses created successfully.')
  }

  return {
    hospitals,
    licenses,
    isSyncing,
    lastSyncedAt,
    selectedHospitalId,
    selectedCategory,
    banner,
    isLicenseModalOpen,
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
    setModalDraft,
    setHospitalDraft,
    setWizardStep,
    setIsLicenseModalOpen,
    setIsWizardOpen,
    setAuthBanner: setBanner,
    openCreateLicenseModal,
    saveLicenseModal,
    exportFiltered,
    openWizard,
    goWizardNext,
    addWizardLicense,
    updateWizardLicense,
    removeWizardLicense,
    saveWizard,
  }
}
