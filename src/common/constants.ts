import { TUUIDVersion } from './types/uuidVersion.type';

export const PG_UNIQUE_VIOLATION = '23505' as const;
export const PG_FOREIGN_KEY_VIOLATION = '23503' as const;

export const UUID_VERSION: TUUIDVersion = '4';
