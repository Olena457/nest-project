import { FindOperator, IsNull } from 'typeorm';

export const isNull = <T>(): FindOperator<T> => IsNull() as unknown as FindOperator<T>;
