internal import Expo
import FirebaseCore
import Foundation
import React
import ReactAppDependencyProvider

@main
class AppDelegate: ExpoAppDelegate {
  var window: UIWindow?

  var reactNativeDelegate: ExpoReactNativeFactoryDelegate?
  var reactNativeFactory: RCTReactNativeFactory?

  public override func application(
    _ application: UIApplication,
    didFinishLaunchingWithOptions launchOptions: [UIApplication.LaunchOptionsKey: Any]? = nil
  ) -> Bool {
    let delegate = ReactNativeDelegate()
    let factory = ExpoReactNativeFactory(delegate: delegate)
    delegate.dependencyProvider = RCTAppDependencyProvider()

    reactNativeDelegate = delegate
    reactNativeFactory = factory

#if os(iOS) || os(tvOS)
    window = UIWindow(frame: UIScreen.main.bounds)
// @generated begin @react-native-firebase/app-didFinishLaunchingWithOptions - expo prebuild (DO NOT MODIFY) sync-10e8520570672fd76b2403b7e1e27f5198a6349a
FirebaseApp.configure()
// @generated end @react-native-firebase/app-didFinishLaunchingWithOptions
    factory.startReactNative(
      withModuleName: "main",
      in: window,
      launchOptions: launchOptions)
#endif

    return super.application(application, didFinishLaunchingWithOptions: launchOptions)
  }

  // Linking API
  public override func application(
    _ app: UIApplication,
    open url: URL,
    options: [UIApplication.OpenURLOptionsKey: Any] = [:]
  ) -> Bool {
    return super.application(app, open: url, options: options) || RCTLinkingManager.application(app, open: url, options: options)
  }

  // Universal Links
  public override func application(
    _ application: UIApplication,
    continue userActivity: NSUserActivity,
    restorationHandler: @escaping ([UIUserActivityRestoring]?) -> Void
  ) -> Bool {
    let result = RCTLinkingManager.application(application, continue: userActivity, restorationHandler: restorationHandler)
    return super.application(application, continue: userActivity, restorationHandler: restorationHandler) || result
  }
}

class ReactNativeDelegate: ExpoReactNativeFactoryDelegate {
  override func sourceURL(for bridge: RCTBridge) -> URL? {
    configureMetroHostForPhysicalDevice()
    return bridge.bundleURL ?? bundleURL()
  }

  override func bundleURL() -> URL? {
    configureMetroHostForPhysicalDevice()
#if DEBUG
    return RCTBundleURLProvider.sharedSettings().jsBundleURL(forBundleRoot: ".expo/.virtual-metro-entry")
#else
    return Bundle.main.url(forResource: "main", withExtension: "jsbundle")
#endif
  }

  /// Physical devices cannot use localhost — Metro runs on the Mac.
  private func configureMetroHostForPhysicalDevice() {
#if DEBUG
#if targetEnvironment(simulator)
    return
#else
    let provider = RCTBundleURLProvider.sharedSettings()
    if let host = Self.resolveMetroBundlerHost(), !host.isEmpty {
      provider.jsLocation = host
      NSLog("[Metro] Physical device bundler host: \(host)")
    } else {
      NSLog("[Metro] No bundler host — start Metro: npx expo start --dev-client --lan")
    }
#endif
#endif
  }

  private static func resolveMetroBundlerHost() -> String? {
    if let envHost = ProcessInfo.processInfo.environment["REACT_NATIVE_PACKAGER_HOSTNAME"],
       !envHost.isEmpty {
      return envHost
    }

    if let url = Bundle.main.url(forResource: "DevMetroHost", withExtension: "plist"),
       let data = try? Data(contentsOf: url),
       let plist = try? PropertyListSerialization.propertyList(from: data, options: [], format: nil) as? [String: Any],
       let host = plist["MetroHost"] as? String,
       !host.isEmpty {
      return host
    }

    return nil
  }
}
