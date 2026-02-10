import { UserProfileService } from './user-profile.service';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';

describe('UsersController', () => {
  let controller: UsersController;
  const service: Partial<UsersService> = {};
  const profileService: Partial<UserProfileService> = {};
  beforeEach(() => {
    controller = new UsersController(service, profileService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
