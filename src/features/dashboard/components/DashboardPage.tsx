import { useMemo, useRef } from 'react'
import type { ThemeMode } from '../../../shared/types/domain'
import type { useDashboardState } from '../hooks/useDashboardState'
import styles from './DashboardPage.module.css'
import { exportElementToPdf } from '../../../shared/utils/exportPdf'
import { DashboardHeader } from './DashboardHeader'
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
    isInitialLoadPending,
    isSyncing,
    lastSyncedAt,
    selectedStatus,
    statusOptions,
    searchQuery,
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

  const showInitialLoadingState = isInitialLoadPending

  return (
    <div className={styles.dashboardShell}>
      <DashboardHeader
        themeMode={themeMode}
        lastSyncedAt={lastSyncedAt}
        onToggleTheme={onToggleTheme}
        onLogout={onLogout}
      />

      {banner ? <p className={styles.statusBanner}>{banner}</p> : null}

      {showInitialLoadingState ? (
        <section className={`${styles.card} ${styles.loadingPanel}`} aria-live="polite" aria-busy="true">
          <div className={styles.loadingCopy}>
            <p className={styles.loadingEyebrow}>Sync in progress</p>
            <h2>Fetching the latest licence data from Google Sheets.</h2>
            <p>
              This usually takes a few seconds. The dashboard will populate automatically as soon as the sync completes.
            </p>
          </div>
          <div className={styles.loadingPulseRow} aria-hidden="true">
            <span className={styles.loadingDot} />
            <span className={styles.loadingDot} />
            <span className={styles.loadingDot} />
          </div>
        </section>
      ) : null}

      {showInitialLoadingState ? (
        <>
          <section className={`${styles.card} ${styles.loadingHeroCard}`} aria-hidden="true">
            <div className={styles.loadingBarShort} />
            <div className={styles.loadingBarLong} />
          </section>

          <section className={styles.statsGrid} aria-hidden="true">
            {[0, 1, 2, 3].map((item) => (
              <article key={item} className={`${styles.card} ${styles.stat} ${styles.loadingStatCard}`}>
                <div className={styles.loadingLabel} />
                <div className={styles.loadingValue} />
                <div className={styles.loadingMeta} />
              </article>
            ))}
          </section>

          <section className={styles.dashboardBody} aria-hidden="true">
            <div className={styles.sideColumn}>
              <section className={`${styles.card} ${styles.loadingSidePanel}`}>
                <div className={styles.loadingPanelTitle} />
                <div className={styles.loadingListItem} />
                <div className={styles.loadingListItem} />
                <div className={styles.loadingListItemShort} />
              </section>

              <article className={`${styles.card} ${styles.loadingChartCard}`}>
                <div className={styles.loadingPanelTitle} />
                <div className={styles.loadingChart} />
                <div className={styles.loadingLegendRow} />
                <div className={styles.loadingLegendRow} />
                <div className={styles.loadingLegendRowShort} />
              </article>
            </div>

            <article className={`${styles.card} ${styles.loadingTableCard}`}>
              <div className={styles.loadingPanelTitle} />
              <div className={styles.loadingTableHeader} />
              {[0, 1, 2, 3, 4].map((item) => (
                <div key={item} className={styles.loadingTableRow} />
              ))}
            </article>
          </section>
        </>
      ) : (
        <>
          <KpiCards
            totalLicenses={enrichedFilteredLicenses.length}
            activeLicensesCount={activeLicensesCount}
            expiredLicensesCount={expiredLicensesCount}
            dueSoonLicensesCount={dueSoonLicensesCount}
          />

          <section className={styles.dashboardBody} ref={contentGridRef}>
            <div className={styles.sideColumn}>
              <QuickActionsPanel queueItems={immediateActionQueue} />
              <StatusDonutPanel licenses={enrichedFilteredLicenses} />
            </div>

            <LicenseRegisterTable
              licenses={enrichedFilteredLicenses}
              searchQuery={searchQuery}
              onSearchQueryChange={setSearchQuery}
              selectedStatus={selectedStatus}
              statusOptions={statusOptions}
              onSelectStatus={setSelectedStatus}
              onClearFilters={handleClearFilters}
              onExport={exportFiltered}
              onExportPdf={handleExportPdf}
            />
          </section>
        </>
      )}

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
