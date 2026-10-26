import 'package:flutter/material.dart';
import 'package:phosphor_icons/phosphor_icons.dart';

import '../controller.dart';
import '../device.dart';
import '../data.dart';
import '../theme.dart';
import '../widgets.dart';

/// Profile setup: "Make your card once".
class OnboardScreen extends StatefulWidget {
  const OnboardScreen({super.key, required this.c, required this.scale});

  final AppController c;
  final double scale;

  @override
  State<OnboardScreen> createState() => _OnboardScreenState();
}

class _OnboardScreenState extends State<OnboardScreen> {
  static const fields = [
    ('name', 'Name', 'Your full name'),
    ('phone', 'Phone', '+251 …'),
    ('email', 'Email', 'Optional'),
    ('company', 'Company', 'Optional'),
    ('title', 'Title', 'Optional'),
  ];

  late final _ctrls = {for (final (k, _, _) in fields) k: TextEditingController(text: widget.c.profile[k])};

  bool _busy = false;

  @override
  void initState() {
    super.initState();
    // First setup on Android: offer the phone's own number right away.
    final c = widget.c;
    if (Device.canReadNumber && !c.numberOffered && c.profile.phone.isEmpty) {
      c.markNumberOffered();
      Future.delayed(const Duration(milliseconds: 600), () {
        if (mounted) _useNumber(quiet: true);
      });
    }
  }

  void _syncFields() {
    for (final (k, _, _) in fields) {
      _ctrls[k]!.text = widget.c.profile[k];
    }
  }

  Future<void> _run(Future<void> Function() task) async {
    if (_busy) return;
    setState(() => _busy = true);
    FocusScope.of(context).unfocus();
    try {
      await task();
    } finally {
      if (mounted) setState(() => _busy = false);
    }
  }

  /// Reads the phone's own number; asks which one if there are several SIMs.
  Future<void> _useNumber({bool quiet = false}) => _run(() async {
    final numbers = await Device.phoneNumbers();
    if (!mounted) return;
    if (numbers.isEmpty) {
      if (!quiet) _toast('Couldn’t read a number from this phone. Type it in instead.');
      return;
    }
    final number = numbers.length == 1 ? numbers.first : await _chooseNumber(numbers);
    if (number == null) return;
    widget.c.fillFrom({'phone': number});
    _syncFields();
  });

  Future<void> _fromContacts() => _run(() async {
    final card = await Device.contactCard();
    if (!mounted) return;
    if (card == null) {
      if (!await Device.hasContactsAccess() && mounted) {
        _toast('Allow Contacts access for Linksy in Settings to fill your card.');
      }
      return;
    }
    widget.c.fillFrom(card);
    _syncFields();
  });

