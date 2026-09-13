import { Checkbox, Label, XStack } from 'tamagui'
import { Check } from './icons'
import type { CheckboxFieldProps } from './CheckboxField.shared'

export default function CheckboxField({ id, checked, onCheckedChange, label }: CheckboxFieldProps) {
  return (
    <XStack alignItems="center" gap={10}>
      <Checkbox
        id={id}
        checked={checked}
        onCheckedChange={(next) => onCheckedChange(next === true)}
        borderColor="$editorialRule"
      >
        <Checkbox.Indicator>
          <Check size={14} />
        </Checkbox.Indicator>
      </Checkbox>
      <Label htmlFor={id} fontSize={14} fontWeight="500" color="$editorialMuted">
        {label}
      </Label>
    </XStack>
  )
}
