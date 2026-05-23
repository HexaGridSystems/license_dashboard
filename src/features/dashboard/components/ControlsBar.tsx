import styles from './DashboardPage.module.css'
import { cx } from './utils'
import type { LicenceCategory } from '../../../shared/types/domain'

type ControlsBarProps = {
  selectedCategory: LicenceCategory | 'All'
  onSelectCategory: (category: LicenceCategory | 'All') => void
  onOpenCreateLicense: () => void
  onExport: () => void
}

export function ControlsBar(props: ControlsBarProps) {
  const { selectedCategory, onSelectCategory, onOpenCreateLicense, onExport } = props

  return (
    <section className={cx(styles.controls, styles.card)}>
      <p className={styles.sectionHelp}>
        Filter by category, then add or export exactly the set currently visible in the register.
      </p>
      <div className={styles.segmented}>
        {(
          [
            'All',
            'Licence',
            'Renewal',
            'Permit',
            'Statutory Filing',
            'Legal Certificate',
          ] as const
        ).map((type) => (
          <button
            key={type}
            type="button"
            className={selectedCategory === type ? styles.active : ''}
            onClick={() => onSelectCategory(type)}
          >
            {type}
          </button>
        ))}
      </div>

      <div className={styles.actionBar}>
        <button type="button" className={styles.secondaryAction} onClick={onOpenCreateLicense}>
          + Add License
        </button>
        <button type="button" className={styles.ghost} onClick={onExport}>
          Export Report
        </button>
      </div>
    </section>
  )
}
