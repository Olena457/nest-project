import {
  ValidationArguments,
  ValidatorConstraint,
  ValidatorConstraintInterface,
} from 'class-validator';

@ValidatorConstraint({ name: 'PasswordNotEmail', async: false })
export class PasswordNotEmailConstraint implements ValidatorConstraintInterface {
  validate(value: string, args: ValidationArguments) {
    if (typeof value !== 'string') {
      return false;
    }

    const email: string | undefined = (args.object as any)?.email;
    if (!email) {
      return true;
    }

    const [local] = email.toLowerCase().split('@');
    const v = value.toLowerCase();
    if (v.includes(email.toLowerCase())) {
      return false;
    }

    if (local && v.includes(local)) {
      return false;
    }

    return true;
  }

  defaultMessage() {
    return 'Password must not contain your email or its local part.';
  }
}
