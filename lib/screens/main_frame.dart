import 'dart:math' as math;

import 'package:flutter/material.dart';
import 'package:phosphor_icons/phosphor_icons.dart';

import '../controller.dart';
import '../data.dart';
import '../theme.dart';
import '../widgets.dart';

/// Home, searching, incoming request, timeout and Bluetooth-off states. They
/// share one frame: a light panel on top and the dark control area below.
class MainFrame extends StatelessWidget {
  const MainFrame({super.key, required this.c, required this.size, required this.motion});

  final AppController c;
  final Size size;
  final bool motion;

  @override
  Widget build(BuildContext context) {
    final scr = c.screen;
    final searchish = c.searchish;
    final cardView = scr == Screen.home || scr == Screen.btoff;
    final circleBtn = scr == Screen.home || searchish;
    final pillBtns = scr == Screen.timeout || scr == Screen.btoff;
    final found = searchish ? c.radar.length : 0;

    var title1 = 'Tap to', title2 = 'Connect', subline = 'Ask them to tap Connect too';
    if (searchish) {
      title1 = 'Looking';
      title2 = 'nearby';
      subline = found > 0 ? '$found ${found == 1 ? 'person' : 'people'} found · tap one' : 'Bring phones closer';
    }
    if (scr == Screen.timeout) {
      title1 = 'No one';
      title2 = 'found yet';
      subline = 'Both apps need to be open and searching';
    }
    if (scr == Screen.btoff) {
      title1 = 'Bluetooth';
      title2 = 'is off';
      subline = 'Turn it on to find the phone next to you';
    }

    return ColoredBox(
      color: C.dark,
      child: Stack(
        clipBehavior: Clip.hardEdge,
        children: [
          // Light top panel.
          Positioned(
            left: 0,
            right: 0,
            top: 0,
            height: 500,
            child: ClipRRect(
              borderRadius: const BorderRadius.vertical(bottom: Radius.circular(46)),
              child: ColoredBox(
                color: C.light,
                child: Stack(
                  children: [
                    if (cardView)
                      Positioned(
                        top: 136,
                        left: 20,
                        right: 20,
                        child: Opacity(
                          opacity: scr == Screen.btoff ? .45 : 1,
                          child: _CardView(c: c),
                        ),
                      ),
                    if (searchish)
                      Positioned.fill(
                        child: _Radar(c: c, found: found, motion: motion),
                      ),
                    if (scr == Screen.timeout)
                      const Positioned(top: 140, left: 20, right: 20, child: FadeIn(ms: 400, child: _Tips())),
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
                            onTap: () => c.go(Screen.settings),
                            child: const Icon(PhosphorIconsRegular.funnelSimple, size: 22, color: C.ink),
                          ),
                          if (searchish)
                            Container(
                              height: 40,
                              padding: const EdgeInsets.symmetric(horizontal: 16),
                              decoration: BoxDecoration(color: C.white, borderRadius: BorderRadius.circular(999)),
                              child: Row(
                                spacing: 8,
                                children: [
                                  const _Dot(size: 8, ring: 2),
                                  Text('Visible to nearby phones', style: u(14, w: w600)),
                                ],
                              ),
                            ),
                          CircleBtn(
                            size: 52,
                            color: C.dark,
                            onTap: () => c.go(Screen.qr),
                            child: const Icon(PhosphorIconsRegular.qrCode, size: 22, color: C.yellow),
                          ),
                        ],
                      ),
                    ),
                  ],
                ),
              ),
            ),
          ),

          // Bluetooth switch, half off the right edge.
          Positioned(
            top: 548,
            right: -46,
            child: Tap(
              onTap: c.toggleBluetooth,
              child: AnimatedContainer(
                duration: const Duration(milliseconds: 200),
                width: 126,
                height: 72,
                padding: const EdgeInsets.all(4),
                decoration: BoxDecoration(
                  color: C.dark,
                  borderRadius: BorderRadius.circular(40),
                  border: Border.all(color: c.btOn ? C.yellow : C.grey5A, width: 9),
                ),
                alignment: Alignment.centerLeft,
                child: Container(
                  width: 46,
                  height: 46,
                  decoration: const BoxDecoration(color: C.light, shape: BoxShape.circle),
                  child: const Icon(PhosphorIconsBold.bluetooth, size: 18, color: C.ink),
                ),
              ),
            ),
          ),

