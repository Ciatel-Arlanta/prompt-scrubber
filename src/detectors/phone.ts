import type { Detector, Finding } from '../types/index.js';

// Phone number patterns — conservative to avoid false positives on dates, versions, zip codes.
// Requires structural markers: +prefix, parentheses, or dashes/dots between groups.
const PHONE_PATTERNS: RegExp[] = [
  // International E.164: +1 800 555 0199, +44-7911-123456, +353 1 234 5678
  /(?<!\d)(\+\d{1,3}[\s\-.]?\(?\d{1,4}\)?[\s\-.]?\d{1,4}[\s\-.]?\d{1,9})(?!\d)/g,
  // US: (555) 123-4567, (555)123-4567
  /(?<!\d)(\(\d{3}\)[\s\-.]?\d{3}[\s\-.]?\d{4})(?!\d)/g,
  // US/local with dashes or dots: 555-123-4567, 555.123.4567
  /(?<!\d)(\d{3}[-.]\d{3}[-.]\d{4})(?!\d)/g,
];

export class PhoneDetector implements Detector {
  readonly name = 'PhoneDetector';

  detect(text: string): Finding[] {
    const raw: Finding[] = [];

    for (const regex of PHONE_PATTERNS) {
      regex.lastIndex = 0;
      let match: RegExpExecArray | null;

      while ((match = regex.exec(text)) !== null) {
        const value = match[1] ?? match[0];
        const digits = value.replace(/\D/g, '');
        if (digits.length < 7) continue;

        const start = match.index + (match[0].length - value.length);

        raw.push({
          category: 'Phone',
          span: [start, start + value.length],
          value,
          placeholderPrefix: 'Phone',
        });
      }
    }

    raw.sort((a, b) => a.span[0] - b.span[0]);
    return raw;
  }
}
