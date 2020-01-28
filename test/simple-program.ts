import { program } from '../src/index';

const myProgram = program('my-app', '1.0.0')
  .option({
    name: 'bool',
    description: 'this is a boolean',
    default: false,
  })
  .option({
    name: 'num',
    description: 'this is a number',
    default: undefined,
    parse: str => {
      const value = parseInt(str, 10);
      if (Number.isNaN(value)) throw new Error('This is not an int');
      return value;
    },
  })
  .option({
    name: 'requiredNum',
    description: 'this is a number',
    required: true,
    parse: str => {
      const value = parseInt(str, 10);
      if (Number.isNaN(value)) throw new Error('This is not an int');
      return value;
    },
  })
  .variadic({ name: 'positional', required: true })
  .build();

export const parse = (args: string[]) => {
  /** @export result */
  const result = myProgram.parse(args);
  return result;
};
