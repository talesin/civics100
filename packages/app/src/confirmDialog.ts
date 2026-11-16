/**
 * Web half of the platform-split confirmation prompt: the browser's blocking
 * `confirm()`, which has no title, so only the message is shown. The native
 * half (`confirmDialog.native.ts`) wraps React Native's Alert.
 */
export const confirmDialog = (_title: string, message: string): Promise<boolean> =>
  Promise.resolve(window.confirm(message))
