import type { Detector, Finding } from '../types/index.js';

// Matches US Social Security Number candidate patterns (3-2-4 format with hyphens, spaces, or continuous)
const SSN_REGEX = /(?<!\d)([0-9]{3})[\s-]?([0-9]{2})[\s-]?([0-9]{4})(?!\d)/g;

/**
 * Validates whether the 3 components of an SSN satisfy Social Security Administration rules.
 */
function isValidSsn(area: string, group: string, serial: string): boolean {
  return (
    area !== '000' &&
    area !== '666' &&
    !area.startsWith('9') &&
    group !== '00' &&
    serial !== '0000'
  );
}

export class SsnDetector implements Detector {
  readonly name = 'SsnDetector';

  detect(text: string): Finding[] {
    const findings: Finding[] = [];
    SSN_REGEX.lastIndex = 0;

    let match: RegExpExecArray | null;
    while ((match = SSN_REGEX.exec(text)) !== null) {
      const area = match[1] ?? '';
      const group = match[2] ?? '';
      const serial = match[3] ?? '';

      if (!isValidSsn(area, group, serial)) {
        continue;
      }

      const value = match[0];
      findings.push({
        category: 'Ssn',
        span: [match.index, match.index + value.length],
        value,
        placeholderPrefix: 'Ssn',
      });
    }

    return findings;
  }
}
