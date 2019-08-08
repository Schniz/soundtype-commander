import { Command } from 'commander';

export class Program<ArgumentTypes extends { [key: string]: any }> {
  private readonly parseFn: (cmd: Command) => ArgumentTypes;
  private readonly command: Command;

  constructor(command: Command, parse: (cmd: Command) => ArgumentTypes) {
    this.parseFn = parse;
    this.command = command;
  }

  /** Execute commander */
  parse(argv: string[]): ArgumentTypes {
    return this.parseFn(this.command.parse(argv));
  }
}