  Future<String?> _chooseNumber(List<String> numbers) => showModalBottomSheet<String>(
    context: context,
    backgroundColor: C.sheet,
    shape: const RoundedRectangleBorder(borderRadius: BorderRadius.vertical(top: Radius.circular(32))),
    builder: (sheet) => SafeArea(
      child: Padding(
        padding: const EdgeInsets.fromLTRB(20, 14, 20, 16),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          spacing: 10,
          children: [
            Container(
              width: 40,
              height: 5,
              decoration: BoxDecoration(color: C.handle, borderRadius: BorderRadius.circular(3)),
            ),
            Padding(
              padding: const EdgeInsets.symmetric(vertical: 6),
              child: Text('Which number is yours?', style: u(20, w: w600)),
            ),
            for (final n in numbers)
              PillBtn(label: n, height: 58, fontSize: 17, color: C.white, onTap: () => Navigator.pop(sheet, n)),
          ],
        ),
      ),
    ),
  );

  void _toast(String text) {
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Text(
          text,
          style: u(14, w: w600, color: C.white),
        ),
        backgroundColor: C.dark,
        behavior: SnackBarBehavior.floating,
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
      ),
    );
  }

  @override
  void dispose() {
    for (final t in _ctrls.values) {
      t.dispose();
    }
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final c = widget.c;
    final p = c.profile;
    final meta = [p.title, p.company].where((s) => s.isNotEmpty).join(' · ');
    final keyboard = MediaQuery.viewInsetsOf(context).bottom / widget.scale;

    return ColoredBox(
      color: C.light,
      child: Stack(
        children: [
          Positioned.fill(
            child: SingleChildScrollView(
              padding: EdgeInsets.fromLTRB(20, 64, 20, 130 + keyboard),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.stretch,
                spacing: 18,
                children: [
                  Padding(
                    padding: const EdgeInsets.symmetric(horizontal: 6),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      spacing: 10,
                      children: [
                        Text('Make your\ncard once', style: display(42)),
                        Text(
                          'Swap it with anyone nearby in one tap. Your card stays on your phone — no account, no server.',
                          style: u(15, color: C.muted, height: 1.4),
                        ),
                      ],
                    ),
                  ),
                  if (Device.canReadNumber || Device.canPickContact)
                    Row(
                      spacing: 8,
                      children: [
                        if (Device.canReadNumber)
                          Expanded(
                            child: _FillPill(
                              icon: PhosphorIconsRegular.simCard,
                              label: 'Use my number',
                              onTap: _busy ? null : _useNumber,
                            ),
                          ),
                        if (Device.canPickContact)
                          Expanded(
                            child: _FillPill(
                              icon: PhosphorIconsRegular.addressBook,
                              label: 'From contacts',
                              onTap: _busy ? null : _fromContacts,
                            ),
                          ),
                      ],
                    ),
                  Container(
                    padding: const EdgeInsets.all(20),
                    decoration: BoxDecoration(color: C.dark, borderRadius: BorderRadius.circular(30)),
                    child: Row(
                      spacing: 14,
                      children: [
                        Avatar(size: 56, text: p.initials, fontSize: 19),
                        Expanded(
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            spacing: 2,
                            children: [
                              Text(
                                p.name.isEmpty ? 'Your name' : p.name,
                                style: u(21, w: w600, color: C.white),
                                overflow: TextOverflow.ellipsis,
                              ),
                              Text(p.phone.isEmpty ? 'Phone number' : p.phone, style: u(14, color: C.muted3)),
                              Text(
                                meta.isEmpty ? ' ' : meta,
                                style: u(13, color: C.yellow),
                                overflow: TextOverflow.ellipsis,
                              ),
                            ],
                          ),
                        ),
                      ],
                    ),
                  ),
                  Container(
                    padding: const EdgeInsets.symmetric(horizontal: 18, vertical: 4),
                    decoration: BoxDecoration(color: C.white, borderRadius: BorderRadius.circular(30)),
                    child: Column(
                      children: [
                        for (final (i, (k, label, hint)) in fields.indexed)
                          Container(
                            padding: const EdgeInsets.symmetric(vertical: 12),
                            decoration: rowBorder(i),
                            child: Row(
                              spacing: 12,
                              children: [
                                Expanded(
                                  child: Column(
                                    crossAxisAlignment: CrossAxisAlignment.start,
                                    spacing: 2,
                                    children: [
                                      Text(
                                        k == 'phone' ? 'Phone · required' : label,
                                        style: u(12, w: w500, color: C.muted2),
                                      ),
                                      TextField(
                                        controller: _ctrls[k],
                                        onChanged: (v) => c.setField(k, v),
                                        keyboardType: switch (k) {
                                          'phone' => TextInputType.phone,
                                          'email' => TextInputType.emailAddress,
                                          _ => TextInputType.text,
                                        },
                                        textCapitalization: k == 'email'
                                            ? TextCapitalization.none
                                            : TextCapitalization.words,
                                        cursorColor: C.ink,
                                        style: u(17, w: w600),
                                        decoration: InputDecoration.collapsed(
                                          hintText: hint,
                                          hintStyle: u(17, w: w600, color: const Color(0xFFA9A9A9)),
                                        ),
                                      ),
                                    ],
                                  ),
                                ),
                                if (k == 'phone')
                                  Container(
                                    padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 5),
                                    decoration: BoxDecoration(color: C.chip, borderRadius: BorderRadius.circular(999)),
                                    child: Text(
                                      'Always shared',
                                      style: u(12, w: w600, color: C.muted2),
                                    ),
                                  ),
                                if (shareLabels.containsKey(k)) Toggle(on: c.share[k]!, onTap: () => c.toggleShare(k)),
                              ],
                            ),
                          ),
                      ],
                    ),
                  ),
                  Padding(
                    padding: const EdgeInsets.symmetric(horizontal: 6),
                    child: Text(
                      'Toggles set what\'s shared by default. You can change it per exchange.',
                      style: u(13, color: C.muted2),
                    ),
                  ),
                ],
              ),
            ),
          ),
          Positioned(
            left: 20,
            right: 20,
            bottom: 34,
            child: PillBtn(
              label: 'Save card',
              height: 66,
              color: p.phone.isNotEmpty ? C.yellow : C.toggleOff,
              onTap: () {
                FocusScope.of(context).unfocus();
                c.saveCard();
              },
            ),
          ),
        ],
      ),
    );
  }
}

