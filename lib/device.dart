import 'package:flutter/foundation.dart';
import 'package:flutter/services.dart';

/// Reads the user's own details from the phone to prefill their card.
/// Native side: MainActivity.kt (Android) and AppDelegate.swift (iOS).
abstract final class Device {
  static const _ch = MethodChannel('linksy/device');

  /// Only Android exposes the device's own number; iOS has no API for it.
  static bool get canReadNumber => !kIsWeb && defaultTargetPlatform == TargetPlatform.android;

  static bool get canPickContact =>
      !kIsWeb && (defaultTargetPlatform == TargetPlatform.android || defaultTargetPlatform == TargetPlatform.iOS);

  /// The phone's own number(s). Tries Google's Phone Number Hint picker first
  /// (no permission); if Play services can't provide it, reads the SIM cards.
  /// Returns an empty list if the user cancels or nothing is available.
  static Future<List<String>> phoneNumbers() async {
    if (!canReadNumber) return [];
    try {
      final n = await _ch.invokeMethod<String>('phoneNumberHint');
      return n == null || n.isEmpty ? [] : [n];
    } on PlatformException catch (e) {
      if (e.code != 'unavailable') return [];
    } on MissingPluginException {
      return [];
    }
    try {
      final list = await _ch.invokeListMethod<String>('simNumbers');
      return list ?? [];
    } on PlatformException {
      return [];
    } on MissingPluginException {
      return [];
    }
  }

  /// The user's own contact details: on Android the owner's "Me" profile if it
  /// has data, otherwise (and always on iOS) a contact the user picks.
  /// Keys: name, phone, email, company, title. Null if cancelled or denied.
  static Future<Map<String, String>?> contactCard() async {
    if (!canPickContact) return null;
    try {
      if (canReadNumber) {
        final me = await _ch.invokeMapMethod<String, String>('ownerProfile');
        if (me != null && (me.containsKey('name') || me.containsKey('phone'))) return me;
      }
      return await _ch.invokeMapMethod<String, String>('pickContact');
    } on PlatformException {
      return null;
    } on MissingPluginException {
      return null;
    }
  }

  static Future<T?> _call<T>(String method, [Object? args]) async {
    if (!canReadNumber) return null;
    try {
      return await _ch.invokeMethod<T>(method, args);
    } on PlatformException {
      return null;
    } on MissingPluginException {
      return null;
    }
  }

  /// Saves a received card as a new contact, silently: never prompts and
  /// never leaves the app. Null if Contacts access hasn't been granted.
  static Future<int?> saveContact(Map<String, String> card) => _call<int>('saveContact', card);

  static Future<void> deleteContact(int id) => _call('deleteContact', id);

  static Future<bool> hasContactsAccess() async => await _call<bool>('hasContactsPermission') ?? false;

  /// Asks for Contacts access (read: fill your card; write: save received cards).
  static Future<Access> requestContacts() async {
    if (!canReadNumber) return Access.denied;
    try {
      return await _ch.invokeMethod<bool>('contactsPermission') == true ? Access.granted : Access.denied;
    } on PlatformException catch (e) {
      return e.code == 'blocked' ? Access.blocked : Access.denied;
    } on MissingPluginException {
      return Access.denied;
    }
  }

  static Future<void> openAppSettings() => _call('openAppSettings');

  static Future<void> openLocationSettings() => _call('openLocationSettings');

  /// The "Success chime" setting's sound.
  static Future<void> chime() => _call('chime');
}

/// Result of a permission request. [blocked]: denied for good, so Android
/// won't show the dialog again and the user must allow it in Settings.
enum Access { granted, denied, blocked }
