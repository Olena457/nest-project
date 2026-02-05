import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';

describe('AuthController', () => {
  let controller: AuthController;
  const service = {} as unknown as AuthService;

  beforeEach(() => {
    controller = new AuthController(service);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
