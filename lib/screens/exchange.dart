import 'package:flutter/material.dart';
import 'package:phosphor_icons/phosphor_icons.dart';
import 'package:qr/qr.dart';

import '../controller.dart';
import '../data.dart';
import '../theme.dart';
import '../widgets.dart';

/// Dark top bar: back button, two-line title pill, and a right slot.
class DarkTopBar extends StatelessWidget {
  const DarkTopBar({super.key, required this.onBack, required this.title, required this.subtitle, this.trailing});

  final VoidCallback onBack;
  final String title;
  final Widget subtitle;
  final Widget? trailing;

  @override
  Widget build(BuildContext context) {
    return Row(
      spacing: 8,
      children: [
        CircleBtn(
          size: 52,
          color: C.dark2,
          onTap: onBack,
          child: const Icon(PhosphorIconsRegular.caretLeft, size: 20, color: C.white),
        ),
        Expanded(
          child: Container(
            height: 52,
            decoration: BoxDecoration(color: C.dark2, borderRadius: BorderRadius.circular(999)),
            child: Column(
              mainAxisAlignment: MainAxisAlignment.center,
              spacing: 1,
              children: [
                Text(
                  title,
                  style: u(16, w: w600, color: C.white),
                ),
                subtitle,
              ],
            ),
          ),
        ),
        SizedBox(width: 52, child: trailing),
      ],
    );
  }
}

/// Sender side after picking someone: waiting for them to accept, or declined.
class FoundScreen extends StatelessWidget {
  const FoundScreen({super.key, required this.c, required this.motion});

  final AppController c;
  final bool motion;

