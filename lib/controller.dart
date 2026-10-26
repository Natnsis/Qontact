import 'dart:async';

import 'package:flutter/foundation.dart';
import 'package:flutter/services.dart';
import 'package:shared_preferences/shared_preferences.dart';

import 'ble.dart';
import 'data.dart';
import 'device.dart';

/// A short message for the UI, optionally with one action (e.g. "Settings").
class Notice {
  const Notice(this.text, {this.action, this.onAction});

  final String text;
  final String? action;
  final VoidCallback? onAction;
}

enum Screen { home, search, incoming, timeout, btoff, found, declined, transfer, success, qr, onboard, perm, settings }

/// App state and the exchange flow: discovery, request/accept, the card swap,
/// saving to contacts, plus the screen timers from the design.
class AppController extends ChangeNotifier {
  /// [bluetooth] is false in tests, where there is no native side.
  AppController({this.bluetooth = true});

  final bool bluetooth;

  Screen screen = Screen.home;
  int t = 15, wait = 20, xfer = 0, undo = 5;
  bool saved = false, autoSave = true, sound = false;

  /// System Bluetooth state, kept live by adapter events.
  bool btOn = true;

  final share = {'email': true, 'company': true, 'title': true};

  /// Fields removed for the current exchange only.
  Map<String, bool> once = {};

  final profile = Profile(name: '', phone: '', email: '', company: '', title: '');

  /// Whether the user has saved their card at least once.
  bool onboarded = false;

  /// Whether setup has already offered to read the phone's own number.
  bool numberOffered = false;

  /// Short messages for the UI to show (snackbar).
  final messages = StreamController<Notice>.broadcast();

  void _say(String text) => messages.add(Notice(text));

  /// A permission was refused for good: point to Settings instead of failing silently.
  void _blocked(String what) =>
      messages.add(Notice('Allow $what for Linksy in Settings.', action: 'Settings', onAction: Device.openAppSettings));

  // ---- exchange state

  /// This phone's Bluetooth session id while visible.
  String? _me;
  bool get _running => _me != null;

  /// Linksy phones in range, by session id.
  final nearby = <String, Peer>{};
  int _slots = 0;

  /// The person we're exchanging with.
  Peer? active;

  /// Our request reached them (sender side).
  bool requestSent = false;

  /// Why the request didn't go through (null = they declined).
  String? failReason;

  bool _animDone = false;
  int? _contactId;

  static const _fields = ['name', 'phone', 'email', 'company', 'title'];

  StreamSubscription<Map<String, dynamic>>? _sub;
  final _timers = <Timer>[];
  Timer? _iv;

  /// Restores the saved card and preferences; opens setup on first launch.
  Future<void> load() async {
    final p = await SharedPreferences.getInstance();
    onboarded = p.getBool('onboarded') ?? false;
    numberOffered = p.getBool('numberOffered') ?? false;
    contactsAsked = p.getBool('contactsAsked') ?? false;
    for (final k in _fields) {
      profile[k] = p.getString('profile.$k') ?? '';
    }
    for (final k in share.keys) {
      share[k] = p.getBool('share.$k') ?? true;
    }
    autoSave = p.getBool('autoSave') ?? true;
    sound = p.getBool('sound') ?? false;
    if (bluetooth && Ble.supported) {
      _sub = Ble.events.listen(_onEvent, onError: (_) {});
      btOn = await Ble.isOn();
    }
    screen = !onboarded ? Screen.onboard : (btOn ? Screen.home : Screen.btoff);
  }

  Future<void> _persist() async {
    final p = await SharedPreferences.getInstance();
    await p.setBool('onboarded', onboarded);
    await p.setBool('numberOffered', numberOffered);
    await p.setBool('contactsAsked', contactsAsked);
    for (final k in _fields) {
      await p.setString('profile.$k', profile[k]);
    }
    for (final e in share.entries) {
      await p.setBool('share.${e.key}', e.value);
    }
    await p.setBool('autoSave', autoSave);
    await p.setBool('sound', sound);
  }

  Peer get peer => active ?? Peer(id: '', name: '', slot: 0, code: '0000');

