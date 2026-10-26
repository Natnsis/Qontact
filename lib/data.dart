/// A nearby Linksy phone (and, once exchanged, its card).
class Peer {
  Peer({required this.id, required this.name, required this.slot, required this.code});

  /// Its Bluetooth session id.
  final String id;

  /// Display name from its advertisement; the card's name wins once received.
  String name;

  /// Smoothed signal strength in dBm.
  double rssi = -75;

  /// Order of discovery; fixes its spot on the radar so it doesn't jump.
  final int slot;

  /// The 4-digit match code both phones show.
  final String code;

  /// Fields received from them: name, phone, email, company, title.
  final card = <String, String>{};

  List<String> get _words {
    final n = (card['name'] ?? name).trim();
    return n.isEmpty ? const [] : n.split(RegExp(r'\s+'));
  }

  String get first => _words.isEmpty ? 'Someone' : _words.first;
  String get last => _words.length > 1 ? _words.sublist(1).join(' ') : '';
  String get fullName => _words.isEmpty ? 'Someone nearby' : _words.join(' ');

  String get ini {
    final w = _words;
    if (w.isEmpty) return '?';
    return w.take(2).map((x) => x[0]).join().toUpperCase();
  }

  String get phone => card['phone'] ?? '';
  String get email => card['email'] ?? '';
  String get company => card['company'] ?? '';
  String get title => card['title'] ?? '';

  /// 0–1 closeness for the radar: a stronger signal sits nearer the center.
  double get sig => ((rssi + 95) / 55).clamp(.25, .95);

  /// Radar angle in degrees, spread so early arrivals never overlap.
  double get ang => const [15.0, 150.0, -55.0, 200.0, -125.0, 85.0, -10.0, 255.0][slot % 8];

  /// Same code on both phones: derived from the two session ids.
  static String matchCode(String a, String b) {
    final pair = ([a, b]..sort()).join(':');
    var h = 0x811c9dc5;
    for (final c in pair.codeUnits) {
      h = ((h ^ c) * 0x01000193) & 0xFFFFFFFF;
    }
    return (h % 10000).toString().padLeft(4, '0');
  }
}

class Profile {
  Profile({required this.name, required this.phone, required this.email, required this.company, required this.title});

  String name, phone, email, company, title;

  String operator [](String k) => switch (k) {
    'name' => name,
    'phone' => phone,
    'email' => email,
    'company' => company,
    _ => title,
  };

  void operator []=(String k, String v) {
    switch (k) {
      case 'name':
        name = v;
      case 'phone':
        phone = v;
      case 'email':
        email = v;
      case 'company':
        company = v;
      default:
        title = v;
    }
  }

  String get initials {
    final ini = name.split(RegExp(r'\s+')).where((w) => w.isNotEmpty).map((w) => w[0]).take(2).join().toUpperCase();
    return ini.isEmpty ? '?' : ini;
  }

  /// vCard for the QR fallback: any phone camera can import it as a contact.
  String get vCard {
    String esc(String v) => v.replaceAll(r'\', r'\\').replaceAll(',', r'\,').replaceAll(';', r'\;');
    final words = name.trim().split(RegExp(r'\s+'));
    final last = words.length > 1 ? words.sublist(1).join(' ') : '';
    return [
      'BEGIN:VCARD',
      'VERSION:3.0',
      'N:${esc(last)};${esc(words.first)};;;',
      'FN:${esc(name.trim())}',
      'TEL;TYPE=CELL:${esc(phone)}',
      if (email.isNotEmpty) 'EMAIL:${esc(email)}',
      if (company.isNotEmpty) 'ORG:${esc(company)}',
      if (title.isNotEmpty) 'TITLE:${esc(title)}',
      'END:VCARD',
    ].join('\n');
  }
}

/// Optional fields the user can choose to share, in display order.
const shareLabels = {'email': 'Email', 'company': 'Company', 'title': 'Title'};
