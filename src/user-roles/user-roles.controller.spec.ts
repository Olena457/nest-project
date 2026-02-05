import { UserRolesController } from './user-roles.controller';
import { UserRolesService } from './user-roles.service';

describe('UserRolesController', () => {
  let controller: UserRolesController;
  const service = {} as unknown as UserRolesService;

  beforeEach(() => {
    controller = new UserRolesController(service);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
