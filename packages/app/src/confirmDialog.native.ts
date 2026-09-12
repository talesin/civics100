/**
 * Native half of the platform-split confirmation prompt: a two-button Alert
 * whose OK is styled destructive (every caller so far confirms a deletion).
 * Dismissing the sheet counts as Cancel.
 */
import { Alert } from 'react-native'

export const confirmDialog = (title: string, message: string): Promise<boolean> =>
  new Promise((resolve) => {
    Alert.alert(
      title,
      message,
      [
        { text: 'Cancel', style: 'cancel', onPress: () => resolve(false) },
        { text: 'OK', style: 'destructive', onPress: () => resolve(true) }
      ],
      { cancelable: true, onDismiss: () => resolve(false) }
    )
  })
