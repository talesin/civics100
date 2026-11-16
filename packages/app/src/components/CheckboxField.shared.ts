/**
 * Shared contract for the platform-split labelled checkbox: the web half keeps
 * the settings page's raw <input type="checkbox"> + <label> (pixel parity and
 * the e2e `page.check('#id')` calls depend on a real checkbox); the native
 * half renders Tamagui's Checkbox + Label.
 */
export interface CheckboxFieldProps {
  readonly id: string
  readonly checked: boolean
  readonly onCheckedChange: (checked: boolean) => void
  readonly label: string
}
