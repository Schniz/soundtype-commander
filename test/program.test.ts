import { program } from '../src/index';
import { getTypes } from 'infer-types';
import * as path from 'path';

function toInt(str: string): number {
  const value = parseInt(str, 10);
  if (Number.isNaN(value)) throw new Error('This is not an int');
  return value;
}

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
      parse: toInt,
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

test(`ensures required isn't missing`, () => {
  const myProgram = program('app', '1.0.0')
    .option({
      name: 'req',
      description: 'a required field',
      required: true,
      parse: toInt,
    })
    .build();

  const processExit = jest
    .spyOn(process, 'exit')
    .mockReturnValue(undefined as never);
  const consoleError = jest.spyOn(console, 'error').mockReturnValue();

  myProgram.parse(['node', 'myapp.js']);
  expect(processExit).toHaveBeenCalledWith(1);
  expect(consoleError).toHaveBeenCalledWith(
    expect.stringMatching(`required option '--req <arg>'`)
  );

  expect(myProgram.parse(['node', 'myapp.js', '--req=10'])).toEqual({
    req: 10,
  });
});

test('inference', () => {
  const inferredTypes = getTypes(path.join(__dirname, 'simple-program.ts'));
  expect(inferredTypes).toMatchSnapshot();
});
