// Config plugin: keep expo-dev-menu out of the way of the Maestro flows on
// both platforms — no menu sheet on the first launch after an install or data
// reset, and no floating gear button over the app's header.
//
// expo-dev-menu opens at launch while `showsAtLaunch` is true or its
// onboarding has not been finished, and draws a floating action button at the
// top right; all three preferences default from the app's Info.plist /
// AndroidManifest meta-data (`EXDevMenuShowsAtLaunch` true,
// `EXDevMenuIsOnboardingFinished` false, `EXDevMenuShowFloatingActionButton`
// true) and the first two reset with the app's data. Maestro's
// `launchApp: clearState: true` resets that data, so without these overrides
// the menu sheet covers the freshly loaded app, and the floating button sits
// on the header's theme toggle, so a tap meant for the toggle opens the menu
// instead. The menu stays reachable through the shake gesture and the
// simulator/emulator keyboard shortcuts.
//
// Referenced by path from app.config.ts; `ios/` and `android/` are
// CNG-generated, so this is the only durable place for these edits.
const { withAndroidManifest, withInfoPlist, AndroidConfig } = require('expo/config-plugins')

const withQuietAndroid = (config) =>
  withAndroidManifest(config, (config) => {
    const application = AndroidConfig.Manifest.getMainApplicationOrThrow(config.modResults)
    AndroidConfig.Manifest.addMetaDataItemToMainApplication(application, 'EXDevMenuShowsAtLaunch', 'false')
    AndroidConfig.Manifest.addMetaDataItemToMainApplication(application, 'EXDevMenuIsOnboardingFinished', 'true')
    AndroidConfig.Manifest.addMetaDataItemToMainApplication(application, 'EXDevMenuShowFloatingActionButton', 'false')
    return config
  })

const withQuietIos = (config) =>
  withInfoPlist(config, (config) => {
    config.modResults.EXDevMenuShowsAtLaunch = false
    config.modResults.EXDevMenuIsOnboardingFinished = true
    config.modResults.EXDevMenuShowFloatingActionButton = false
    return config
  })

module.exports = function withDevMenuQuietLaunch(config) {
  return withQuietIos(withQuietAndroid(config))
}