  bool get searchish => screen == Screen.search || screen == Screen.incoming;

  /// Up to five people on the radar, closest first.
  List<Peer> get radar => (nearby.values.toList()..sort((a, b) => b.rssi.compareTo(a.rssi))).take(5).toList();

  bool effective(String k) => share[k]! && !(once[k] ?? false);

  List<String> get sharedChips => [
    'Phone',
    for (final e in shareLabels.entries)
      if (share[e.key]!) e.value,
  ];

  /// Our card as sent to someone; [perExchange] applies this exchange's removals.
  Map<String, String> myCard({bool perExchange = false}) => {
    'name': profile.name.trim(),
    'phone': profile.phone.trim(),
    for (final k in shareLabels.keys)
      if ((perExchange ? effective(k) : share[k]!) && profile[k].trim().isNotEmpty) k: profile[k].trim(),
  };

  // ---------------------------------------------------------------- navigation

  /// Screens during which the radio stays on.
  static const _live = {Screen.search, Screen.incoming, Screen.found, Screen.declined, Screen.transfer};

  void go(Screen s) {
    _clear();
    if (s == Screen.home && !btOn) s = Screen.btoff;
    final from = screen;
    if (from == Screen.found && s != Screen.transfer && active != null && failReason == null) {
      Ble.cancel(active!.id);
    }
    if (!_live.contains(s) && _running) _stopRadio();
    screen = s;
    notifyListeners();
    _enter(s);
  }

  void _later(int ms, VoidCallback fn) => _timers.add(Timer(Duration(milliseconds: ms), fn));

  void _every(VoidCallback fn) => _iv = Timer.periodic(const Duration(seconds: 1), (_) => fn());

  void _clear() {
    for (final t in _timers) {
      t.cancel();
    }
    _timers.clear();
    _iv?.cancel();
  }

  void _enter(Screen s) {
    switch (s) {
      case Screen.search:
        t = 15;
        _every(() {
          if (t > 1) {
            t--;
          } else if (nearby.isNotEmpty) {
            t = 15; // people are here: keep looking instead of giving up
          } else {
            return go(Screen.timeout);
          }
          notifyListeners();
        });
      case Screen.incoming:
        // The request expires, as the sheet says.
        _later(20000, () {
          if (active != null) Ble.respond(active!.id, accept: false);
          go(Screen.search);
        });
      case Screen.found:
        wait = 20;
        _every(() {
          if (wait > 1) {
            wait--;
            return notifyListeners();
          }
          if (active != null) Ble.cancel(active!.id);
          failReason = 'No answer';
          go(Screen.declined);
        });
      case Screen.declined:
        _later(2400, () => go(Screen.home));
      case Screen.transfer:
        xfer = 0;
        _animDone = false;
        _later(80, () {
          xfer = 1;
          notifyListeners();
        });
        _later(950, () {
          xfer = 2;
          notifyListeners();
        });
        _later(1900, () {
          _animDone = true;
          _maybeFinish();
        });
        _later(9000, () {
          _say('Their card didn’t arrive. Try again with phones closer.');
          go(Screen.home);
        });
      case Screen.success:
        HapticFeedback.mediumImpact();
        if (sound) Device.chime();
        undo = 5;
        saved = false;
        _contactId = null;
        if (autoSave) _saveContact();
        _every(() {
          if (undo > 0) undo--;
          notifyListeners();
        });
      default:
        break;
    }
    notifyListeners();
  }

  // ---------------------------------------------------------------- bluetooth

  /// Starts (or resumes) searching. Both phones need to be doing this.
  Future<void> startSearch() async {
    if (!btOn) return go(Screen.btoff);
    once = {};
    active = null;
    go(Screen.search);
    if (_running || !bluetooth || !Ble.supported) return;
    nearby.clear();
    _slots = 0;
    try {
      _me = await Ble.start(profile.name.trim());
    } on PlatformException catch (e) {
      switch (e.code) {
        case 'blocked':
          _blocked('Nearby devices');
        case 'denied':
          _say('Linksy needs the Nearby devices permission to find people.');
        case 'location':
          messages.add(Notice(
            'Turn on Location to find nearby phones.',
            action: 'Turn on',
            onAction: Device.openLocationSettings,
          ));
        default:
          _say(e.message ?? 'Couldn’t start Bluetooth');
      }
      go(Screen.home);
    }
  }

