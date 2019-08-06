import { Command } from 'commander';
import { Program } from './Program';

type If<
  Condition extends { Cond: boolean; True: any; False: any }
> = Condition['Cond'] extends true ? Condition['True'] : Condition['False'];

type VariadicArgsOptions<Name extends string = string> = {
  name: Name;
  required: boolean;
};

type OptionsFor<X> = {
  [key in keyof X]: {
    parse(str: string): X[key];
    default: X[key];
  };
};

export class ProgramBuilder<
  ArgumentTypes extends { [key: string]: any } = {},
  HasVariadic extends boolean = false
> {
  private readonly options: OptionsFor<ArgumentTypes>;
  private readonly variadicOpts: If<{
    Cond: HasVariadic;
    True: VariadicArgsOptions;
    False: undefined;
  }>;
  private readonly enhancers: ((cmd: Command) => Command)[] = [];
  private readonly name: string;
  private readonly version: string;

  constructor(
    enhancers: ((cmd: Command) => Command)[],
    options: OptionsFor<ArgumentTypes>,
    name: string,
    version: string,
    variadicOpts: If<{
      Cond: HasVariadic;
      True: VariadicArgsOptions;
      False: undefined;
    }>
  ) {
    this.enhancers = enhancers;
    this.options = options;
    this.name = name;
    this.version = version;
    this.variadicOpts = variadicOpts;
  }

  static create(name: string, version: string): ProgramBuilder<{}, false> {
    return new ProgramBuilder<{}>([], {}, name, version, undefined);
  }

  option<ArgumentName extends string, ArgumentType>(
    opts: {
      name: ArgumentName;
      shorthand?: string;
      default: ArgumentType;
      description: string;
    } & (ArgumentType extends boolean
      ? { parse?: never; argName?: never }
      : {
          parse(val: string): ArgumentType;
          argName?: string;
        })
  ) {
    const optionArgument =
      typeof opts.default === 'boolean' ? '' : ` <${opts.argName || 'arg'}>`;
    const shorthandDef = opts.shorthand ? `-${opts.shorthand}, ` : '';

    const parse = typeof opts.default === 'boolean' ? Boolean : opts.parse;

    return new ProgramBuilder<
      ArgumentTypes & { [key in ArgumentName]: ArgumentType },
      HasVariadic
    >(
      [
        ...this.enhancers,
        cmd =>
          cmd.option(
            `${shorthandDef}--${opts.name}${optionArgument}`,
            opts.description,
            opts.default
          ),
      ],
      {
        ...this.options,
        [opts.name]: { default: opts.default, parse },
      },
      this.name,
      this.version,
      this.variadicOpts
    );
  }

  variadic<Name extends string>(
    opts: If<{
      Cond: HasVariadic;
      True: never;
      False: VariadicArgsOptions<Name>;
    }>
  ): ProgramBuilder<ArgumentTypes & { [key in Name]: string[] }, true> {
    return new ProgramBuilder<
      ArgumentTypes & { [key in Name]: string[] },
      true
    >(this.enhancers, this.options, this.name, this.version, opts);
  }

  private createCommand(): Command {
    const command = new Command();
    const usageVariadic = !this.variadicOpts
      ? ''
      : this.variadicOpts.required
      ? ` <${this.variadicOpts.name}>`
      : ` [${this.variadicOpts.name}]`;
    command
      .name(this.name)
      .version(this.version)
      .usage(`[options]${usageVariadic}`);
    return this.enhancers.reduce((cmd, fn) => fn(cmd), command);
  }

  build(): Program<ArgumentTypes> {
    return new Program(this.createCommand(), p => {
      const result: ArgumentTypes = {} as any;

      if (this.variadicOpts) {
        result[this.variadicOpts.name as keyof ArgumentTypes] = p.args as any;
      }

      for (const [key, option] of Object.entries(this.options)) {
        result[key as keyof ArgumentTypes] =
          p[key] === undefined ? option.default : option.parse(p[key]);
      }

      return result;
    });
  }
}