          // Headline.
          Positioned(
            top: 530,
            left: 28,
            right: 96,
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              spacing: 12,
              children: [
                DefaultTextStyle(
                  style: display(44, color: C.white),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Row(
                        spacing: 10,
                        children: [
                          Container(
                            width: 58,
                            height: 40,
                            decoration: BoxDecoration(color: C.dark2, borderRadius: BorderRadius.circular(999)),
                            child: const Icon(PhosphorIconsBold.link, size: 19, color: C.yellow),
                          ),
                          Flexible(child: Text(title1, softWrap: false, overflow: TextOverflow.visible)),
                        ],
                      ),
                      Text(title2),
                    ],
                  ),
                ),
                Text(subline, style: u(15, color: C.muted3, height: 1.35)),
              ],
            ),
          ),

          if (circleBtn)
            Positioned(
              left: 0,
              right: 0,
              bottom: 36,
              child: Center(
                child: _CountdownButton(
                  frac: searchish ? c.t / 15 : .75,
                  searching: searchish,
                  seconds: c.t,
                  onTap: () => scr == Screen.home ? c.startSearch() : c.go(Screen.home),
                ),
              ),
            ),

          if (pillBtns)
            Positioned(
              left: 28,
              right: 28,
              bottom: 48,
              child: Row(
                spacing: 10,
                children: [
                  CircleBtn(
                    size: 68,
                    color: C.dark2,
                    onTap: () => c.go(Screen.qr),
                    child: const Icon(PhosphorIconsRegular.qrCode, size: 24, color: C.white),
                  ),
                  Expanded(
                    child: PillBtn(
                      label: scr == Screen.btoff ? 'Turn on Bluetooth' : 'Try again',
                      height: 68,
                      onTap: () => scr == Screen.btoff ? c.turnOnBluetooth() : c.startSearch(),
                    ),
                  ),
                ],
              ),
            ),

          if (scr == Screen.incoming) ...[
            Positioned.fill(
              child: FadeIn(ms: 250, child: ColoredBox(color: const Color(0xFF141414).withValues(alpha: .45))),
            ),
            Positioned(
              left: 8,
              right: 8,
              bottom: 8,
              child: _IncomingSheet(c: c, motion: motion),
            ),
          ],
        ],
      ),
    );
  }
}

class _Dot extends StatelessWidget {
  const _Dot({required this.size, required this.ring});

  final double size, ring;

  @override
  Widget build(BuildContext context) => Container(
    width: size,
    height: size,
    decoration: BoxDecoration(
      color: C.yellow,
      shape: BoxShape.circle,
      boxShadow: [BoxShadow(color: C.ink, spreadRadius: ring)],
    ),
  );
}

class _CardView extends StatelessWidget {
  const _CardView({required this.c});

  final AppController c;

