export const normalizeEmail = (email: string | undefined) => {
  if (typeof email === 'string') {
    return email.toLowerCase().trim();
  }
};

export const cleanStr = (v?: string | null): string | undefined => {
  if (v === undefined) {
    return undefined;
  }

  const s = v?.trim() ?? '';

  return s;
};

export const normalizePhone = (v?: string | null): string | null => {
  if (v === undefined) {
    return undefined as any;
  }

  const s = v?.trim();

  return s ? s : null;
};

export const safeParseJSON = (s: string) => {
  try {
    return JSON.parse(s);
  } catch {
    return null;
  }
};

export const toInt = (v: any, d: number) => {
  const n = Number(v);

  return Number.isFinite(n) ? n : d;
};
