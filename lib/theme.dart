import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';

/// Color tokens from the Linksy design.
abstract final class C {
  static const ink = Color(0xFF1E1E1E);
  static const dark = Color(0xFF2A2A2A);
  static const dark2 = Color(0xFF3B3B3B);
  static const light = Color(0xFFE9E9E7);
  static const yellow = Color(0xFFF2EE00);
  static const white = Color(0xFFFFFFFF);
  static const muted = Color(0xFF7A7A77);
  static const muted2 = Color(0xFF8A8A86);
  static const muted3 = Color(0xFF9A9A96);
  static const divider = Color(0xFFEDEDEB);
  static const chip = Color(0xFFF0F0EE);
  static const toggleOff = Color(0xFFDADAD7);
  static const sheet = Color(0xFFF1F1EF);
  static const handle = Color(0xFFD2D2CF);
  static const text3A = Color(0xFF3A3A3A);
  static const grey4A = Color(0xFF4A4A4A);
  static const grey5A = Color(0xFF5A5A57);
  static const greyD4 = Color(0xFFD4D4D1);
  static const greyB0 = Color(0xFFB0B0AC);
  static const outline = Color(0xFFCFCFCC);
}

/// Urbanist text. [ls] is letter-spacing in em, like the CSS source.
TextStyle u(
  double size, {
  FontWeight w = FontWeight.w400,
  Color color = C.ink,
  double? height,
  double ls = 0,
  TextDecoration? decoration,
}) => GoogleFonts.urbanist(
  fontSize: size,
  fontWeight: w,
  color: color,
  height: height,
  letterSpacing: ls * size,
  decoration: decoration,
  decorationColor: color,
);

/// JetBrains Mono, used for counters and eyebrow labels.
TextStyle mono(double size, {Color color = C.ink, double ls = 0}) =>
    GoogleFonts.jetBrainsMono(fontSize: size, fontWeight: FontWeight.w500, color: color, letterSpacing: ls * size);

/// The large 42–44px display headline used across screens.
TextStyle display(double size, {Color color = C.ink}) =>
    u(size, w: FontWeight.w500, color: color, height: 1.02, ls: -.025);

const w500 = FontWeight.w500;
const w600 = FontWeight.w600;
const w700 = FontWeight.w700;
