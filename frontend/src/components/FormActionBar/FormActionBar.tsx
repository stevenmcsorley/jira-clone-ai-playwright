import { Button } from '../ui/Button'

interface FormActionBarProps {
  formId: string
  onCancel: () => void
  submitLabel: string
  savingLabel: string
  saving: boolean
  disabled?: boolean
}

export const FormActionBar = ({
  formId,
  onCancel,
  submitLabel,
  savingLabel,
  saving,
  disabled = false,
}: FormActionBarProps) => (
  <div
    data-testid="form-action-bar"
    className="fixed inset-x-0 bottom-0 z-30 flex gap-3 border-t border-gray-200 bg-white p-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] md:hidden"
  >
    <Button type="button" variant="secondary" onClick={onCancel} disabled={saving} className="min-h-11 flex-1">
      Cancel
    </Button>
    <Button type="submit" form={formId} disabled={saving || disabled} className="min-h-11 flex-1">
      {saving ? savingLabel : submitLabel}
    </Button>
  </div>
)
