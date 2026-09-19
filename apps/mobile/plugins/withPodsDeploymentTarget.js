// Config plugin: raise every CocoaPods target's iOS deployment target to React
// Native's supported floor.
//
// React Native's own post-install hook (react_native_post_install →
// ReactNativePodsUtils.updateOSDeploymentTarget) does this for each pod's main
// target, but CocoaPods gives a pod's RESOURCE BUNDLE targets the podspec's own
// minimum instead (react-native-svg's RNSVGFilters is 12.4, async-storage's
// resources bundle 13.4). Xcode 26+ refuses anything below 15.0, so
// `expo run:ios` fails at "Planning build" before compiling a line. The hook
// appended here sweeps all targets — bundles included — and lifts only those
// under `Helpers::Constants.min_ios_version_supported` (15.1 on RN 0.85), the
// same constant RN uses, so the app's `platform :ios` line stays authoritative.
//
// Referenced by path from app.config.ts; `ios/` is CNG-generated, so this is
// the only durable place for a Podfile edit.
const { withPodfile } = require('expo/config-plugins')

const MARKER = '# withPodsDeploymentTarget'

const HOOK = `
    ${MARKER}: resource-bundle targets keep their podspec's minimum, which
    # Xcode 26+ rejects below 15.0 — lift every target to RN's floor.
    installer.pods_project.targets.each do |target|
      target.build_configurations.each do |config|
        floor = Helpers::Constants.min_ios_version_supported
        if config.build_settings['IPHONEOS_DEPLOYMENT_TARGET'].to_f < floor.to_f
          config.build_settings['IPHONEOS_DEPLOYMENT_TARGET'] = floor
        end
      end
    end
`

// Inserts the hook right after the react_native_post_install(...) call inside
// the template's post_install block. Idempotent via MARKER.
function patchPodfile(contents) {
  if (contents.includes(MARKER)) return contents
  const call = /react_native_post_install\([\s\S]*?\n\s*\)\n/
  if (!call.test(contents)) {
    throw new Error(
      'withPodsDeploymentTarget: could not find react_native_post_install(...) in the Podfile'
    )
  }
  return contents.replace(call, (match) => match + HOOK)
}

const withPodsDeploymentTarget = (config) =>
  withPodfile(config, (mod) => {
    mod.modResults.contents = patchPodfile(mod.modResults.contents)
    return mod
  })

module.exports = withPodsDeploymentTarget
module.exports.patchPodfile = patchPodfile
