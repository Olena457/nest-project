export const normalizeEmail = (email?: string): string | undefined => {
  if (typeof email === 'string') {
    return email.toLowerCase().trim();
  }

  return undefined;
};

export const cleanStr = (v?: string | null): string | undefined => {
  if (v === undefined || v === null) {
    return undefined;
  }

  const s = v.trim();

  return s;
};

export const normalizePhone = (v?: string | null): string | null | undefined => {
  if (v === undefined) {
    return undefined;
  }

  const s = v?.trim();

  return s ? s : null;
};

export const safeParseJSON = (s: string): unknown => {
  try {
    return JSON.parse(s);
  } catch {
    return null;
  }
};

export const toInt = (v: unknown, d: number): number => {
  const n = Number(v);

  return Number.isFinite(n) ? n : d;
};
