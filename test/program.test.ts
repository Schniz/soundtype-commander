import { program } from '../src/index';
import { getTypes } from 'infer-types';
import * as path from 'path';

test('works', () => {
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
    .variadic({ name: 'positional', required: true })
    .build();

  const result = myProgram.parse([
    'node',
    'my-app.js',
    '--num=10',
    'positional',
    '--bool',
    'argument',
  ]);

  expect(result).toEqual({
    bool: true,
    num: 10,
    positional: ['positional', 'argument'],
  });
});

test('inference', () => {
  const inferredTypes = getTypes(path.join(__dirname, 'simple-program.ts'));
  expect(inferredTypes).toMatchSnapshot();
});
