import 'package:flutter_test/flutter_test.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:shared_preferences/shared_preferences.dart';

import 'package:linksy/controller.dart';
import 'package:linksy/main.dart';

void main() {
  setUpAll(() => GoogleFonts.config.allowRuntimeFetching = false);

  testWidgets('first launch opens card setup', (tester) async {
    SharedPreferences.setMockInitialValues({});
    final c = AppController(bluetooth: false);
    await c.load();
    await tester.pumpWidget(LinksyApp(c: c));
    expect(find.text('Save card'), findsOneWidget);
    expect(find.text('Use my number'), findsOneWidget);
    // Let the automatic number offer run (no native side in tests).
    await tester.pump(const Duration(seconds: 1));
    expect(c.numberOffered, isTrue);
  });

  testWidgets('saved card opens home', (tester) async {
    SharedPreferences.setMockInitialValues({
      'onboarded': true,
      'profile.name': 'Natnael Sisay',
      'profile.phone': '+251 91 234 5678',
    });
    final c = AppController(bluetooth: false);
    await c.load();
    await tester.pumpWidget(LinksyApp(c: c));
    expect(find.text('Your card'), findsOneWidget);
    expect(find.text('Connect'), findsOneWidget);
    expect(find.text('Natnael Sisay'), findsOneWidget);
  });
}
