import { createParamDecorator, ExecutionContext } from '@nestjs/common';

export const User = createParamDecorator((data: string | undefined, ctx: ExecutionContext) => {
  const request = ctx.switchToHttp().getRequest<{ user?: Record<string, unknown> }>();
  const user = request.user;

  if (!data) {
    return user;
  }

  return user ? user[data] : undefined;
});
