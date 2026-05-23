import styles from './DashboardPage.module.css'
import { cx } from './utils'
import type { Hospital } from '../../../shared/types/domain'

type HospitalDirectoryProps = {
  hospitals: Hospital[]
  selectedHospitalId: string
  totalLicenses: number
  hospitalCounts: Map<string, number>
  onSelectHospital: (id: string) => void
}

export function HospitalDirectory(props: HospitalDirectoryProps) {
  const {
    hospitals,
    selectedHospitalId,
    totalLicenses,
    hospitalCounts,
    onSelectHospital,
  } = props

  return (
    <section className={cx(styles.hospitalDirectory, styles.card)}>
      <div className={cx(styles.sectionHead, styles.compact)}>
        <h3>Hospitals</h3>
      </div>
      <p className={styles.sectionHelp}>
        Select one hospital for focused work, or keep all hospitals for a full compliance portfolio view.
      </p>
      <div className={styles.hospitalList}>
        <button
          type="button"
          className={selectedHospitalId === 'all' ? styles.active : ''}
          onClick={() => onSelectHospital('all')}
        >
          All Hospitals ({totalLicenses})
        </button>
        {hospitals.map((hospital) => (
          <button
            type="button"
            key={hospital.id}
            className={selectedHospitalId === hospital.id ? styles.active : ''}
            onClick={() => onSelectHospital(hospital.id)}
          >
            {hospital.name} ({hospitalCounts.get(hospital.id) ?? 0})
          </button>
        ))}
      </div>
    </section>
  )
}
