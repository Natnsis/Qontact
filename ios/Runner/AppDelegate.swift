import ContactsUI
import Flutter
import UIKit

@main
@objc class AppDelegate: FlutterAppDelegate, FlutterImplicitEngineDelegate {
  private let devicePicker = DeviceContactPicker()

  override func application(
    _ application: UIApplication,
    didFinishLaunchingWithOptions launchOptions: [UIApplication.LaunchOptionsKey: Any]?
  ) -> Bool {
    return super.application(application, didFinishLaunchingWithOptions: launchOptions)
  }

  func didInitializeImplicitFlutterEngine(_ engineBridge: FlutterImplicitEngineBridge) {
    GeneratedPluginRegistrant.register(with: engineBridge.pluginRegistry)
    if let registrar = engineBridge.pluginRegistry.registrar(forPlugin: "LinksyDevice") {
      devicePicker.register(messenger: registrar.messenger())
    }
  }
}

/// Lets the user pick their own contact card to fill in their Linksy card.
/// iOS has no API for reading the device's own phone number, and the system
/// contact picker needs no Contacts permission.
final class DeviceContactPicker: NSObject, CNContactPickerDelegate {
  private var pending: FlutterResult?

  func register(messenger: FlutterBinaryMessenger) {
    let channel = FlutterMethodChannel(name: "linksy/device", binaryMessenger: messenger)
    channel.setMethodCallHandler { [weak self] call, result in
      guard let self else { return }
      switch call.method {
      case "pickContact":
        self.present(result)
      default:
        result(FlutterMethodNotImplemented)
      }
    }
  }

  private func present(_ result: @escaping FlutterResult) {
    guard pending == nil, let top = Self.topViewController() else {
      result(FlutterError(code: "busy", message: "Picker unavailable", details: nil))
      return
    }
    pending = result
    let picker = CNContactPickerViewController()
    picker.delegate = self
    top.present(picker, animated: true)
  }

  func contactPicker(_ picker: CNContactPickerViewController, didSelect contact: CNContact) {
    var out: [String: String] = [:]
    let name = CNContactFormatter.string(from: contact, style: .fullName) ?? ""
    if !name.isEmpty { out["name"] = name }
    if let phone = contact.phoneNumbers.first?.value.stringValue, !phone.isEmpty { out["phone"] = phone }
    if let email = contact.emailAddresses.first?.value as String?, !email.isEmpty { out["email"] = email }
    if !contact.organizationName.isEmpty { out["company"] = contact.organizationName }
    if !contact.jobTitle.isEmpty { out["title"] = contact.jobTitle }
    finish(out.isEmpty ? nil : out)
  }

  func contactPickerDidCancel(_ picker: CNContactPickerViewController) {
    finish(nil)
  }

  private func finish(_ value: Any?) {
    pending?(value)
    pending = nil
  }

  private static func topViewController() -> UIViewController? {
    let window = UIApplication.shared.connectedScenes
      .compactMap { $0 as? UIWindowScene }
      .flatMap { $0.windows }
      .first { $0.isKeyWindow }
    var top = window?.rootViewController
    while let presented = top?.presentedViewController { top = presented }
    return top
  }
}
