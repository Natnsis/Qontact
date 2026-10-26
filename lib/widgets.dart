import 'dart:math' as math;

import 'package:flutter/material.dart';

import 'theme.dart';

// Easing curves from the design's CSS.
const easePulse = Cubic(.2, .6, .3, 1);
const easePop = Cubic(.3, 1.4, .5, 1);
const easeSheet = Cubic(.2, .9, .3, 1);
const easeSpring = Cubic(.3, 1.3, .5, 1);

const designWidth = 390.0;
const designHeight = 844.0;

/// The design frame reserves this much room for the status bar and the home
/// indicator; its top/bottom controls are positioned clear of them.
const designSafeTop = 47.0;
const designSafeBottom = 34.0;

/// Lays the screen out on a 390×844-unit canvas (the design frame), scaled
/// uniformly to the device. The canvas grows along whichever axis the
/// device has extra room, so nothing is cropped or letterboxed.
///
/// Safe areas: where a system bar (notch, tall status bar, 3-button nav bar)
/// is taller than the design allows for, the canvas is inset by the
/// difference and the strip behind the bar is painted [topColor] /
/// [bottomColor], so backgrounds stay edge to edge and controls stay clear.
class DesignCanvas extends StatelessWidget {
  const DesignCanvas({super.key, required this.builder, required this.topColor, required this.bottomColor});

  final Widget Function(BuildContext context, Size size, double scale) builder;
  final Color topColor, bottomColor;

  @override
  Widget build(BuildContext context) {
    final pad = MediaQuery.paddingOf(context);
    return LayoutBuilder(
      builder: (context, c) {
        final s0 = math.min(c.maxWidth / designWidth, c.maxHeight / designHeight);
        final top = math.max(0.0, pad.top - designSafeTop * s0);
        final bottom = math.max(0.0, pad.bottom - designSafeBottom * s0);
        final h = c.maxHeight - top - bottom;
        final s = math.min(c.maxWidth / designWidth, h / designHeight);
        final size = Size(c.maxWidth / s, h / s);
        return Column(
          children: [
            Container(height: top, color: topColor),
            Expanded(
              child: FittedBox(
                fit: BoxFit.fill,
                child: SizedBox.fromSize(
                  size: size,
                  child: MediaQuery.withNoTextScaling(child: builder(context, size, s)),
                ),
              ),
            ),
            Container(height: bottom, color: bottomColor),
          ],
        );
      },
    );
  }
}

/// Tap target with a light press-down scale.
class Tap extends StatefulWidget {
  const Tap({super.key, required this.child, this.onTap, this.onLongPress});

  final Widget child;
  final VoidCallback? onTap;
  final VoidCallback? onLongPress;

  @override
  State<Tap> createState() => _TapState();
}

class _TapState extends State<Tap> {
  bool _down = false;

  void _set(bool v) {
    if (widget.onTap != null && _down != v) setState(() => _down = v);
  }

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      behavior: HitTestBehavior.opaque,
      onTap: widget.onTap,
      onLongPress: widget.onLongPress,
      onTapDown: (_) => _set(true),
      onTapUp: (_) => _set(false),
      onTapCancel: () => _set(false),
      child: AnimatedScale(
        scale: _down ? .96 : 1,
        duration: const Duration(milliseconds: 120),
        curve: Curves.easeOut,
        child: widget.child,
      ),
    );
  }
}

class CircleBtn extends StatelessWidget {
  const CircleBtn({
    super.key,
    required this.size,
    required this.color,
    required this.child,
    this.onTap,
    this.onLongPress,
  });

  final double size;
  final Color color;
  final Widget child;
  final VoidCallback? onTap;
  final VoidCallback? onLongPress;

  @override
  Widget build(BuildContext context) {
    return Tap(
      onTap: onTap,
      onLongPress: onLongPress,
      child: Container(
        width: size,
        height: size,
        decoration: BoxDecoration(color: color, shape: BoxShape.circle),
        alignment: Alignment.center,
        child: child,
      ),
    );
  }
}

class PillBtn extends StatelessWidget {
  const PillBtn({
    super.key,
    required this.label,
    required this.height,
    this.color = C.yellow,
    this.fg = C.ink,
    this.fontSize = 19,
    this.leading,
    this.trailing,
    this.border,
    this.onTap,
  });

