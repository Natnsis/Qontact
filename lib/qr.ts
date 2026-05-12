type QrKind = 'url' | 'vcard' | 'mecard' | 'tel' | 'sms' | 'email' | 'text';

export type ParsedQrData = {
  kind: QrKind;
  raw: string;
  title: string;
  description: string;
  entries: Array<{ label: string; value: string }>;
  actionLabel?: string;
  actionUrl?: string;
  contactPayload?: { name?: string; phone?: string };
};

const normalize = (value: string) => value.trim();

const safeValue = (value: string | undefined) => normalize(value || '');

const cleanPhone = (value: string) => value.replace(/[^+0-9]/g, '');

const tryDecodePayload = (value: string) => {
  try {
    return decodeURIComponent(value);
  } catch {
    return value;
  }
};

const normalizePayload = (value: string) => {
  const trimmed = value.trim();
  if (/%0A|%0D|%5Cn|%5Cr|BEGIN%3AVCARD|MECARD%3A/i.test(trimmed)) {
    return tryDecodePayload(trimmed);
  }
  return trimmed;
};

const makeContactFallback = (name: string, phone: string, raw: string): ParsedQrData => {
  const cleaned = cleanPhone(phone);
  return {
    kind: 'vcard',
    raw,
    title: 'Contact QR detected',
    description: 'This QR contains contact information.',
    entries: [
      { label: 'Name', value: name.trim() },
      { label: 'Phone', value: cleaned },
    ],
    actionLabel: cleaned ? 'Add to Contacts' : undefined,
    actionUrl: undefined,
    contactPayload: cleaned ? { name: name.trim(), phone: cleaned } : undefined,
  };
};

const makeUrlResult = (url: string): ParsedQrData => ({
  kind: 'url',
  raw: url,
  title: 'Openable link detected',
  description: 'This QR contains a web address you can open in your browser.',
  entries: [{ label: 'URL', value: url }],
  actionLabel: 'Open link',
  actionUrl: url,
});

const makeTelResult = (value: string): ParsedQrData => {
  const tel = cleanPhone(value.replace(/^tel:/i, ''));
  return {
    kind: 'tel',
    raw: value,
    title: 'Phone number detected',
    description: 'This QR code contains a phone number.',
    entries: [{ label: 'Phone', value: tel }],
    actionLabel: 'Add to Contacts',
    actionUrl: undefined,
    contactPayload: { phone: tel },
  };
};

const makeSmsResult = (value: string): ParsedQrData => {
  const direct = value.replace(/^(smsto:|sms:)/i, '');
  const [recipient, message] = direct.split(':');
  return {
    kind: 'sms',
    raw: value,
    title: 'SMS contact detected',
    description: 'This QR code includes an SMS destination.',
    entries: [
      { label: 'Recipient', value: cleanPhone(recipient) },
      { label: 'Message', value: safeValue(message) },
    ],
    actionLabel: 'Send message',
    actionUrl: `sms:${cleanPhone(recipient)}${safeValue(message) ? `?body=${encodeURIComponent(message)}` : ''}`,
  };
};

const makeEmailResult = (value: string): ParsedQrData => {
  const direct = value.replace(/^mailto:/i, '');
  const [recipient] = direct.split('?');
  return {
    kind: 'email',
    raw: value,
    title: 'Email contact detected',
    description: 'This QR code contains an email address.',
    entries: [{ label: 'Email', value: recipient }],
    actionLabel: 'Open email',
    actionUrl: `mailto:${recipient}`,
  };
};

const parseVCard = (data: string): ParsedQrData | null => {
  // Handle different line ending formats - split on actual newlines first
  let lines = data
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);

  if (!lines.some((line) => /^BEGIN:VCARD/i.test(line))) {
    // Try escaped newlines if regular newlines didn't work
    lines = data
      .split(/\\n/)
      .map((line) => line.trim())
      .filter(Boolean);

    if (!lines.some((line) => /^BEGIN:VCARD/i.test(line))) {
      return null;
    }
  }

  const entries: Array<{ label: string; value: string }> = [];
  let phone = '';
  let email = '';
  let url = '';
  let name = '';

  for (const line of lines) {
    const colonIndex = line.indexOf(':');
    if (colonIndex === -1) continue;

    const keyPart = line.substring(0, colonIndex);
    const value = line.substring(colonIndex + 1).trim();
    const key = keyPart.split(';')[0].toLowerCase();

    if ((!name && /^fn$/i.test(key)) || (/^n$/i.test(key) && !name)) {
      name = value;
      entries.push({ label: 'Name', value });
    }

    if (/^tel$/i.test(key)) {
      const cleaned = cleanPhone(value);
      if (cleaned) {
        phone = cleaned;
        entries.push({ label: 'Phone', value: cleaned });
      }
    }

    if (/^email$/i.test(key)) {
      email = value;
      entries.push({ label: 'Email', value });
    }

    if (/^url$/i.test(key)) {
      url = value;
      entries.push({ label: 'URL', value });
    }
  }

  return {
    kind: 'vcard',
    raw: data,
    title: 'Contact QR detected',
    description: 'This QR contains a contact card (VCARD).',
    entries,
    actionLabel: phone ? 'Add to Contacts' : email ? 'Email contact' : url ? 'Open link' : undefined,
    actionUrl: phone ? undefined : email ? `mailto:${email}` : url ? url : undefined,
    contactPayload: phone ? { name: name || undefined, phone } : undefined,
  };
};