  void _stopRadio() {
    _me = null;
    nearby.clear();
    Ble.stop();
  }

  /// The switch on the home screen.
  Future<void> toggleBluetooth() async {
    if (btOn) {
      await Ble.disable();
    } else {
      await turnOnBluetooth();
    }
  }

  bool _searchWhenOn = false;

  /// Turns Bluetooth on and goes straight to searching once it's up.
  Future<void> turnOnBluetooth() async {
    _searchWhenOn = true;
    final ok = await Ble.enable();
    if (!ok) _searchWhenOn = false;
    if (ok && await Ble.isOn()) _onBluetooth(true);
  }

  void _onBluetooth(bool on) {
    if (btOn == on) return;
    btOn = on;
    if (!on) {
      _me = null;
      nearby.clear();
      if (const {
        Screen.home,
        Screen.search,
        Screen.incoming,
        Screen.timeout,
        Screen.found,
        Screen.transfer,
      }.contains(screen)) {
        go(Screen.btoff);
      }
    } else if (screen == Screen.btoff) {
      if (_searchWhenOn) {
        _searchWhenOn = false;
        startSearch();
      } else {
        go(Screen.home);
      }
    }
    notifyListeners();
  }

  /// Sender: ask [p] to share.
  Future<void> pick(Peer p) async {
    active = p;
    requestSent = false;
    failReason = null;
    go(Screen.found);
    if (!await Ble.request(p.id) && screen == Screen.found && active == p) {
      failReason = 'Out of range';
      go(Screen.declined);
    }
  }

  /// Receiver: accept the incoming request and send our card back.
  void acceptIncoming() {
    final p = active;
    if (p == null) return;
    Ble.respond(p.id, accept: true, card: myCard());
    go(Screen.transfer);
  }

  void declineIncoming() {
    final p = active;
    if (p != null) Ble.respond(p.id, accept: false);
    active = null;
    go(Screen.home);
  }

  Peer _peerFor(String id, String name) {
    final p = nearby[id] ??= Peer(id: id, name: name, slot: _slots++, code: Peer.matchCode(_me ?? '', id));
    if (name.isNotEmpty) p.name = name;
    return p;
  }

  void _onEvent(Map<String, dynamic> e) {
    final id = e['id'] as String?;
    switch (e['type']) {
      case 'bt':
        _onBluetooth(e['on'] == true);
      case 'peer':
        if (!_running) return;
        _peerFor(id!, e['name'] as String? ?? '').rssi = (e['rssi'] as num).toDouble();
        if (searchish) notifyListeners();
      case 'lost':
        if (active?.id == id) return;
        nearby.remove(id);
        if (searchish) notifyListeners();
      case 'incoming':
        final p = _peerFor(id!, e['name'] as String? ?? '');
        if (screen == Screen.found && active?.id == id) {
          // Both picked each other: no need to ask twice.
          Ble.respond(id, accept: true, card: myCard(perExchange: true));
        } else if (screen == Screen.search) {
          active = p;
          go(Screen.incoming);
        } else {
          Ble.respond(id, accept: false);
        }
      case 'sent':
        if (active?.id == id) {
          requestSent = true;
          notifyListeners();
        }
      case 'response':
        if (active?.id != id || screen != Screen.found && screen != Screen.transfer) return;
        if (e['ok'] == true) {
          _addCard(e['card']);
          Ble.sendCard(id!, myCard(perExchange: true));
          if (screen != Screen.transfer) go(Screen.transfer);
          _maybeFinish();
        } else if (screen == Screen.found) {
          failReason = null;
          go(Screen.declined);
        }
      case 'card':
        if (active?.id != id) return;
        _addCard(e['card']);
        _maybeFinish();
      case 'failed':
        if (active?.id == id && screen == Screen.found) {
          failReason = 'Couldn’t reach them';
          go(Screen.declined);
        }
      case 'error':
        _say(e['message'] as String? ?? 'Bluetooth error');
    }
  }