/// Prefills the card from the phone (own number, or the user's contact card).
class _FillPill extends StatelessWidget {
  const _FillPill({required this.icon, required this.label, this.onTap});

  final IconData icon;
  final String label;
  final VoidCallback? onTap;

  @override
  Widget build(BuildContext context) {
    return Tap(
      onTap: onTap,
      child: Container(
        height: 52,
        decoration: BoxDecoration(color: C.white, borderRadius: BorderRadius.circular(999)),
        child: Row(
          mainAxisAlignment: MainAxisAlignment.center,
          spacing: 8,
          children: [
            Icon(icon, size: 20, color: C.ink),
            Text(label, style: u(15, w: w600)),
          ],
        ),
      ),
    );
  }
}

/// Explains the Bluetooth permission before the system prompt.
class PermScreen extends StatelessWidget {
  const PermScreen({super.key, required this.c});

  final AppController c;

  @override
  Widget build(BuildContext context) {
    return ColoredBox(
      color: C.dark,
      child: Stack(
        children: [
          Positioned(
            left: 0,
            right: 0,
            top: 0,
            height: 520,
            child: Container(
              decoration: const BoxDecoration(
                color: C.light,
                borderRadius: BorderRadius.vertical(bottom: Radius.circular(46)),
              ),
              child: Stack(
                children: [
                  Positioned(
                    top: 64,
                    left: 26,
                    right: 26,
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      spacing: 10,
                      children: [
                        Text('Two quick\npermissions', style: display(42)),
                        Text('Here\'s exactly what they\'re for, before your phone asks.', style: u(15, color: C.muted, height: 1.4)),
                      ],
                    ),
                  ),
                  const Positioned(
                    top: 244,
                    left: 16,
                    right: 16,
                    child: Column(
                      spacing: 8,
                      children: [
                        _PermCard(
                          icon: PhosphorIconsBold.bluetooth,
                          iconBg: C.yellow,
                          color: C.white,
                          title: 'Bluetooth',
                          sub: 'Finds Linksy phones next to you while you search. Never used for location.',
                        ),
                        _PermCard(
                          icon: PhosphorIconsRegular.user,
                          iconBg: C.yellow,
                          color: C.white,
                          title: 'Contacts',
                          sub: 'Saves the cards you receive. Your address book is never uploaded or shared.',
                        ),
                      ],
                    ),
                  ),
                ],
              ),
            ),
          ),
          Positioned(
            top: 552,
            left: 28,
            right: 28,
            child: Row(
              crossAxisAlignment: CrossAxisAlignment.start,
              spacing: 10,
              children: [
                const Padding(
                  padding: EdgeInsets.only(top: 3),
                  child: Icon(PhosphorIconsBold.lock, size: 16, color: C.muted3),
                ),
                Expanded(
                  child: Text(
                    'No account, no server, no tracking. Your card is only sent when an exchange is accepted.',
                    style: u(15, color: C.muted3, height: 1.45),
                  ),
                ),
              ],
            ),
          ),
          Positioned(
            left: 24,
            right: 24,
            bottom: 44,
            child: PillBtn(label: 'Continue', height: 68, onTap: c.grantPermissions),
          ),
        ],
      ),
    );
  }
}

class _PermCard extends StatelessWidget {
  const _PermCard({
    required this.icon,
    required this.iconBg,
    required this.color,
    required this.title,
    required this.sub,
  });

  final IconData icon;
  final Color iconBg, color;
  final String title, sub;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(18),
      decoration: BoxDecoration(color: color, borderRadius: BorderRadius.circular(28)),
      child: Row(
        spacing: 14,
        children: [
          Container(
            width: 52,
            height: 52,
            decoration: BoxDecoration(color: iconBg, shape: BoxShape.circle),
            child: Icon(icon, size: 22, color: C.ink),
          ),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              spacing: 3,
              children: [
                Text(title, style: u(18, w: w600)),
                Text(sub, style: u(14, color: C.muted, height: 1.35)),
              ],
            ),
          ),
        ],
      ),
    );
  }
}

