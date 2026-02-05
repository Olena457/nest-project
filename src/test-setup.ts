import { ConfigService } from '@nestjs/config';
import { Test, TestingModuleBuilder } from '@nestjs/testing';

const originalCreateTestingModule = Test.createTestingModule.bind(Test);

const createProxyMock = () =>
  new Proxy(
    {},
    {
      get(target, prop) {
        if (prop === 'then') {
          return undefined;
        }

        if (prop === '__esModule') {
          return true;
        }

        if (!(prop in target)) {
          target[prop] = jest.fn();
        }

        return target[prop];
      },
    },
  );

const defaultMockFactory = (token: unknown) => {
  if (token === ConfigService) {
    return {
      get: jest.fn(),
      set: jest.fn(),
      getOrThrow: jest.fn(),
    } satisfies Partial<ConfigService>;
  }

  return createProxyMock();
};

Test.createTestingModule = function (...args) {
  const builder: TestingModuleBuilder = originalCreateTestingModule(...args);

  return builder.useMocker(defaultMockFactory);
};