const parseMecard = (data: string): ParsedQrData | null => {
  const match = data.match(/^MECARD:(.*)$/i);
  if (!match) return null;

  const payload = match[1];
  const segments = payload.split(';').filter(Boolean);
  const entries: Array<{ label: string; value: string }> = [];
  let phone = '';
  let email = '';
  let name = '';
  let url = '';

  for (const segment of segments) {
    const [key, ...rest] = segment.split(':');
    const value = rest.join(':').trim();
    if (/^N$/i.test(key)) {
      name = value;
      entries.push({ label: 'Name', value });
    }
    if (/^TEL$/i.test(key)) {
      phone = cleanPhone(value);
      entries.push({ label: 'Phone', value: phone });
    }
    if (/^EMAIL$/i.test(key)) {
      email = value;
      entries.push({ label: 'Email', value });
    }
    if (/^URL$/i.test(key)) {
      url = value;
      entries.push({ label: 'URL', value });
    }
  }

  return {
    kind: 'mecard',
    raw: data,
    title: 'Contact QR detected',
    description: 'This QR contains a contact card (MECARD).',
    entries,
    actionLabel: phone ? 'Add to Contacts' : email ? 'Email contact' : url ? 'Open link' : undefined,
    actionUrl: phone ? undefined : email ? `mailto:${email}` : url ? url : undefined,
    contactPayload: phone ? { name: name || undefined, phone } : undefined,
  };
};

const parseUrl = (data: string): ParsedQrData | null => {
  const normalized = data.trim();
  const url = /^(https?:\/\/|www\.)/i.test(normalized) ? normalized : '';
  if (!url) return null;

  const finalUrl = /^www\./i.test(url) ? `https://${url}` : url;
  return makeUrlResult(finalUrl);
};

const parseNamePhoneFallback = (data: string): ParsedQrData | null => {
  const match = data.match(/^(.+?)\s*\(\s*(\+?[0-9][0-9 ()-]*)\s*\)$/);
  if (!match) return null;
  return makeContactFallback(match[1], match[2], data);
};

const isPurePhone = (data: string): boolean => {
  const cleaned = cleanPhone(data);
  return /^\+?[0-9]{7,20}$/.test(cleaned);
};

export const parseQrPayload = (raw: string): ParsedQrData => {
  const data = normalizePayload(raw);
  const lower = data.toLowerCase();

  if (/begin:vcard/i.test(data)) {
    const result = parseVCard(data);
    return (
      result ?? {
        kind: 'text',
        raw: data,
        title: 'Text received',
        description: 'QR code content could not be parsed as structured contact data.',
        entries: [{ label: 'Raw', value: data }],
      }
    );
  }

  if (/mecard:/i.test(data)) {
    return (
      parseMecard(data) ?? {
        kind: 'text',
        raw: data,
        title: 'Text received',
        description: 'QR code content could not be parsed as structured contact data.',
        entries: [{ label: 'Raw', value: data }],
      }
    );
  }

  if (/^tel:/i.test(data)) {
    return makeTelResult(data);
  }

  if (/^smsto:/i.test(data) || /^sms:/i.test(data)) {
    return makeSmsResult(data);
  }

  if (/^mailto:/i.test(data)) {
    return makeEmailResult(data);
  }

  if (/^(https?:\/\/)|^(www\.)/i.test(data)) {
    return parseUrl(data) as ParsedQrData;
  }

  if (isPurePhone(data)) {
    return makeTelResult(data);
  }

  return {
    kind: 'text',
    raw: data,
    title: 'Text QR detected',
    description: 'This QR code contains plain text or unsupported data.',
    entries: [{ label: 'Raw', value: data }],
  };
};
