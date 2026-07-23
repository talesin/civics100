/**
 * Phase-1 placeholder screen — proves the shared data/engine path on a real device.
 *
 * It mirrors the Phase-0 spike probes, now as an expo-router screen:
 *   1. `questionnaire/data` (the subpath export, lowest effect-"." risk) — proves the
 *      JSON is bundled into Hermes (no Node fs). Renders count + Q1.
 *   2. A guarded `Effect.runPromise(loadQuestions(...))` from the `questionnaire` ROOT
 *      export — this is what exercises effect's "." graph on-device (Phase-0 finding #4).
 *      Wrapped in try/catch so a resolution/runtime failure renders a red row, not a
 *      white screen — that red row IS the on-device evidence to read off.
 *   3. One `animation="bouncy"` enter animation, exercising the native moti/reanimated-4
 *      driver wired via animations.native.ts.
 *
 * Phase 5 replaces this with the real shared screens from packages/app.
 */
import { useEffect, useState } from 'react'
import { Effect } from 'effect'
import { rawCivicsQuestions, TOTAL_QUESTION_COUNT } from 'questionnaire/data'
import { civicsQuestionsWithDistractors, loadQuestions } from 'questionnaire'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { Text, XStack, YStack } from 'tamagui'

type Probe = { label: string; ok: boolean; detail: string }

export default function Index() {
  const insets = useSafeAreaInsets()
  const [probes, setProbes] = useState<Probe[]>([])

  useEffect(() => {
    const results: Probe[] = []

    // Probe 1 — data bundled into Hermes via the `questionnaire/data` subpath (no fs)
    try {
      const first = rawCivicsQuestions[0]
      results.push({
        label: 'questionnaire/data import',
        ok: TOTAL_QUESTION_COUNT > 0 && !!first,
        detail: `${TOTAL_QUESTION_COUNT} questions, Q1: "${first?.question ?? '??'}"`,
      })
    } catch (e) {
      results.push({ label: 'questionnaire/data import', ok: false, detail: String(e) })
    }

    // Probe 2 — run the Effect engine (exercises effect's "." graph on Hermes)
    Effect.runPromise(
      loadQuestions({
        questions: civicsQuestionsWithDistractors,
        // StateAbbreviation is a branded string; any valid 2-letter code works.
        userState: 'CA' as never,
        questionNumbers: [1],
      })
    )
      .then((qs) => {
        setProbes([
          ...results,
          {
            label: 'loadQuestions Effect',
            ok: qs.length > 0,
            detail: `engine produced ${qs.length} question(s); options: ${
              qs[0]?.answers.length ?? 0
            }`,
          },
        ])
      })
      .catch((e) => {
        setProbes([
          ...results,
          { label: 'loadQuestions Effect', ok: false, detail: String(e) },
        ])
      })
  }, [])

  return (
    <YStack
      flex={1}
      backgroundColor="$background"
      paddingTop={insets.top + 24}
      paddingHorizontal="$6"
      gap="$4"
    >
      {/* Native-driver animation + $token props */}
      <YStack
        animation="bouncy"
        enterStyle={{ opacity: 0, scale: 0.9, y: -10 }}
        opacity={1}
        scale={1}
        y={0}
        backgroundColor="$primary"
        borderRadius="$4"
        padding="$4"
      >
        <Text color="$background" fontSize={20} fontWeight="700">
          Civics Test — apps/mobile
        </Text>
        <Text color="$background" fontSize={13}>
          Phase 1 scaffold: Tamagui + questionnaire data on Hermes
        </Text>
      </YStack>

      {/* Probe results */}
      <YStack gap="$3">
        {probes.length === 0 ? (
          <Text color="$color">Running probes…</Text>
        ) : (
          probes.map((p) => (
            <XStack key={p.label} gap="$2" alignItems="flex-start">
              <Text color={p.ok ? '$success' : '$error'} fontWeight="700">
                {p.ok ? '✓' : '✗'}
              </Text>
              <YStack flex={1}>
                <Text color="$color" fontWeight="600">
                  {p.label}
                </Text>
                <Text color="$placeholderColor" fontSize={12}>
                  {p.detail}
                </Text>
              </YStack>
            </XStack>
          ))
        )}
      </YStack>
    </YStack>
  )
}
