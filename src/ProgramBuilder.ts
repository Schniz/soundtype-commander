import { Command } from 'commander';
import { Program } from './Program';

/**
 * A more readable and declarative form of `Cond extends true ? True : False`
 */
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

/**
 * Build type-safe `commander` programs
 */
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

  /**
   * Add a new option to the command (`--myOption`)
   *
   * @param opts option definition
   */
  option<
    ArgumentName extends string,
    ArgumentType,
    Required extends boolean | undefined
  >(
    opts: {
      /** The name of the command (`--${name}`). Please only use camelCase! */
      name: ArgumentName;
      /** A shorthand form of the command */
      shorthand?: string;
      required?: Required;
      /** A description for this option */
      description: string;
    } & (ArgumentType extends boolean
      ? {
          /** This is a boolean, you shouldn't provide a parse */
          parse?: never;
          argName?: never;
        }
      : {
          /** Parse the given string from the user to your data type */
          parse(val: string): ArgumentType;
          /** A custom argument name */
          argName?: string;
        }) &
      (Required extends true
        ? { default?: undefined }
        : {
            /** The default value when the option is missing */
            default: ArgumentType;
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
        cmd => {
          const fn = opts.required ? 'requiredOption' : 'option';
          return cmd[fn](
            `${shorthandDef}--${opts.name}${optionArgument}`,
            opts.description,
            opts.default
          );
        },
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

  /** Declare variadic parameters */
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
    const command = this.createCommand();
    return new Program(command, p => {
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
