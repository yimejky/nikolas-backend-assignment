export type CommandStatus = "RUNNING" | "DONE" | "FAILED";

export interface CommandState {
  id: string,
  status: CommandStatus,
  error?: string
}

export class SuperDuperRememberer {
  public memory: string[] = [];
  private commandState: {[key: string]: CommandState} = {};

  public async executeCommand(command: ExecuteStatementCommand | DescribeStatementCommand): Promise<CommandState> {
    if (command instanceof ExecuteStatementCommand) {
      const commandId = Math.floor(Math.random() * 10000000).toString();
      this.commandState[commandId] = {
        id: commandId,
        status: "RUNNING"
      };
      const work = async () => {
        await this.importantWork(5000);
        try {
          this.executeStatement((command as ExecuteStatementCommand).options.statement);
          this.commandState[commandId].status = "DONE";
        } catch (e: unknown) {
          this.commandState[commandId].status = "FAILED";
          this.commandState[commandId].error = (e as Error).message;
        }
      };
      await this.importantWork(100);
      work();
      return this.commandState[commandId];
    }
    if (command instanceof DescribeStatementCommand) {
      const commandId = (command as DescribeStatementCommand).options.id;
      await this.importantWork(100);
      if (this.commandState[commandId] == null) {
        throw new Error(`COMMAND ${commandId} NOT FOUND!`);
      }
      return this.commandState[commandId];
    }
    throw new Error("UNKNOWN COMMAND!");
  }

  private executeStatement(statement: string) {
    if (statement.length > 300) {
      throw new Error("THERE'S NO WAY TO REMEMBER ALL THAT AT ONCE!");
    }
    const regex = /^CAN YOU PLEASE REMEMBER THESE ITEMS\? ('[a-z]+')(,'[a-z]+')* K THX BYE.$/g;
    if (!regex.test(statement)) {
      throw new Error("STATEMENT IS INVALID");
    }
    const items = statement.match(/'([a-z]+)'/g)?.map(x => x.replace(/'/g, ""));
    if (items) {
      this.memory.push(...items);
    }
  }

  private async importantWork(x: number) {
    return new Promise(done => setTimeout(done, x + Math.random() * x));
  }
}

export class ExecuteStatementCommand {
  constructor(public options: {statement: string}) {}
}

export class DescribeStatementCommand {
  constructor(public options: {id: string}) {}
}
