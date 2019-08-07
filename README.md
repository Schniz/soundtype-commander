# `@soundtype/commander`

A type-safe wrapper around [commander.js](https://github.com/tj/commander.js) with excellent type inference.

## Usage

```ts
import { program } from '@soundtype/commander';

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

// result type is `{ num?: number, bool: boolean, positional: string[] }`
const result = myProgram.parse(process.argv);
```

## Local Development

This project was bootstrapped with [TSDX](https://github.com/jaredpalmer/tsdx).

Below is a list of commands you will probably find useful.

### `npm start` or `yarn start`

Runs the project in development/watch mode. Your project will be rebuilt upon changes. TSDX has a special logger for you convenience. Error messages are pretty printed and formatted for compatibility VS Code's Problems tab.

<img src="https://user-images.githubusercontent.com/4060187/52168303-574d3a00-26f6-11e9-9f3b-71dbec9ebfcb.gif" width="600" />

Your library will be rebuilt if you make edits.

### `npm run build` or `yarn build`

Bundles the package to the `dist` folder.
The package is optimized and bundled with Rollup into multiple formats (CommonJS, UMD, and ES Module).

<img src="https://user-images.githubusercontent.com/4060187/52168322-a98e5b00-26f6-11e9-8cf6-222d716b75ef.gif" width="600" />

### `npm test` or `yarn test`

Runs the test watcher (Jest) in an interactive mode.
By default, runs tests related to files changed since the last commit.
