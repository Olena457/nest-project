import { SetMetadata } from '@nestjs/common';

export const ALLOW_BANNED_USERS_KEY = 'allowBannedUsers';
export const AllowBannedUsers = () => SetMetadata(ALLOW_BANNED_USERS_KEY, true);
