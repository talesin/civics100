import * as Haptics from 'expo-haptics'

/**
 * Native half of the platform-split haptics module — see haptics.ts for the
 * contract. Notification feedback on answer submit (success / error); the
 * promise is fire-and-forget and swallowed on devices without a haptic engine.
 */
export const hapticAnswerFeedback = (isCorrect: boolean): void => {
  void Haptics.notificationAsync(
    isCorrect ? Haptics.NotificationFeedbackType.Success : Haptics.NotificationFeedbackType.Error
  ).catch(() => {})
}
