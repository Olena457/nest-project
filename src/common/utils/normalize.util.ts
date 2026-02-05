import { BadRequestException } from '@nestjs/common';

export function normalizeString(
  value?: unknown,
  opts: { emptyToNull?: boolean; passUndefined?: boolean; fieldName?: string } = {},
): string | null | undefined {
  const { emptyToNull = true, passUndefined = true, fieldName } = opts;
  let candidate = value;

  if (candidate === undefined) {
    if (passUndefined) {
      return undefined;
    }

    candidate = '';
  }

  if (candidate === null) {
    return emptyToNull ? null : '';
  }

  if (typeof candidate !== 'string') {
    throw new BadRequestException(
      fieldName ? `${fieldName} must be a string.` : 'Value must be a string.',
    );
  }

  const s = candidate.trim();
  if (s) {
    return s;
  }

  return emptyToNull ? null : '';
}

export function requiredString(value: unknown, fieldName = 'value'): string {
  const normalized = normalizeString(value, {
    emptyToNull: false,
    passUndefined: false,
    fieldName,
  });

  if (!normalized) {
    throw new BadRequestException(`${fieldName} must be a non-empty string.`);
  }

  return normalized;
}

export function normalizeEmail(value: string): string {
  return value.toLowerCase().trim();
}

export function normalizePhone(value?: unknown) {
  return normalizeString(value, { emptyToNull: true, fieldName: 'phoneNumber' });
}

export function safeParseJSON(s: string) {
  try {
    return JSON.parse(s);
  } catch {
    return null;
  }
}

export const optionalString = (v?: string | null): string | undefined => {
  if (v === undefined) {
    return undefined;
  }

  return (v ?? '').trim();
};

export const optionalNullableString = (v?: string | null): string | null | undefined => {
  if (v === undefined) {
    return undefined;
  }

  const s = (v ?? '').trim();

  return s ? s : null;
};

export const toNumericStringOrNull = (v?: string | null): string | null | undefined => {
  const s = optionalNullableString(v);
  if (s === '') {
    return null;
  }

  return s;
};

export const splitName = (legalName?: string): { first: string; last: string } => {
  const n = (legalName ?? '').trim().replace(/\s+/g, ' ');
  if (!n) {
    return { first: 'Unknown', last: 'Unknown' };
  }

  const parts = n.split(' ');
  if (parts.length === 1) {
    return { first: parts[0], last: 'Unknown' };
  }

  const last = parts.pop()!;

  return { first: parts.join(' '), last };
};
