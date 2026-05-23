import type { ThemeMode } from '../../../shared/types/domain'
import type { useDashboardState } from '../hooks/useDashboardState'
import styles from './DashboardPage.module.css'
import { ControlsBar } from './ControlsBar'
import { DashboardHeader } from './DashboardHeader'
import { HospitalDirectory } from './HospitalDirectory'
import { KpiCards } from './KpiCards'
import { LicenseModal } from './LicenseModal'
import { LicenseRegisterTable } from './LicenseRegisterTable'
import { SidePanels } from './SidePanels'
import { WizardModal } from './WizardModal'

type DashboardPageProps = {
  themeMode: ThemeMode
  onToggleTheme: () => void
  onLogout: () => void
  state: ReturnType<typeof useDashboardState>
}

export function DashboardPage(props: DashboardPageProps) {
  const { themeMode, onToggleTheme, onLogout, state } = props

  const {
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
  } = state

  return (
    <div className={styles.dashboardShell}>
      <DashboardHeader
        themeMode={themeMode}
        totalHospitals={totalHospitals}
        totalLicenses={licenses.length}
        criticalCount={criticalCount}
        onToggleTheme={onToggleTheme}
        onLogout={onLogout}
        onOpenWizard={openWizard}
      />

      {banner ? <p className={styles.statusBanner}>{banner}</p> : null}

      <HospitalDirectory
        hospitals={hospitals}
        selectedHospitalId={selectedHospitalId}
        totalLicenses={licenses.length}
        hospitalCounts={hospitalCounts}
        onSelectHospital={setSelectedHospitalId}
      />

      <KpiCards
        totalLicenses={enrichedFilteredLicenses.length}
        criticalCount={criticalCount}
        dueSoonCount={dueSoonCount}
        compliantCount={compliantCount}
      />

      <ControlsBar
        selectedCategory={selectedCategory}
        onSelectCategory={setSelectedCategory}
        onOpenCreateLicense={openCreateLicenseModal}
        onExport={exportFiltered}
      />

      <section className={styles.contentGrid}>
        <SidePanels actionQueue={actionQueue} upcomingMilestones={upcomingMilestones} />

        <LicenseRegisterTable
          licenses={enrichedFilteredLicenses}
          inlineEditId={inlineEditId}
          inlineDraft={inlineDraft}
          inlineErrors={inlineErrors}
          onInlineDraftChange={setInlineDraft}
          onStartInlineEdit={startInlineEdit}
          onSaveInlineEdit={saveInlineEdit}
          onCancelInlineEdit={cancelInlineEdit}
          onOpenEditModal={openEditLicenseModal}
        />
      </section>

      {isLicenseModalOpen ? (
        <LicenseModal
          hospitals={hospitals}
          mode={licenseModalMode}
          draft={modalDraft}
          errors={modalErrors}
          onClose={() => setIsLicenseModalOpen(false)}
          onSave={saveLicenseModal}
          onDraftChange={setModalDraft}
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
        />
      ) : null}
    </div>
  )
}
