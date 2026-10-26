import 'package:flutter/foundation.dart';
import 'package:flutter/services.dart';

import 'device.dart';

/// Bluetooth LE card exchange. Native side: LinksyBle.kt (Android).
///
/// Events (maps with a `type`):
///   bt        {on}                 adapter switched on/off
///   peer      {id, name, rssi}     a Linksy phone is nearby (repeats as RSSI changes)
///   lost      {id}                 not seen for a while
///   incoming  {id, name}           someone asked to share with us
///   sent      {id}                 our request reached them
///   response  {id, ok, card}       they accepted (with their card) or declined
///   card      {id, card}           their card, after we accepted
///   delivered {id}                 our card reached them
///   failed    {id, message}        the connection to them failed
///   error     {message}
abstract final class Ble {
  static const _ch = MethodChannel('linksy/ble');
  static const _events = EventChannel('linksy/ble/events');

  static bool get supported => !kIsWeb && defaultTargetPlatform == TargetPlatform.android;

  static final Stream<Map<String, dynamic>> events = supported
      ? _events.receiveBroadcastStream().map((e) => Map<String, dynamic>.from(e as Map))
      : const Stream.empty();

  static Future<T?> _call<T>(String method, [Object? args]) async {
    if (!supported) return null;
    try {
      return await _ch.invokeMethod<T>(method, args);
    } on MissingPluginException {
      return null;
    }
  }

  static Future<bool> isOn() async => await _call<bool>('isOn') ?? false;

  /// Asks for the Nearby devices (Bluetooth) permissions.
  static Future<Access> permissions() async {
    try {
      return await _call<bool>('permissions') == true ? Access.granted : Access.denied;
    } on PlatformException catch (e) {
      return e.code == 'blocked' ? Access.blocked : Access.denied;
    }
  }

  /// Turns Bluetooth on: directly where allowed, otherwise via the one-tap
  /// system prompt. True if it is (or is turning) on.
  static Future<bool> enable() async {
    try {
      return await _call<bool>('enable') ?? false;
    } on PlatformException {
      return false;
    }
  }

  /// Turns Bluetooth off, or opens Bluetooth settings where apps can't.
  static Future<void> disable() => _call('disable');

  /// Starts being visible and scanning. Returns this phone's session id.
  /// Throws [PlatformException] when it can't: code `denied`/`blocked`
  /// (permission), `location` (Location off, Android 11 and below), `start`.
  static Future<String?> start(String name) => _call<String>('start', {'name': name});

  static Future<void> stop() => _call('stop');

  static Future<bool> request(String id) async => await _call<bool>('request', {'id': id}) ?? false;

  static Future<bool> respond(String id, {required bool accept, Map<String, String>? card}) async =>
      await _call<bool>('respond', {'id': id, 'accept': accept, 'card': card}) ?? false;

  static Future<bool> sendCard(String id, Map<String, String> card) async =>
      await _call<bool>('sendCard', {'id': id, 'card': card}) ?? false;

  static Future<void> cancel(String id) => _call('cancel', {'id': id});
}