  final String label;
  final double height, fontSize;
  final Color color, fg;
  final Widget? leading, trailing;
  final BoxBorder? border;
  final VoidCallback? onTap;

  @override
  Widget build(BuildContext context) {
    return Tap(
      onTap: onTap,
      child: Container(
        height: height,
        decoration: BoxDecoration(color: color, borderRadius: BorderRadius.circular(999), border: border),
        alignment: Alignment.center,
        child: Row(
          mainAxisSize: MainAxisSize.min,
          spacing: 10,
          children: [
            ?leading,
            Text(
              label,
              style: u(fontSize, w: w600, color: fg),
            ),
            ?trailing,
          ],
        ),
      ),
    );
  }
}

class Avatar extends StatelessWidget {
  const Avatar({
    super.key,
    required this.size,
    required this.text,
    this.color = C.yellow,
    this.fg = C.ink,
    this.fontSize = 16,
    this.shadow,
  });

  final double size, fontSize;
  final String text;
  final Color color, fg;
  final List<BoxShadow>? shadow;

  @override
  Widget build(BuildContext context) {
    return Container(
      width: size,
      height: size,
      decoration: BoxDecoration(color: color, shape: BoxShape.circle, boxShadow: shadow),
      alignment: Alignment.center,
      child: Text(
        text,
        style: u(fontSize, w: w600, color: fg),
      ),
    );
  }
}

class Toggle extends StatelessWidget {
  const Toggle({super.key, required this.on, this.onTap});

  final bool on;
  final VoidCallback? onTap;

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: onTap,
      child: AnimatedContainer(
        duration: const Duration(milliseconds: 160),
        width: 48,
        height: 28,
        padding: const EdgeInsets.all(3),
        decoration: BoxDecoration(color: on ? C.yellow : C.toggleOff, borderRadius: BorderRadius.circular(999)),
        child: AnimatedAlign(
          duration: const Duration(milliseconds: 160),
          curve: Curves.easeOut,
          alignment: on ? Alignment.centerRight : Alignment.centerLeft,
          child: AnimatedContainer(
            duration: const Duration(milliseconds: 160),
            width: 22,
            height: 22,
            decoration: BoxDecoration(color: on ? C.ink : C.white, shape: BoxShape.circle),
          ),
        ),
      ),
    );
  }
}

/// A run of overlapping circular code digits (the 4-digit match code).
class CodeDigits extends StatelessWidget {
  const CodeDigits({
    super.key,
    required this.code,
    required this.size,
    required this.fontSize,
    required this.ring,
    required this.firstBg,
    required this.firstFg,
    required this.restBg,
    required this.restFg,
  });

  final String code;
  final double size, fontSize;
  final Color ring, firstBg, firstFg, restBg, restFg;

  @override
  Widget build(BuildContext context) {
    const overlap = 8.0;
    final n = code.length;
    return SizedBox(
      width: n * size - (n - 1) * overlap,
      height: size,
      child: Stack(
        clipBehavior: Clip.none,
        children: [
          for (var i = 0; i < n; i++)
            Positioned(
              left: i * (size - overlap),
              top: 0,
              child: Avatar(
                size: size,
                text: code[i],
                fontSize: fontSize,
                color: i == 0 ? firstBg : restBg,
                fg: i == 0 ? firstFg : restFg,
                shadow: [BoxShadow(color: ring, spreadRadius: 4)],
              ),
            ),
        ],
      ),
    );
  }
}

/// Runs [builder] with a 0→1 progress value once, after [delay].
class Entry extends StatefulWidget {
  const Entry({
    super.key,
    required this.duration,
    required this.builder,
    this.delay = Duration.zero,
    this.curve = Curves.linear,
    this.child,
  });

  final Duration duration, delay;
  final Curve curve;
  final Widget? child;
  final Widget Function(BuildContext context, double t, Widget? child) builder;

  @override
  State<Entry> createState() => _EntryState();
}

class _EntryState extends State<Entry> with SingleTickerProviderStateMixin {
  late final _c = AnimationController(vsync: this, duration: widget.duration);

