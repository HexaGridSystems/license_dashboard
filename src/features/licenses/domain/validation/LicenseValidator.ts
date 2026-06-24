import type { LicenseDraft, LicenseFieldErrors } from '../../../../shared/types/domain'

/**
 * Domain logic for license field validation.
 * Single source of truth for validation rules applied across modals and wizard.
 * No side effects.
 */
export class LicenseValidator {
  /**
   * Validates a license draft and returns errors keyed by field name.
   * Empty string means valid; non-empty means error message.
   */
  validate(draft: Pick<LicenseDraft, 'licenceName' | 'category' | 'expiryDate'>): LicenseFieldErrors {
    return {
      licenceName: draft.licenceName.trim() ? '' : 'Licence name is required.',
      category: draft.category ? '' : 'Category is required.',
      expiryDate: draft.expiryDate.trim() ? '' : 'Expiry date is required.',
    }
  }

  /**
   * Returns true if draft has no validation errors.
   */
  isValid(draft: Pick<LicenseDraft, 'licenceName' | 'category' | 'expiryDate'>): boolean {
    const errors = this.validate(draft)
    return Object.values(errors).every((error) => !error)
  }
}
