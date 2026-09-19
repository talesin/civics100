import React, { useMemo, useState } from 'react'
import { Modal, Pressable, ScrollView, StyleSheet, type ViewStyle } from 'react-native'
import { Input, styled, Text, XStack, YStack } from 'tamagui'
import { Check } from '../icons'

/**
 * Native half of the editorial form controls. The web half is a styled
 * <input>/<select>; React Native has neither, so the call sites' DOM-shaped
 * API is kept and adapted here: EditorialSelect reads its <option> children
 * into a list and shows them in a modal sheet, EditorialInput wraps
 * Tamagui's Input, and both hand `onChange` an object carrying
 * `target.value` — the only part of the event the callers read.
 */

type SelectProps = Omit<React.SelectHTMLAttributes<HTMLSelectElement>, 'color'>
type InputProps = Omit<React.InputHTMLAttributes<HTMLInputElement>, 'color'>

interface SelectOption {
  readonly value: string
  readonly label: string
}

const changeEvent = <T,>(value: string): React.ChangeEvent<T> =>
  ({ target: { value }, currentTarget: { value } }) as unknown as React.ChangeEvent<T>

// Flattens nested arrays (mapped options) and joins mixed text children
// (`{count} questions`) the way the DOM renders an <option>'s text.
const optionsFromChildren = (children: React.ReactNode): readonly SelectOption[] =>
  React.Children.toArray(children).flatMap((child) => {
    if (!React.isValidElement(child) || child.type !== 'option') return []
    const props = child.props as {
      readonly value?: string | number
      readonly children?: React.ReactNode
    }
    return [
      {
        value: String(props.value ?? ''),
        label: React.Children.toArray(props.children).join('').trim()
      }
    ]
  })

const Field = styled(XStack, {
  name: 'EditorialSelectField',
  width: '100%',
  paddingVertical: 9,
  paddingHorizontal: 12,
  borderWidth: 1,
  borderColor: '$editorialRule',
  borderRadius: 5,
  backgroundColor: '$editorialPaper',
  alignItems: 'center',
  justifyContent: 'space-between',
  gap: 8,
  pressStyle: { borderColor: '$editorialAccent' }
})

const FieldText = styled(Text, {
  flex: 1,
  fontSize: 14,
  lineHeight: 21,
  color: '$editorialInk'
})

const Sheet = styled(YStack, {
  backgroundColor: '$editorialPaper',
  borderTopLeftRadius: 12,
  borderTopRightRadius: 12,
  borderWidth: 1,
  borderColor: '$editorialRule',
  maxHeight: '70%',
  paddingTop: 8,
  paddingBottom: 32
})

const OptionRow = styled(XStack, {
  paddingVertical: 12,
  paddingHorizontal: 20,
  alignItems: 'center',
  justifyContent: 'space-between',
  gap: 12,
  pressStyle: { backgroundColor: '$editorialRule' }
})

export function EditorialSelect({
  id,
  value,
  onChange,
  disabled,
  children,
  style
}: SelectProps): React.ReactElement {
  const [open, setOpen] = useState(false)
  const options = useMemo(() => optionsFromChildren(children), [children])
  // A <select> whose value matches no option displays its first option.
  const current = options.find((option) => option.value === String(value ?? '')) ?? options[0]

  const select = (option: SelectOption) => {
    setOpen(false)
    if (option.value !== current?.value) onChange?.(changeEvent<HTMLSelectElement>(option.value))
  }

  return (
    <>
      <Field
        testID={id}
        role="button"
        aria-label={current?.label}
        disabled={disabled === true}
        opacity={disabled === true ? 0.5 : 1}
        onPress={() => setOpen(true)}
        style={style as ViewStyle | undefined}
      >
        <FieldText numberOfLines={1}>{current?.label ?? ''}</FieldText>
        <Text fontSize={12} color="$editorialMuted">
          ▼
        </Text>
      </Field>
      <Modal transparent visible={open} animationType="fade" onRequestClose={() => setOpen(false)}>
        <YStack flex={1} justifyContent="flex-end" backgroundColor="rgba(15, 23, 42, 0.45)">
          <Pressable
            style={StyleSheet.absoluteFill}
            onPress={() => setOpen(false)}
            accessibilityRole="button"
            accessibilityLabel="Close"
          />
          <Sheet>
            <ScrollView>
              {options.map((option) => {
                const selected = option.value === current?.value
                return (
                  <OptionRow
                    key={option.value}
                    role="radio"
                    aria-checked={selected}
                    onPress={() => select(option)}
                  >
                    <Text
                      flex={1}
                      fontSize={16}
                      lineHeight={24}
                      color={selected ? '$editorialAccent' : '$editorialInk'}
                      fontWeight={selected ? '600' : '400'}
                    >
                      {option.label}
                    </Text>
                    {selected ? <Check size={18} color="$editorialAccent" /> : null}
                  </OptionRow>
                )
              })}
            </ScrollView>
          </Sheet>
        </YStack>
      </Modal>
    </>
  )
}

export function EditorialInput({
  id,
  value,
  onChange,
  placeholder,
  disabled,
  style
}: InputProps): React.ReactElement {
  return (
    <Input
      {...(id !== undefined ? { id, testID: id } : {})}
      value={String(value ?? '')}
      placeholder={placeholder}
      onChangeText={(text) => onChange?.(changeEvent<HTMLInputElement>(text))}
      editable={disabled !== true}
      width="100%"
      paddingVertical={9}
      paddingHorizontal={12}
      borderWidth={1}
      borderColor="$editorialRule"
      borderRadius={5}
      backgroundColor="$editorialPaper"
      color="$editorialInk"
      fontSize={14}
      focusStyle={{ borderColor: '$editorialAccent' }}
      style={style as ViewStyle | undefined}
    />
  )
}

export type EditorialInputProps = InputProps
export type EditorialSelectProps = SelectProps