  @override
  void initState() {
    super.initState();
    Future.delayed(widget.delay, () {
      if (mounted) _c.forward();
    });
  }

  @override
  void dispose() {
    _c.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return AnimatedBuilder(
      animation: _c,
      child: widget.child,
      builder: (context, child) => widget.builder(context, widget.curve.transform(_c.value), child),
    );
  }
}

/// Repeats [builder] with a 0→1 progress value forever. Before [delay]
/// elapses it renders at t = -1 so callers can hide it.
class Loop extends StatefulWidget {
  const Loop({super.key, required this.duration, required this.builder, this.delay = Duration.zero});

  final Duration duration, delay;
  final Widget Function(BuildContext context, double t) builder;

  @override
  State<Loop> createState() => _LoopState();
}

class _LoopState extends State<Loop> with SingleTickerProviderStateMixin {
  late final _c = AnimationController(vsync: this, duration: widget.duration);
  bool _started = false;

  @override
  void initState() {
    super.initState();
    Future.delayed(widget.delay, () {
      if (!mounted) return;
      setState(() => _started = true);
      _c.repeat();
    });
  }

  @override
  void dispose() {
    _c.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return AnimatedBuilder(animation: _c, builder: (context, _) => widget.builder(context, _started ? _c.value : -1));
  }
}

/// Fades its child in (the design's `ts-fade`).
class FadeIn extends StatelessWidget {
  const FadeIn({super.key, required this.ms, required this.child});

  final int ms;
  final Widget child;

  @override
  Widget build(BuildContext context) => Entry(
    duration: Duration(milliseconds: ms),
    child: child,
    builder: (_, t, c) => Opacity(opacity: t, child: c),
  );
}

/// Rises and settles into place (the design's `ts-settle`).
class SettleIn extends StatelessWidget {
  const SettleIn({super.key, this.delayMs = 0, required this.child});

  final int delayMs;
  final Widget child;

  @override
  Widget build(BuildContext context) => Entry(
    duration: const Duration(milliseconds: 700),
    delay: Duration(milliseconds: delayMs),
    curve: easeSpring,
    child: child,
    builder: (_, t, c) => Opacity(
      opacity: t.clamp(0, 1),
      child: Transform.translate(
        offset: Offset(0, 24 * (1 - t)),
        child: Transform.scale(scale: .96 + .04 * t, child: c),
      ),
    ),
  );
}

/// An expanding ring that fades out around an avatar (the design's `ts-ring`).
class PulseRing extends StatelessWidget {
  const PulseRing({super.key, required this.ms});

  final int ms;

  @override
  Widget build(BuildContext context) => Loop(
    duration: Duration(milliseconds: ms),
    builder: (_, t) {
      final p = Curves.easeOut.transform(t.clamp(0, 1));
      return Opacity(
        opacity: .6 * (1 - p),
        child: Transform.scale(
          scale: 1 + .5 * p,
          child: Container(
            decoration: BoxDecoration(
              shape: BoxShape.circle,
              border: Border.all(color: C.yellow, width: 2),
            ),
          ),
        ),
      );
    },
  );
}

/// Three blinking dots (the design's `ts-dot`).
class WaitingDots extends StatelessWidget {
  const WaitingDots({super.key});

  @override
  Widget build(BuildContext context) => Loop(
    duration: const Duration(milliseconds: 1200),
    builder: (_, t) => Row(
      mainAxisSize: MainAxisSize.min,
      spacing: 4,
      children: [
        for (var i = 0; i < 3; i++)
          Builder(
            builder: (_) {
              final p = ((t.clamp(0, 1) - i * .2 / 1.2) % 1 + 1) % 1;
              final o = .25 + .75 * (1 - (p * 2 - 1).abs());
              return Container(
                width: 6,
                height: 6,
                decoration: BoxDecoration(
                  color: C.yellow.withValues(alpha: o),
                  shape: BoxShape.circle,
                ),
              );
            },
          ),
      ],
    ),
  );
}

/// A hairline divider row container: rows after the first get a top border.
BoxDecoration rowBorder(int i) => BoxDecoration(
  border: i == 0 ? null : const Border(top: BorderSide(color: C.divider)),
);