  void _addCard(Object? card) {
    if (card is! Map || active == null) return;
    active!.card.addAll(card.map((k, v) => MapEntry('$k', '$v')));
  }

  void _maybeFinish() {
    final p = active;
    if (screen != Screen.transfer || !_animDone || p == null) return;
    if (p.phone.isNotEmpty || p.card.containsKey('name')) go(Screen.success);
  }

  // ---------------------------------------------------------------- contacts

  /// Saves the received card into Contacts in the background: no prompt, no
  /// leaving the app. Without Contacts access it just stays unsaved.
  Future<void> _saveContact() async {
    final p = active;
    if (p == null) return;
    final id = await Device.saveContact({...p.card, 'name': p.fullName});
    _contactId = id;
    saved = id != null;
    notifyListeners();
  }

  void undoSave() {
    _iv?.cancel();
    final id = _contactId;
    if (id != null) Device.deleteContact(id);
    _contactId = null;
    saved = false;
    undo = 0;
    notifyListeners();
  }

  /// "Save to Contacts" tile: the user asked, so Contacts access may be requested here.
  Future<void> saveNow() async {
    if (!await Device.hasContactsAccess()) {
      final access = await Device.requestContacts();
      if (access == Access.blocked) return _blocked('Contacts');
      if (access != Access.granted) return;
    }
    await _saveContact();
  }

  /// "Fix a typo": corrects the received card in the app and re-saves it.
  Future<void> fixCard(Map<String, String> fields) async {
    final p = active;
    if (p == null) return;
    p.card
      ..clear()
      ..addAll({
        for (final e in fields.entries)
          if (e.value.trim().isNotEmpty) e.key: e.value.trim(),
      });
    notifyListeners();
    final old = _contactId;
    if (old == null) return;
    await Device.deleteContact(old);
    await _saveContact();
  }

  // ---------------------------------------------------------------- card & settings

  void toggleShare(String k) {
    share[k] = !share[k]!;
    notifyListeners();
    _persist();
  }

  /// Saves the card. The first save continues to the permission explainer.
  void saveCard() {
    if (profile.phone.trim().isEmpty) return;
    final first = !onboarded;
    onboarded = true;
    _persist();
    go(first ? Screen.perm : Screen.home);
  }

  /// The permission explainer's Continue: asks for everything the exchange
  /// needs now, so nothing interrupts it later.
  Future<void> grantPermissions() async {
    if (bluetooth && Ble.supported) {
      final ble = await Ble.permissions();
      final contacts = await Device.requestContacts();
      if (ble == Access.blocked) {
        _blocked('Nearby devices');
      } else if (contacts == Access.blocked) {
        _blocked('Contacts');
      }
    }
    contactsAsked = true;
    _persist();
    go(Screen.home);
  }

  /// Whether Contacts access has been asked for (people who set up before
  /// it was part of the permission screen are asked once on launch).
  bool contactsAsked = false;

  Future<void> ensureContactsAccess() async {
    if (contactsAsked || !onboarded || !bluetooth || !Ble.supported) return;
    contactsAsked = true;
    _persist();
    if (!await Device.hasContactsAccess()) await Device.requestContacts();
  }

  void markNumberOffered() {
    numberOffered = true;
    _persist();
  }

  /// Fills the card from details read off the device (non-empty values only).
  void fillFrom(Map<String, String> data) {
    for (final k in _fields) {
      final v = data[k]?.trim() ?? '';
      if (v.isNotEmpty) profile[k] = v;
    }
    notifyListeners();
  }

  void toggleOnce(String k) {
    once = {...once, k: !(once[k] ?? false)};
    notifyListeners();
  }

  void toggleAutoSave() {
    autoSave = !autoSave;
    notifyListeners();
    _persist();
  }

  void toggleSound() {
    sound = !sound;
    notifyListeners();
    _persist();
  }

  void setField(String k, String v) {
    profile[k] = v;
    notifyListeners();
  }

  @override
  void dispose() {
    _clear();
    _sub?.cancel();
    messages.close();
    if (_running) Ble.stop();
    super.dispose();
  }
}