  @override
  Widget build(BuildContext context) {
    final peer = c.peer;
    final declined = c.screen == Screen.declined;
    final chips = [
      ('phone', 'Phone · required', true, true),
      for (final e in shareLabels.entries)
        if (c.share[e.key]!) (e.key, e.value, c.effective(e.key), false),
    ];

    return FadeIn(
      ms: 300,
      child: ColoredBox(
        color: C.dark,
        child: Stack(
          children: [
            Positioned(
              top: 60,
              left: 20,
              right: 20,
              child: DarkTopBar(
                onBack: c.startSearch,
                title: peer.fullName,
                subtitle: Row(
                  mainAxisAlignment: MainAxisAlignment.center,
                  spacing: 6,
                  children: [
                    Container(
                      width: 6,
                      height: 6,
                      decoration: const BoxDecoration(color: C.yellow, shape: BoxShape.circle),
                    ),
                    Text(
                      declined ? (c.failReason ?? 'They declined') : (c.requestSent ? 'Request sent' : 'Connecting…'),
                      style: u(13, color: C.yellow),
                    ),
                  ],
                ),
                trailing: Text(
                  declined ? '' : '${c.wait}s',
                  textAlign: TextAlign.center,
                  style: mono(14, color: C.muted),
                ),
              ),
            ),
            Positioned(
              top: 150,
              left: 0,
              right: 0,
              child: Column(
                spacing: 26,
                children: [
                  SizedBox.square(
                    dimension: 128,
                    child: Stack(
                      fit: StackFit.expand,
                      children: [
                        if (motion && !declined) const PulseRing(ms: 1600),
                        Avatar(size: 128, text: peer.ini, fontSize: 42, color: declined ? C.muted : C.yellow),
                      ],
                    ),
                  ),
                  Column(
                    spacing: 12,
                    children: [
                      Text('MATCH CODE', style: mono(12, color: C.muted2, ls: .08)),
                      CodeDigits(
                        code: peer.code,
                        size: 76,
                        fontSize: 34,
                        ring: C.dark,
                        firstBg: C.white,
                        firstFg: C.ink,
                        restBg: C.dark2,
                        restFg: C.white,
                      ),
                      Text('Same four digits on ${peer.first}\'s phone?', style: u(14, color: C.muted3)),
                    ],
                  ),
                ],
              ),
            ),
            Positioned(
              top: 556,
              left: 24,
              right: 24,
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                spacing: 12,
                children: [
                  Text('You\'re sharing · tap to remove for this exchange', style: u(14, color: C.muted3)),
                  Wrap(
                    spacing: 8,
                    runSpacing: 8,
                    children: [
                      for (final (k, label, on, locked) in chips)
                        GestureDetector(
                          onTap: locked ? null : () => c.toggleOnce(k),
                          child: AnimatedContainer(
                            duration: const Duration(milliseconds: 150),
                            height: 42,
                            padding: const EdgeInsets.symmetric(horizontal: 16),
                            decoration: BoxDecoration(
                              color: on ? C.white : Colors.transparent,
                              borderRadius: BorderRadius.circular(999),
                              border: Border.all(color: on ? C.white : C.grey4A, width: 1.5),
                            ),
                            child: Row(
                              mainAxisSize: MainAxisSize.min,
                              children: [
                                Text(
                                  label,
                                  style: u(
                                    14,
                                    w: w600,
                                    color: on ? C.ink : C.muted,
                                    decoration: on ? TextDecoration.none : TextDecoration.lineThrough,
                                  ),
                                ),
                              ],
                            ),
                          ),
                        ),
                    ],
                  ),
                ],
              ),
            ),
            Positioned(
              left: 24,
              right: 24,
              bottom: 44,
              child: Row(
                spacing: 10,
                children: [
                  CircleBtn(
                    size: 68,
                    color: C.dark2,
                    onTap: () => c.go(Screen.home),
                    child: const Icon(PhosphorIconsRegular.x, size: 22, color: C.white),
                  ),
                  Expanded(
                    child: declined
                        ? PillBtn(label: 'Try again', height: 68, onTap: c.startSearch)
                        : Container(
                            height: 68,
                            decoration: BoxDecoration(color: C.dark2, borderRadius: BorderRadius.circular(999)),
                            child: Row(
                              mainAxisAlignment: MainAxisAlignment.center,
                              spacing: 10,
                              children: [
                                Text(
                                  'Waiting for ${peer.first}',
                                  style: u(17, w: w600, color: C.white),
                                ),
                                const WaitingDots(),
                              ],
                            ),
                          ),
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }
}

/// Two cards swing in and swap while the exchange runs.
class TransferScreen extends StatelessWidget {
  const TransferScreen({super.key, required this.c});

  final AppController c;

  static const _dur = Duration(milliseconds: 750);

  @override
  Widget build(BuildContext context) {
    final peer = c.peer;
    final p = c.profile;
    final x = c.xfer;

    // (dx, dy, degrees, scale) per stage.
    final mine = [(-260.0, 0.0, -14.0, 1.0), (-46.0, 0.0, -7.0, 1.0), (-30.0, 0.0, -6.0, .94)][x];
    final theirs = [(260.0, 0.0, 14.0, 1.0), (46.0, 0.0, 7.0, 1.0), (30.0, 10.0, 4.0, 1.0)][x];

    return ColoredBox(
      color: C.dark,
      child: Stack(
        children: [
          Positioned(
            top: 240,
            left: 0,
            right: 0,
            height: 280,
            child: Stack(
              alignment: Alignment.topCenter,
              children: [
                _SwingCard(
                  pose: mine,
                  duration: _dur,
                  color: C.white,
                  avatar: Avatar(size: 48, text: p.initials),
                  name: p.name,
                  phone: p.phone,
                  phoneColor: C.muted,
                ),
                _SwingCard(
                  pose: theirs,
                  duration: _dur,
                  color: C.yellow,
                  avatar: Avatar(size: 48, text: peer.ini, color: C.ink, fg: C.yellow),
                  name: peer.fullName,
                  phone: peer.phone,
                  phoneColor: C.text3A,
                ),
              ],
            ),
          ),
          Positioned(
            left: 40,
            right: 40,
            bottom: 120,
            child: Column(
              spacing: 16,
              children: [
                Text(
                  x < 2 ? 'Sending your card…' : 'Receiving ${peer.first}\'s card…',
                  style: u(22, w: w600, color: C.white),
                ),
                Container(
                  height: 6,
                  decoration: BoxDecoration(color: C.dark2, borderRadius: BorderRadius.circular(3)),
                  alignment: Alignment.centerLeft,
                  child: TweenAnimationBuilder<double>(
                    tween: Tween(end: [.06, .55, 1.0][x]),
                    duration: const Duration(milliseconds: 900),
                    curve: Curves.ease,
                    builder: (_, v, _) => FractionallySizedBox(
                      widthFactor: v,
                      child: Container(
                        decoration: BoxDecoration(color: C.yellow, borderRadius: BorderRadius.circular(3)),
                      ),
                    ),
                  ),
                ),
                Text('Keep phones close', style: u(14, color: C.muted2)),
              ],
            ),
          ),
        ],
      ),
    );
  }
}

class _SwingCard extends StatelessWidget {
  const _SwingCard({
    required this.pose,
    required this.duration,
    required this.color,
    required this.avatar,
    required this.name,
    required this.phone,
    required this.phoneColor,
  });

  final (double, double, double, double) pose;
  final Duration duration;
  final Color color, phoneColor;
  final Widget avatar;
  final String name, phone;

  @override
  Widget build(BuildContext context) {
    final (dx, dy, deg, sc) = pose;
    return TweenAnimationBuilder<List<double>>(
      tween: _ListTween(end: [dx, dy, deg, sc]),
      duration: duration,
      curve: easeSpring,
      builder: (_, v, child) => Transform(
        alignment: Alignment.center,
        transform: Matrix4.identity()
          ..translateByDouble(v[0], v[1], 0, 1)
          ..rotateZ(v[2] * 3.141592653589793 / 180)
          ..scaleByDouble(v[3], v[3], 1, 1),
        child: child,
      ),
      child: Container(
        width: 200,
        height: 260,
        padding: const EdgeInsets.all(22),
        decoration: BoxDecoration(
          color: color,
          borderRadius: BorderRadius.circular(30),
          boxShadow: [
            BoxShadow(color: Colors.black.withValues(alpha: .3), offset: const Offset(0, 20), blurRadius: 40),
          ],
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          mainAxisAlignment: MainAxisAlignment.spaceBetween,
          children: [
            avatar,
            Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              spacing: 3,
              children: [
                Text(name, style: u(20, w: w600, height: 1.1)),
                Text(phone, style: u(13, color: phoneColor)),
              ],
            ),
          ],
        ),
      ),
    );
  }
}

class _ListTween extends Tween<List<double>> {
  _ListTween({required super.end});

  @override
  List<double> lerp(double t) => [for (var i = 0; i < end!.length; i++) begin![i] + (end![i] - begin![i]) * t];
}

/// The received card, saved to contacts with a short undo window.
class SuccessScreen extends StatelessWidget {
  const SuccessScreen({super.key, required this.c});

  final AppController c;

  @override
  Widget build(BuildContext context) {
    final peer = c.peer;
    final saved = c.saved;
    final received = [
      ('Phone', peer.phone),
      ('Email', peer.email),
      ('Company', peer.company),
      ('Title', peer.title),
    ].where((f) => f.$2.isNotEmpty).toList();

    return ColoredBox(
      color: C.light,
      child: Stack(
        children: [
          Positioned(
            top: 60,
            left: 20,
            right: 20,
            child: Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                CircleBtn(
                  size: 52,
                  color: C.white,
                  onTap: () => c.go(Screen.home),
                  child: const Icon(PhosphorIconsRegular.x, size: 20, color: C.ink),
                ),
                Container(
                  width: 52,
                  height: 52,
                  decoration: const BoxDecoration(color: C.dark, shape: BoxShape.circle),
                  child: const Icon(PhosphorIconsBold.check, size: 20, color: C.yellow),
                ),
              ],
            ),
          ),
          Positioned(
            top: 130,
            left: 24,
            right: 24,
            child: SettleIn(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                spacing: 14,
                children: [
                  Text('${peer.first}\n${peer.last}', style: display(44)),
                  AnimatedContainer(
                    duration: const Duration(milliseconds: 200),
                    height: 36,
                    padding: const EdgeInsets.symmetric(horizontal: 14),
                    decoration: BoxDecoration(
                      color: saved ? C.dark : C.white,
                      borderRadius: BorderRadius.circular(999),
                    ),
                    child: Row(
                      mainAxisSize: MainAxisSize.min,
                      spacing: 8,
                      children: [
                        Container(
                          width: 7,
                          height: 7,
                          decoration: BoxDecoration(color: saved ? C.yellow : C.greyB0, shape: BoxShape.circle),
                        ),
                        Text(
                          saved ? 'Saved to contacts' : 'Not saved',
                          style: u(14, w: w600, color: saved ? C.white : C.ink),
                        ),
                      ],
                    ),
                  ),
                ],
              ),
            ),
          ),
          Positioned(
            top: 296,
            left: 16,
            right: 16,
            child: SettleIn(
              delayMs: 80,
              child: Container(
                padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 6),
                decoration: BoxDecoration(color: C.white, borderRadius: BorderRadius.circular(32)),
                child: Column(
                  children: [
                    for (final (i, (k, v)) in received.indexed)
                      Container(
                        width: double.infinity,
                        padding: const EdgeInsets.symmetric(vertical: 14),
                        decoration: rowBorder(i),
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          spacing: 2,
                          children: [
                            Text(
                              k,
                              style: u(12, w: w500, color: C.muted2),
                            ),
                            Text(v, style: u(17, w: w600)),
                          ],
                        ),
                      ),
                  ],
                ),
              ),
            ),
          ),
          Positioned(
            top: 592,
            left: 16,
            right: 16,
            child: SettleIn(
              delayMs: 160,
              child: Row(
                spacing: 8,
                children: [
                  Expanded(
                    child: _ActionTile(
                      icon: PhosphorIconsRegular.pencilSimple,
                      label: 'Fix a\ntypo',
                      color: C.white,
                      arrowBg: C.chip,
                      onTap: () => _fixTypo(context, c),
                    ),
                  ),
                  Expanded(
                    // Saved: go again (e.g. at an event). Not saved: save it, without leaving the app.
                    child: c.saved
                        ? _ActionTile(
                            icon: PhosphorIconsRegular.arrowsLeftRight,
                            label: 'Exchange\nagain',
                            color: C.yellow,
                            arrowBg: C.white,
                            onTap: c.startSearch,
                          )
                        : _ActionTile(
                            icon: PhosphorIconsRegular.user,
                            label: 'Save to\nContacts',
                            color: C.yellow,
                            arrowBg: C.white,
                            onTap: c.saveNow,
                          ),
                  ),
                ],
              ),
            ),
          ),
          Positioned(
            left: 16,
            right: 16,
            bottom: 34,
            child: Row(
              spacing: 8,
              children: [
                if (saved && c.undo > 0)
                  Expanded(
                    child: PillBtn(
                      label: 'Undo save',
                      height: 64,
                      fontSize: 17,
                      color: C.dark,
                      fg: C.white,
                      trailing: Text('${c.undo}s', style: mono(13, color: C.yellow)),
                      onTap: c.undoSave,
                    ),
                  ),
                Expanded(
                  child: PillBtn(
                    label: 'Done',
                    height: 64,
                    fontSize: 17,
                    color: C.white,
                    onTap: () => c.go(Screen.home),
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}

class _ActionTile extends StatelessWidget {
  const _ActionTile({
    required this.icon,
    required this.label,
    required this.color,
    required this.arrowBg,
    required this.onTap,
  });

  final IconData icon;
  final String label;
  final Color color, arrowBg;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    return Tap(
      onTap: onTap,
      child: Container(
        height: 124,
        padding: const EdgeInsets.all(18),
        decoration: BoxDecoration(color: color, borderRadius: BorderRadius.circular(30)),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          mainAxisAlignment: MainAxisAlignment.spaceBetween,
          children: [
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Icon(icon, size: 24, color: C.ink),
                Container(
                  width: 40,
                  height: 40,
                  decoration: BoxDecoration(color: arrowBg, shape: BoxShape.circle),
                  child: const Icon(PhosphorIconsRegular.arrowUpRight, size: 18, color: C.ink),
                ),
              ],
            ),
            Text(label, style: u(17, w: w600, height: 1.1)),
          ],
        ),
      ),
    );
  }
}

/// Fallback when Bluetooth isn't an option: show a code to scan.
class QrScreen extends StatelessWidget {
  const QrScreen({super.key, required this.c});

  final AppController c;

  @override
  Widget build(BuildContext context) {
    return FadeIn(
      ms: 300,
      child: ColoredBox(
        color: C.dark,
        child: Stack(
          children: [
            Positioned(
              top: 60,
              left: 20,
              right: 20,
              child: DarkTopBar(
                onBack: () => c.go(Screen.home),
                title: 'Share via QR',
                subtitle: Text('Works without Bluetooth', style: u(13, color: C.yellow)),
              ),
            ),
            Positioned(
              top: 156,
              left: 40,
              right: 40,
              child: Column(
                spacing: 22,
                children: [
                  Container(
                    width: 310,
                    height: 310,
                    padding: const EdgeInsets.all(30),
                    decoration: BoxDecoration(color: C.white, borderRadius: BorderRadius.circular(36)),
                    child: CustomPaint(painter: _QrPainter(c.profile.vCard)),
                  ),
                  Column(
                    spacing: 6,
                    children: [
                      Text(
                        c.profile.name,
                        style: u(24, w: w600, color: C.white),
                      ),
                      Text(
                        'Let them scan this with their camera.\nNo app needed on their side.',
                        textAlign: TextAlign.center,
                        style: u(15, color: C.muted3, height: 1.4),
                      ),
                    ],
                  ),
                ],
              ),
            ),
            Positioned(
              left: 24,
              right: 24,
              bottom: 44,
              child: PillBtn(
                label: 'Scan theirs',
                height: 68,
                leading: const Icon(PhosphorIconsRegular.scan, size: 22, color: C.ink),
                onTap: c.startSearch,
              ),
            ),
          ],
        ),
      ),
    );
  }
}

/// A real, scannable QR of the user's vCard, drawn in the design's style.
class _QrPainter extends CustomPainter {
  _QrPainter(this.data)
    : _image = QrImage(QrCode(payload: QrPayload.fromString(data), errorCorrectLevel: QrErrorCorrectLevel.low));

  final String data;
  final QrImage _image;

  @override
  void paint(Canvas canvas, Size size) {
    final n = _image.moduleCount;
    final cell = size.width / n;
    final paint = Paint()..color = C.ink;
    final radius = Radius.circular(cell * .15);
    for (var r = 0; r < n; r++) {
      for (var col = 0; col < n; col++) {
        if (!_image.isDark(r, col)) continue;
        // Slight overlap so adjacent modules read as solid to scanners.
        final rect = Rect.fromLTWH(col * cell, r * cell, cell + .3, cell + .3);
        canvas.drawRRect(RRect.fromRectAndRadius(rect, radius), paint);
      }
    }
  }

  @override
  bool shouldRepaint(_QrPainter old) => old.data != data;
}

/// "Fix a typo": edit the received card in the app; the saved contact is
/// updated silently.
Future<void> _fixTypo(BuildContext context, AppController c) {
  final p = c.peer;
  const fields = [
    ('name', 'Name'),
    ('phone', 'Phone'),
    ('email', 'Email'),
    ('company', 'Company'),
    ('title', 'Title'),
  ];
  final ctrls = {
    for (final (k, _) in fields) k: TextEditingController(text: k == 'name' ? p.fullName : (p.card[k] ?? '')),
  };
  return showModalBottomSheet<void>(
    context: context,
    isScrollControlled: true,
    backgroundColor: C.sheet,
    shape: const RoundedRectangleBorder(borderRadius: BorderRadius.vertical(top: Radius.circular(32))),
    builder: (sheet) => Padding(
      padding: EdgeInsets.only(bottom: MediaQuery.viewInsetsOf(sheet).bottom),
      child: SafeArea(
        child: Padding(
          padding: const EdgeInsets.fromLTRB(16, 14, 16, 16),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.stretch,
            spacing: 14,
            children: [
              Center(
                child: Container(
                  width: 40,
                  height: 5,
                  decoration: BoxDecoration(color: C.handle, borderRadius: BorderRadius.circular(3)),
                ),
              ),
              Padding(
                padding: const EdgeInsets.symmetric(horizontal: 8),
                child: Text('Fix a typo', style: u(24, w: w600, ls: -.015)),
              ),
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 18, vertical: 4),
                decoration: BoxDecoration(color: C.white, borderRadius: BorderRadius.circular(28)),
                child: Column(
                  children: [
                    for (final (i, (k, label)) in fields.indexed)
                      Container(
                        padding: const EdgeInsets.symmetric(vertical: 12),
                        decoration: rowBorder(i),
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          spacing: 2,
                          children: [
                            Text(label, style: u(12, w: w500, color: C.muted2)),
                            TextField(
                              controller: ctrls[k],
                              cursorColor: C.ink,
                              style: u(17, w: w600),
                              keyboardType: switch (k) {
                                'phone' => TextInputType.phone,
                                'email' => TextInputType.emailAddress,
                                _ => TextInputType.text,
                              },
                              decoration: InputDecoration.collapsed(
                                hintText: 'Empty',
                                hintStyle: u(17, w: w600, color: const Color(0xFFA9A9A9)),
                              ),
                            ),
                          ],
                        ),
                      ),
                  ],
                ),
              ),
              PillBtn(
                label: 'Save',
                height: 60,
                fontSize: 18,
                onTap: () {
                  c.fixCard({for (final e in ctrls.entries) e.key: e.value.text});
                  Navigator.pop(sheet);
                },
              ),
            ],
          ),
        ),
      ),
    ),
  ).whenComplete(() {
    for (final t in ctrls.values) {
      t.dispose();
    }
  });
}
