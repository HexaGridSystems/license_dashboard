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
  LicenceStatus,
  RenewalUrgency,
  WizardLicenseDraft,
} from '../../../shared/types/domain'
import { getRenewalSignals, defaultStatusFromExpiry } from '../../licenses/utils/renewal'
import { formatDisplayDate } from '../../../shared/utils/date'
import { createId } from '../../../shared/utils/id'
import { migrateLegacyRecords } from '../../licenses/utils/migrateLegacy'
import { exportRowsToExcel } from '../../../shared/utils/exportExcel'
import { buildStatusColorMap, buildStatusOrder, normalizeStatusLabel } from '../components/statusColors'
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

function getLicenseNumberValue(license: HospitalLicense) {
  return (license.licenceNumber ?? '').trim()
}

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
  const [selectedStatus, setSelectedStatus] = useState<LicenceStatus | 'All'>('All')
  const [searchQuery, setSearchQuery] = useState('')
  const [licenceNameQuery, setLicenceNameQuery] = useState('')
  const [licenceNumberQuery, setLicenceNumberQuery] = useState('')

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

  const statusOptions = useMemo<(LicenceStatus | 'All')[]>(() => {
    const isSingleHospitalRemote = hasRemoteSync && hospitals.length <= 1
    const byHospital = licenses.filter((license) =>
      isSingleHospitalRemote
        ? true
        : selectedHospitalId === 'all' || license.hospitalId === selectedHospitalId,
    )

    const orderedStatuses = buildStatusOrder(byHospital.map((license) => license.status))
    const options: (LicenceStatus | 'All')[] = ['All', ...orderedStatuses]

    if (selectedStatus !== 'All' && !options.includes(selectedStatus)) {
      options.push(selectedStatus)
    }

    return options
  }, [hasRemoteSync, hospitals.length, licenses, selectedHospitalId, selectedStatus])

  const filteredLicenses = useMemo(() => {
    const normalizedSearchQuery = searchQuery.trim().toLowerCase()
    const normalizedLicenceNameQuery = licenceNameQuery.trim().toLowerCase()
    const normalizedLicenceNumberQuery = licenceNumberQuery.trim().toLowerCase()

    return licenses.filter((license) => {
      const isSingleHospitalRemote = hasRemoteSync && hospitals.length <= 1
      const byHospital =
        isSingleHospitalRemote
          ? true
          : selectedHospitalId === 'all' || license.hospitalId === selectedHospitalId
      const byStatus =
        selectedStatus === 'All'
          || normalizeStatusLabel(license.status) === normalizeStatusLabel(selectedStatus)

      const searchHaystack = [
        license.licenceName,
        license.category,
        license.owner,
        license.regulator,
        license.licenceNumber,
        license.id,
      ]
        .join(' ')
        .toLowerCase()

      const bySearch =
        !normalizedSearchQuery || searchHaystack.includes(normalizedSearchQuery)
      const byLicenceName =
        !normalizedLicenceNameQuery
          || license.licenceName.toLowerCase().includes(normalizedLicenceNameQuery)
      const byLicenceNumber =
        !normalizedLicenceNumberQuery
          || getLicenseNumberValue(license).toLowerCase().includes(normalizedLicenceNumberQuery)

      return byHospital && byStatus && bySearch && byLicenceName && byLicenceNumber
    })
  }, [
    hasRemoteSync,
    hospitals.length,
    licenses,
    selectedHospitalId,
    selectedStatus,
    searchQuery,
    licenceNameQuery,
    licenceNumberQuery,
  ])

  const enrichedFilteredLicenses = useMemo<EnrichedLicense[]>(() => {
    return filteredLicenses.map((license) => ({
      ...license,
      hospitalName: hospitalMap.get(license.hospitalId)?.name ?? 'Unknown Hospital',
      renewal: getRenewalSignals(license.expiryDate),
    }))
  }, [filteredLicenses, hospitalMap])

  const activeLicensesCount = enrichedFilteredLicenses.filter(
    (license) => license.status === 'Active',
  ).length
  const expiredLicensesCount = enrichedFilteredLicenses.filter(
    (license) => license.status === 'Expired',
  ).length
  const dueSoonLicensesCount = enrichedFilteredLicenses.filter(
    (license) => license.status === 'Due Soon',
  ).length
  const totalHospitals = hospitals.length

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
      status: 'Active',
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
      modalDraft.status === 'Due Soon'
        ? 'Due Soon'
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
    const actionLabelFromStatus = (status: HospitalLicense['status']) => {
      if (status === 'Expired') {
        return 'Renew now'
      }

      if (status === 'Due Soon') {
        return 'Follow up'
      }

      return 'Monitor'
    }

    const registerRows = enrichedFilteredLicenses.map((license, index) => ({
      serialNumber: index + 1,
      ...license,
    }))

    const statusOrder = buildStatusOrder(
      enrichedFilteredLicenses.map((license) => license.status),
    )
    const statusColorMap = buildStatusColorMap(statusOrder)
    const statusCounts = statusOrder.reduce<Record<string, number>>((acc, status) => {
      acc[status] = 0
      return acc
    }, {})

    for (const license of enrichedFilteredLicenses) {
      const status = normalizeStatusLabel(license.status)
      statusCounts[status] = (statusCounts[status] ?? 0) + 1
    }

    const total = enrichedFilteredLicenses.length
    const statusBreakdownRows = statusOrder.map((status) => {
      const count = statusCounts[status]
      const share = total > 0 ? Math.round((count / total) * 100) : 0

      return {
        Status: status,
        Count: count,
        Share: `${share}%`,
        Color: statusColorMap[status],
      }
    })

    exportRowsToExcel({
      rows: registerRows,
      columns: [
        { header: 'Serial Number', value: (row) => `${row.serialNumber}` },
        { header: 'License/Vendor name', value: (row) => row.licenceName },
        { header: 'Category', value: (row) => row.category },
        { header: 'Licence Number', value: (row) => getLicenseNumberValue(row) },
        { header: 'Valid from', value: (row) => formatDisplayDate(row.issueDate) },
        { header: 'Valid till', value: (row) => formatDisplayDate(row.expiryDate) },
        {
          header: 'Remaining days',
          value: (row) =>
            `${row.remainingDays ?? '-'}`,
        },
        { header: 'Status', value: (row) => row.status },
        {
          header: 'Action',
          value: (row) => row.action || actionLabelFromStatus(row.status),
        },
        {
          header: 'Documents',
          value: (row) => row.documents || '-',
        },
      ],
      additionalSheets: [
        {
          name: 'Status Breakdown',
          rows: statusBreakdownRows,
        },
      ],
      filePrefix: 'Licence dashboard',
    })
    setBanner('Excel report downloaded with register and status breakdown.')
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
    selectedStatus,
    searchQuery,
    licenceNameQuery,
    licenceNumberQuery,
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
    statusOptions,
    enrichedFilteredLicenses,
    activeLicensesCount,
    expiredLicensesCount,
    dueSoonLicensesCount,
    totalHospitals,
    setSelectedHospitalId,
    setSelectedStatus,
    setSearchQuery,
    setLicenceNameQuery,
    setLicenceNumberQuery,
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
