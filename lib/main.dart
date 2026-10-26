import 'dart:async';

import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:google_fonts/google_fonts.dart';

import 'controller.dart';
import 'screens/exchange.dart';
import 'screens/main_frame.dart';
import 'screens/setup.dart';
import 'theme.dart';
import 'widgets.dart';

Future<void> main() async {
  WidgetsFlutterBinding.ensureInitialized();
  SystemChrome.setEnabledSystemUIMode(SystemUiMode.edgeToEdge);
  final c = AppController();
  await c.load();
  runApp(LinksyApp(c: c));
}

class LinksyApp extends StatelessWidget {
  const LinksyApp({super.key, required this.c});

  final AppController c;

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'Linksy',
      debugShowCheckedModeBanner: false,
      theme: ThemeData(
        scaffoldBackgroundColor: C.dark,
        fontFamily: GoogleFonts.urbanist().fontFamily,
        textSelectionTheme: TextSelectionThemeData(
          cursorColor: C.ink,
          selectionColor: C.yellow.withValues(alpha: .6),
          selectionHandleColor: C.ink,
        ),
      ),
      home: LinksyHome(c: c),
    );
  }
}

class LinksyHome extends StatefulWidget {
  const LinksyHome({super.key, required this.c});

  final AppController c;

  @override
  State<LinksyHome> createState() => _LinksyHomeState();
}

class _LinksyHomeState extends State<LinksyHome> {
  AppController get c => widget.c;
  late final StreamSubscription<Notice> _messages;

  @override
  void initState() {
    super.initState();
    _messages = c.messages.stream.listen(_toast);
    WidgetsBinding.instance.addPostFrameCallback((_) => c.ensureContactsAccess());
  }

  @override
  void dispose() {
    _messages.cancel();
    super.dispose();
  }

  void _toast(Notice n) {
    ScaffoldMessenger.of(context)
      ..hideCurrentSnackBar()
      ..showSnackBar(
        SnackBar(
          content: Text(n.text, style: u(14, w: w600, color: C.white)),
          action: n.action == null
              ? null
              : SnackBarAction(label: n.action!, textColor: C.yellow, onPressed: n.onAction ?? () {}),
          backgroundColor: C.ink,
          behavior: SnackBarBehavior.floating,
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
        ),
      );
  }

  @override
  Widget build(BuildContext context) {
    return ListenableBuilder(
      listenable: c,
      builder: (context, _) {
        final scr = c.screen;
        final darkTop = const {Screen.found, Screen.declined, Screen.transfer, Screen.qr}.contains(scr);
        final lightBottom = const {Screen.success, Screen.onboard, Screen.settings}.contains(scr);

        return PopScope(
          // Back exits from home, or from setup before a card exists.
          canPop: scr == Screen.home || (scr == Screen.onboard && !c.onboarded),
          onPopInvokedWithResult: (didPop, _) {
            if (!didPop) c.go(Screen.home);
          },
          child: AnnotatedRegion<SystemUiOverlayStyle>(
            value: SystemUiOverlayStyle(
              statusBarColor: Colors.transparent,
              statusBarIconBrightness: darkTop ? Brightness.light : Brightness.dark,
              statusBarBrightness: darkTop ? Brightness.dark : Brightness.light,
              systemNavigationBarColor: Colors.transparent,
              systemNavigationBarIconBrightness: lightBottom ? Brightness.dark : Brightness.light,
            ),
            child: Scaffold(
              resizeToAvoidBottomInset: false,
              backgroundColor: lightBottom ? C.light : C.dark,
              body: DesignCanvas(
                topColor: darkTop ? C.dark : C.light,
                bottomColor: lightBottom ? C.light : C.dark,
                builder: (context, size, scale) => _screen(context, size, scale),
              ),
            ),
          ),
        );
      },
    );
  }

  Widget _screen(BuildContext context, Size size, double scale) {
    final motion = !MediaQuery.disableAnimationsOf(context);
    return switch (c.screen) {
      Screen.home ||
      Screen.search ||
      Screen.incoming ||
      Screen.timeout ||
      Screen.btoff => MainFrame(key: const ValueKey('main'), c: c, size: size, motion: motion),
      Screen.found || Screen.declined => FoundScreen(key: const ValueKey('found'), c: c, motion: motion),
      Screen.transfer => TransferScreen(c: c),
      Screen.success => SuccessScreen(c: c),
      Screen.qr => QrScreen(c: c),
      Screen.onboard => OnboardScreen(c: c, scale: scale),
      Screen.perm => PermScreen(c: c),
      Screen.settings => SettingsScreen(c: c),
    };
  }
}
