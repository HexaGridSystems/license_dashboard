import { useMemo, useRef } from 'react'
import type { ThemeMode } from '../../../shared/types/domain'
import type { useDashboardState } from '../hooks/useDashboardState'
import styles from './DashboardPage.module.css'
import { exportElementToPdf } from '../../../shared/utils/exportPdf'
import { ControlsBar } from './ControlsBar'
import { DashboardHeader } from './DashboardHeader'
import { HospitalDirectory } from './HospitalDirectory'
import { KpiCards } from './KpiCards'
import { LicenseModal } from './LicenseModal'
import { LicenseRegisterTable } from './LicenseRegisterTable'
import { QuickActionsPanel } from './QuickActionsPanel'
import { StatusDonutPanel } from './StatusDonutPanel'
import { WizardModal } from './WizardModal'

type DashboardPageProps = {
  themeMode: ThemeMode
  onToggleTheme: () => void
  onLogout: () => void
  state: ReturnType<typeof useDashboardState>
}

export function DashboardPage(props: DashboardPageProps) {
  const { themeMode, onToggleTheme, onLogout, state } = props
  const contentGridRef = useRef<HTMLElement | null>(null)

  const {
    hospitals,
    isSyncing,
    lastSyncedAt,
    selectedStatus,
    statusOptions,
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
    enrichedFilteredLicenses,
    activeLicensesCount,
    expiredLicensesCount,
    dueSoonLicensesCount,
    setSelectedStatus,
    setSearchQuery,
    setLicenceNameQuery,
    setLicenceNumberQuery,
    setModalDraft,
    setHospitalDraft,
    setWizardStep,
    setIsLicenseModalOpen,
    setIsWizardOpen,
    setAuthBanner,
    saveLicenseModal,
    exportFiltered,
    goWizardNext,
    addWizardLicense,
    updateWizardLicense,
    removeWizardLicense,
    saveWizard,
  } = state

  const handleExportPdf = async () => {
    const exportNode = contentGridRef.current
    if (!exportNode) {
      setAuthBanner('PDF export failed. Dashboard section is not available yet.')
      return
    }

    try {
      await exportElementToPdf({
        element: exportNode,
        filePrefix: 'Licence dashboard',
        title: 'Licence Dashboard Report',
      })
      setAuthBanner('PDF export opened. Choose Save as PDF to download.')
    } catch {
      setAuthBanner('PDF export failed. Please allow popups and try again.')
    }
  }

  const handleClearFilters = () => {
    setSearchQuery('')
    setLicenceNameQuery('')
    setLicenceNumberQuery('')
    setSelectedStatus('All')
  }

  const immediateActionQueue = useMemo(() => {
    const urgencyRank: Record<string, number> = {
      Overdue: 0,
      Critical: 1,
      Medium: 2,
      Low: 3,
    }

    return [...enrichedFilteredLicenses]
      .filter((license) =>
        license.renewal.urgency === 'Overdue'
        || license.renewal.urgency === 'Critical'
        || license.status === 'Expired'
        || license.status === 'Due Soon',
      )
      .sort((left, right) => {
        const byUrgency =
          (urgencyRank[left.renewal.urgency] ?? Number.MAX_SAFE_INTEGER)
          - (urgencyRank[right.renewal.urgency] ?? Number.MAX_SAFE_INTEGER)

        if (byUrgency !== 0) {
          return byUrgency
        }

        const leftDays = left.renewal.countdownDays ?? Number.MAX_SAFE_INTEGER
        const rightDays = right.renewal.countdownDays ?? Number.MAX_SAFE_INTEGER
        return leftDays - rightDays
      })
      .slice(0, 5)
  }, [enrichedFilteredLicenses])

  return (
    <div className={styles.dashboardShell}>
      <DashboardHeader
        themeMode={themeMode}
        lastSyncedAt={lastSyncedAt}
        onToggleTheme={onToggleTheme}
        onLogout={onLogout}
      />

      {banner ? <p className={styles.statusBanner}>{banner}</p> : null}

      <HospitalDirectory />

      <KpiCards
        totalLicenses={enrichedFilteredLicenses.length}
        activeLicensesCount={activeLicensesCount}
        expiredLicensesCount={expiredLicensesCount}
        dueSoonLicensesCount={dueSoonLicensesCount}
      />

      <ControlsBar
        searchQuery={searchQuery}
        onSearchQueryChange={setSearchQuery}
        licenceNameQuery={licenceNameQuery}
        onLicenceNameQueryChange={setLicenceNameQuery}
        licenceNumberQuery={licenceNumberQuery}
        onLicenceNumberQueryChange={setLicenceNumberQuery}
        selectedStatus={selectedStatus}
        statusOptions={statusOptions}
        onSelectStatus={setSelectedStatus}
        onClearFilters={handleClearFilters}
        onExport={exportFiltered}
        onExportPdf={handleExportPdf}
      />

      <section className={styles.dashboardBody}>
        <QuickActionsPanel
          queueItems={immediateActionQueue}
          totalLicenses={enrichedFilteredLicenses.length}
          expiredLicensesCount={expiredLicensesCount}
          dueSoonLicensesCount={dueSoonLicensesCount}
          onExportReport={exportFiltered}
          onExportPdf={handleExportPdf}
        />

        <section className={styles.contentGrid} ref={contentGridRef}>
          <LicenseRegisterTable
            licenses={enrichedFilteredLicenses}
          />
          <StatusDonutPanel licenses={enrichedFilteredLicenses} />
        </section>
      </section>

      {isLicenseModalOpen ? (
        <LicenseModal
          hospitals={hospitals}
          draft={modalDraft}
          errors={modalErrors}
          onClose={() => setIsLicenseModalOpen(false)}
          onSave={saveLicenseModal}
          onDraftChange={setModalDraft}
          isSyncing={isSyncing}
        />
      ) : null}

      {isWizardOpen ? (
        <WizardModal
          wizardStep={wizardStep}
          hospitalDraft={hospitalDraft}
          hospitalErrors={hospitalErrors}
          wizardLicenses={wizardLicenses}
          wizardLicenseErrors={wizardLicenseErrors}
          onClose={() => setIsWizardOpen(false)}
          onHospitalDraftChange={setHospitalDraft}
          onSetWizardStep={setWizardStep}
          onNext={goWizardNext}
          onSave={saveWizard}
          onAddLicense={addWizardLicense}
          onUpdateWizardLicense={updateWizardLicense}
          onRemoveWizardLicense={removeWizardLicense}
          isSyncing={isSyncing}
        />
      ) : null}
    </div>
  )
}