  @override
  Widget build(BuildContext context) {
    final p = c.profile;
    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      spacing: 12,
      children: [
        Padding(
          padding: const EdgeInsets.symmetric(horizontal: 6),
          child: Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            crossAxisAlignment: CrossAxisAlignment.baseline,
            textBaseline: TextBaseline.alphabetic,
            children: [
              Text(
                'Your card',
                style: u(15, w: w500, color: C.muted),
              ),
              GestureDetector(
                onTap: () => c.go(Screen.settings),
                child: Text(
                  'Edit card',
                  style: u(15, w: w600, decoration: TextDecoration.underline).copyWith(decorationThickness: 1.4),
                ),
              ),
            ],
          ),
        ),
        Container(
          padding: const EdgeInsets.all(22),
          decoration: BoxDecoration(color: C.white, borderRadius: BorderRadius.circular(32)),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            spacing: 18,
            children: [
              Row(
                spacing: 14,
                children: [
                  Avatar(size: 60, text: p.initials, fontSize: 21),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      spacing: 2,
                      children: [
                        Text(
                          p.name,
                          style: u(24, w: w600, ls: -.01),
                          overflow: TextOverflow.ellipsis,
                        ),
                        if (p.title.isNotEmpty || p.company.isNotEmpty)
                          Text(
                            [p.title, p.company].where((s) => s.isNotEmpty).join(' · '),
                            style: u(15, color: C.muted),
                            overflow: TextOverflow.ellipsis,
                          ),
                      ],
                    ),
                  ),
                ],
              ),
              Container(height: 1, color: C.divider),
              Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                spacing: 4,
                children: [
                  Text(p.phone, style: u(19, w: w600, ls: .01)),
                  if (p.email.isNotEmpty) Text(p.email, style: u(15, color: C.muted)),
                ],
              ),
              Wrap(
                spacing: 6,
                runSpacing: 6,
                children: [
                  for (final chip in c.sharedChips)
                    Container(
                      padding: const EdgeInsets.symmetric(horizontal: 11, vertical: 6),
                      decoration: BoxDecoration(color: C.chip, borderRadius: BorderRadius.circular(999)),
                      child: Text(
                        chip,
                        style: u(12, w: w600, color: C.text3A),
                      ),
                    ),
                ],
              ),
            ],
          ),
        ),
        Padding(
          padding: const EdgeInsets.only(top: 6),
          child: Row(
            mainAxisAlignment: MainAxisAlignment.center,
            spacing: 6,
            children: [
              const Icon(PhosphorIconsBold.lock, size: 14, color: C.muted2),
              Text('Stays on your phone until you both accept', style: u(13, color: C.muted2)),
            ],
          ),
        ),
      ],
    );
  }
}

class _Radar extends StatelessWidget {
  const _Radar({required this.c, required this.found, required this.motion});

  final AppController c;
  final int found;
  final bool motion;

  static const tones = [(C.yellow, C.ink), (C.white, C.ink), (C.dark, C.white), (C.greyD4, C.ink), (C.white, C.ink)];

  @override
  Widget build(BuildContext context) {
    return LayoutBuilder(
      builder: (context, box) {
        final cx = box.maxWidth / 2;
        const cy = 300.0;

        Widget centered(double d, Widget child) =>
            Positioned(left: cx - d / 2, top: cy - d / 2, width: d, height: d, child: child);

        return Stack(
          clipBehavior: Clip.none,
          children: [
            for (final r in const [120.0, 220.0, 320.0, 420.0])
              centered(
                r,
                DecoratedBox(
                  decoration: BoxDecoration(
                    shape: BoxShape.circle,
                    border: Border.all(color: C.ink.withValues(alpha: .09)),
                  ),
                ),
              ),
            if (motion) ...[
              centered(360, const _Pulse(gradient: true)),
              centered(360, const _Pulse(gradient: false, delay: Duration(milliseconds: 1200))),
            ],
            centered(
              56,
              Avatar(
                size: 56,
                text: c.profile.initials,
                color: C.dark,
                fg: C.yellow,
                fontSize: 17,
                shadow: const [BoxShadow(color: C.light, spreadRadius: 6)],
              ),
            ),
            for (final (i, p) in c.radar.indexed) _peer(cx, cy, i, p),
            Positioned(
              left: 0,
              right: 0,
              bottom: 26,
              child: Text(
                found > 0 ? 'Tap the person you want to swap with' : 'Ask them to tap Connect too',
                textAlign: TextAlign.center,
                style: u(14, w: w500, color: C.muted),
              ),
            ),
          ],
        );
      },
    );
  }

