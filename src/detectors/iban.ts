import type { Detector, Finding } from '../types/index.js';

// Matches candidate IBANs (2 uppercase letters + 2 digits + alphanumeric characters up to 34 chars)
const IBAN_REGEX =
  /(?<![a-zA-Z0-9])([A-Z]{2}[0-9]{2}(?:[ ]?[0-9A-Z]{4}){2,7}(?:[ ]?[0-9A-Z]{1,4})?|[A-Z]{2}[0-9]{2}[0-9A-Z]{11,30})(?![ ]?[0-9A-Z])/g;

/**
 * Validates an IBAN using the MOD-97 checksum algorithm (ISO/IEC 7064).
 */
function isValidIban(ibanStr: string): boolean {
  const cleaned = ibanStr.replace(/\s+/g, '').toUpperCase();
  if (cleaned.length < 15 || cleaned.length > 34) {
    return false;
  }

  // Rearrange: Move first 4 characters (country code + check digits) to the end
  const rearranged = cleaned.slice(4) + cleaned.slice(0, 4);

  // Convert letters A-Z to numbers 10-35
  const numericStr = rearranged.replace(/[A-Z]/g, (char) => (char.charCodeAt(0) - 55).toString());

  try {
    return BigInt(numericStr) % 97n === 1n;
  } catch {
    return false;
  }
}

export class IbanDetector implements Detector {
  readonly name = 'IbanDetector';

  detect(text: string): Finding[] {
    const findings: Finding[] = [];
    IBAN_REGEX.lastIndex = 0;

    let match: RegExpExecArray | null;
    while ((match = IBAN_REGEX.exec(text)) !== null) {
      const value = match[0];
      if (!isValidIban(value)) {
        continue;
      }

      findings.push({
        category: 'Iban',
        span: [match.index, match.index + value.length],
        value,
        placeholderPrefix: 'Iban',
      });
    }

    return findings;
  }
}