class SettingsScreen extends StatelessWidget {
  const SettingsScreen({super.key, required this.c});

  final AppController c;

  @override
  Widget build(BuildContext context) {
    final p = c.profile;
    final shareRows = [
      ('phone', 'Phone', 'Always shared'),
      ('email', 'Email', p.email),
      ('company', 'Company', p.company),
      ('title', 'Title', p.title),
    ];

    return ColoredBox(
      color: C.light,
      child: SingleChildScrollView(
        padding: const EdgeInsets.fromLTRB(16, 60, 16, 40),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          spacing: 16,
          children: [
            Padding(
              padding: const EdgeInsets.symmetric(horizontal: 4),
              child: Align(
                alignment: Alignment.centerLeft,
                child: CircleBtn(
                  size: 52,
                  color: C.white,
                  onTap: () => c.go(Screen.home),
                  child: const Icon(PhosphorIconsRegular.caretLeft, size: 20, color: C.ink),
                ),
              ),
            ),
            Padding(
              padding: const EdgeInsets.fromLTRB(8, 0, 8, 4),
              child: Text('Settings', style: display(42)),
            ),
            Tap(
              onTap: () => c.go(Screen.onboard),
              child: Container(
                padding: const EdgeInsets.all(16),
                decoration: BoxDecoration(color: C.dark, borderRadius: BorderRadius.circular(28)),
                child: Row(
                  spacing: 14,
                  children: [
                    Avatar(size: 52, text: p.initials, fontSize: 18),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        spacing: 2,
                        children: [
                          Text(
                            'Edit card',
                            style: u(18, w: w600, color: C.white),
                          ),
                          Text(
                            '${p.name} · ${p.phone}',
                            style: u(14, color: C.muted3),
                            overflow: TextOverflow.ellipsis,
                          ),
                        ],
                      ),
                    ),
                    Container(
                      width: 40,
                      height: 40,
                      decoration: const BoxDecoration(color: C.dark2, shape: BoxShape.circle),
                      child: const Icon(PhosphorIconsRegular.arrowUpRight, size: 18, color: C.white),
                    ),
                  ],
                ),
              ),
            ),
            const _SectionLabel('Share by default'),
            _Group(
              rows: [
                for (final (k, label, sub) in shareRows)
                  (label, sub, k == 'phone' || c.share[k]!, k == 'phone' ? null : () => c.toggleShare(k)),
              ],
            ),
            const _SectionLabel('Exchange'),
            _Group(
              rows: [
                ('Auto-save to contacts', 'Off: review before saving', c.autoSave, c.toggleAutoSave),
                ('Success chime', 'Short sound when a card lands', c.sound, c.toggleSound),
              ],
            ),
            PillBtn(
              label: 'Clear exchange history',
              height: 58,
              fontSize: 16,
              color: Colors.transparent,
              border: Border.all(color: C.outline, width: 1.5),
              onTap: () {},
            ),
            Padding(
              padding: const EdgeInsets.symmetric(horizontal: 20),
              child: Text(
                'History is stored only on this phone. Linksy has no server and no account.',
                textAlign: TextAlign.center,
                style: u(13, color: C.muted2, height: 1.45),
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class _SectionLabel extends StatelessWidget {
  const _SectionLabel(this.text);

  final String text;

  @override
  Widget build(BuildContext context) => Padding(
    padding: const EdgeInsets.fromLTRB(8, 6, 8, 0),
    child: Text(
      text,
      style: u(14, w: w500, color: C.muted),
    ),
  );
}

class _Group extends StatelessWidget {
  const _Group({required this.rows});

  final List<(String, String, bool, VoidCallback?)> rows;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 18, vertical: 2),
      decoration: BoxDecoration(color: C.white, borderRadius: BorderRadius.circular(28)),
      child: Column(
        children: [
          for (final (i, (label, sub, on, toggle)) in rows.indexed)
            Container(
              padding: const EdgeInsets.symmetric(vertical: 15),
              decoration: rowBorder(i),
              child: Row(
                children: [
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      spacing: 2,
                      children: [
                        Text(label, style: u(17, w: w600)),
                        Text(
                          sub,
                          style: u(13, color: C.muted2),
                          overflow: TextOverflow.ellipsis,
                        ),
                      ],
                    ),
                  ),
                  Toggle(on: on, onTap: toggle),
                ],
              ),
            ),
        ],
      ),
    );
  }
}