  Widget _peer(double cx, double cy, int i, Peer p) {
    final r = 95 + (1 - p.sig) * 115;
    final a = p.ang * math.pi / 180;
    final size = (50 + p.sig * 30).roundToDouble();
    final x = (cx + r * math.cos(a)).roundToDouble();
    final y = (cy + r * math.sin(a) - size / 2).roundToDouble();
    final (bg, fg) = tones[i];
    final closest = i == 0;

    // Peers glide as their signal changes.
    return AnimatedPositioned(
      key: ValueKey(p.id),
      duration: const Duration(milliseconds: 450),
      curve: Curves.easeOutCubic,
      left: x - 100,
      top: y,
      width: 200,
      child: Entry(
        duration: const Duration(milliseconds: 500),
        builder: (context, t, child) {
          // ts-pop: 0% → scale .3, 70% → 1.08 (opaque), 100% → 1.
          final double scale, opacity;
          if (t < .7) {
            final k = easePop.transform((t / .7).clamp(0, 1));
            scale = .3 + .78 * k;
            opacity = k.clamp(0, 1);
          } else {
            scale = 1.08 - .08 * easePop.transform(((t - .7) / .3).clamp(0, 1));
            opacity = 1;
          }
          return Opacity(
            opacity: opacity,
            child: Transform.scale(scale: scale, child: child),
          );
        },
        child: GestureDetector(
          onTap: () => c.pick(p),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            spacing: 6,
            children: [
              Avatar(
                size: size,
                text: p.ini,
                color: bg,
                fg: fg,
                fontSize: (size * .32).roundToDouble(),
                shadow: closest
                    ? [
                        BoxShadow(color: C.yellow.withValues(alpha: .35), spreadRadius: 5),
                        BoxShadow(
                          color: Colors.black.withValues(alpha: .12),
                          offset: const Offset(0, 10),
                          blurRadius: 24,
                        ),
                      ]
                    : [
                        BoxShadow(
                          color: Colors.black.withValues(alpha: .08),
                          offset: const Offset(0, 8),
                          blurRadius: 20,
                        ),
                      ],
              ),
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 9, vertical: 3),
                decoration: BoxDecoration(
                  color: closest ? C.white : Colors.transparent,
                  borderRadius: BorderRadius.circular(999),
                ),
                child: Text(closest ? '${p.first} · closest' : p.first, style: u(13, w: w600)),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

/// Expanding sonar wave behind the user's avatar (the design's `ts-pulse`).
class _Pulse extends StatelessWidget {
  const _Pulse({required this.gradient, this.delay = Duration.zero});

  final bool gradient;
  final Duration delay;

  @override
  Widget build(BuildContext context) => Loop(
    duration: const Duration(milliseconds: 2400),
    delay: delay,
    builder: (_, t) {
      final p = t < 0 ? 1.0 : easePulse.transform(t);
      return Opacity(
        opacity: t < 0 ? 0 : (.9 * (1 - p)).clamp(0, 1),
        child: Transform.scale(
          scale: .25 + .75 * p,
          child: DecoratedBox(
            decoration: BoxDecoration(
              shape: BoxShape.circle,
              border: Border.all(color: C.ink.withValues(alpha: .18), width: 1.5),
              gradient: gradient
                  ? RadialGradient(
                      // CSS `circle` sizes to the farthest corner: √2 × half-width.
                      radius: .7071,
                      colors: [
                        C.yellow.withValues(alpha: 0),
                        C.yellow.withValues(alpha: .55),
                        C.yellow.withValues(alpha: 0),
                      ],
                      stops: const [.4, .7, .71],
                    )
                  : null,
            ),
          ),
        ),
      );
    },
  );
}

class _Tips extends StatelessWidget {
  const _Tips();

  @override
  Widget build(BuildContext context) {
    const tips = [
      ('1', 'Both tap Connect', 'At the same time, app open', C.yellow),
      ('2', 'Hold phones close', 'Within an arm’s length', C.chip),
      ('3', 'Bluetooth on', 'On both phones', C.chip),
    ];
    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      spacing: 10,
      children: [
        Padding(
          padding: const EdgeInsets.fromLTRB(6, 0, 6, 4),
          child: Text(
            'Try this',
            style: u(15, w: w500, color: C.muted),
          ),
        ),
        for (final (n, title, sub, bg) in tips)
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 18, vertical: 16),
            decoration: BoxDecoration(color: C.white, borderRadius: BorderRadius.circular(26)),
            child: Row(
              spacing: 14,
              children: [
                Avatar(size: 40, text: n, color: bg, fontSize: 15),
                Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  spacing: 2,
                  children: [
                    Text(title, style: u(17, w: w600)),
                    Text(sub, style: u(14, color: C.muted)),
                  ],
                ),
              ],
            ),
          ),
      ],
    );
  }
}

class _CountdownButton extends StatelessWidget {
  const _CountdownButton({required this.frac, required this.searching, required this.seconds, required this.onTap});

  final double frac;
  final bool searching;
  final int seconds;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    return Tap(
      onTap: onTap,
      child: Container(
        width: 120,
        height: 120,
        decoration: const BoxDecoration(color: C.dark, shape: BoxShape.circle),
        child: Stack(
          alignment: Alignment.center,
          children: [
            TweenAnimationBuilder<double>(
              tween: Tween(end: frac),
              duration: const Duration(seconds: 1),
              builder: (_, v, _) => CustomPaint(size: const Size.square(120), painter: _RingPainter(v)),
            ),
            if (searching)
              Column(
                mainAxisSize: MainAxisSize.min,
                spacing: 4,
                children: [
                  const Icon(PhosphorIconsRegular.x, size: 24, color: C.white),
                  Text('${seconds}s', style: mono(12, color: C.muted3)),
                ],
              )
            else
              const Icon(PhosphorIconsRegular.arrowRight, size: 28, color: C.white),
          ],
        ),
      ),
    );
  }
}

class _RingPainter extends CustomPainter {
  _RingPainter(this.frac);

  final double frac;

  @override
  void paint(Canvas canvas, Size size) {
    final rect = Rect.fromCircle(center: size.center(Offset.zero), radius: 56);
    canvas.drawCircle(
      rect.center,
      56,
      Paint()
        ..style = PaintingStyle.stroke
        ..strokeWidth = 3
        ..color = C.dark2,
    );
    if (frac <= 0) return;
    canvas.drawArc(
      rect,
      -math.pi / 2,
      2 * math.pi * frac.clamp(0, 1),
      false,
      Paint()
        ..style = PaintingStyle.stroke
        ..strokeWidth = 3.5
        ..strokeCap = StrokeCap.round
        ..color = C.yellow,
    );
  }

  @override
  bool shouldRepaint(_RingPainter old) => old.frac != frac;
}

class _IncomingSheet extends StatelessWidget {
  const _IncomingSheet({required this.c, required this.motion});

  final AppController c;
  final bool motion;

  @override
  Widget build(BuildContext context) {
    final peer = c.peer;
    return Entry(
      duration: const Duration(milliseconds: 420),
      curve: easeSheet,
      builder: (_, t, child) => FractionalTranslation(translation: Offset(0, 1 - t), child: child),
      child: Container(
        padding: const EdgeInsets.fromLTRB(22, 14, 22, 24),
        decoration: BoxDecoration(color: C.sheet, borderRadius: BorderRadius.circular(44)),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          spacing: 18,
          children: [
            Container(
              width: 40,
              height: 5,
              decoration: BoxDecoration(color: C.handle, borderRadius: BorderRadius.circular(3)),
            ),
            SizedBox.square(
              dimension: 88,
              child: Stack(
                fit: StackFit.expand,
                children: [
                  if (motion) const PulseRing(ms: 1400),
                  Avatar(size: 88, text: peer.ini, fontSize: 30),
                ],
              ),
            ),
            Column(
              spacing: 4,
              children: [
                Text(
                  '${peer.first} wants to\nshare contacts',
                  textAlign: TextAlign.center,
                  style: u(26, w: w600, height: 1.1, ls: -.015),
                ),
                Text('Check this code matches their screen', style: u(14, color: C.muted)),
              ],
            ),
            CodeDigits(
              code: peer.code,
              size: 66,
              fontSize: 30,
              ring: C.sheet,
              firstBg: C.dark,
              firstFg: C.yellow,
              restBg: C.white,
              restFg: C.ink,
            ),
            Text('You\'ll send back: ${c.sharedChips.join(', ')} · expires in 20s', style: u(13, color: C.muted)),
            Row(
              spacing: 10,
              children: [
                Expanded(
                  flex: 10,
                  child: PillBtn(label: 'Decline', height: 64, color: C.white, fontSize: 18, onTap: c.declineIncoming),
                ),
                Expanded(
                  flex: 14,
                  child: PillBtn(label: 'Accept', height: 64, fontSize: 18, onTap: c.acceptIncoming),
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }
}
