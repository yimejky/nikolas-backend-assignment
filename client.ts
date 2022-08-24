import {
  DescribeStatementCommand,
  ExecuteStatementCommand,
  SuperDuperRememberer,
} from "./super-duper-rememberer";

// statement constants
const STATEMENT_REPLACE = "%s";
const STATEMENT = `CAN YOU PLEASE REMEMBER THESE ITEMS? ${STATEMENT_REPLACE} K THX BYE.`;
const STATEMENT_LENGTH = STATEMENT.length - STATEMENT_REPLACE.length;
const MAX_STATEMENT_LENGTH = 300;
// statements can be only MAX_STATEMENT_LENGTH (300) chars long -> therefore input strings have also max length
const MAX_INPUT_STRING_LENGTH = MAX_STATEMENT_LENGTH - STATEMENT_LENGTH - 2;

// execution constants
const EXECUTE_CHECK_TIMEOUT = 1000;
const EXECUTE_CHECK_MAX_WAIT_TIME = 60 * 1000;
const EXECUTE_COMMAND_MAX_RETRY = 5;

const wait = async (timeoutMs: number): Promise<true> =>
  new Promise((done) => setTimeout(() => done(true), timeoutMs));

export class InvalidInputError extends Error {
  constructor(message: string) {
    super(message);
  }
}

export class RememberError extends Error {
  constructor(message: string) {
    super(message);
  }
}

enum SDR_EXEC_STATES {
  RUNNING = "RUNNING",
  FAILED = "FAILED",
  DONE = "DONE",
}

class SDRBatch {
  constructor(public length: number = 0, public data: string[] = []) {}

  setLength(length: number) {
    this.length = length;
  }

  addData(str: string) {
    this.data.push(str);
  }

  getRememberStatement() {
    // statement inputs must be in format [comma-separated single-quoted strings]
    const quotedInput = this.data.map((str) => `'${str}'`);
    const statementInput = quotedInput.join(",");

    // statement construction
    const inputStatement = STATEMENT.replace(STATEMENT_REPLACE, statementInput);
    return inputStatement;
  }
}

function createBatches(data: string[]): SDRBatch[] {
  // > The client should be able to handle large number of input strings, remember items in the same order
  // > as they appear in the input and minimize number of calls to the SDR
  // in order to minimize number of request we are trying to reach longest possible statement size
  const batches: SDRBatch[] = [];
  let lastBatch: SDRBatch = new SDRBatch();
  batches.push(lastBatch);

  data.forEach((str) => {
    const strLength = str.length + 2;
    // string + 2 ticks + comma
    const newLength =
      lastBatch.length + strLength + (lastBatch.length === 0 ? 0 : 1);

    // can it fit more?
    if (newLength + STATEMENT_LENGTH > MAX_STATEMENT_LENGTH) {
      // it cannot fit more, create new and insert actual string
      lastBatch = new SDRBatch();
      batches.push(lastBatch);
      lastBatch.setLength(strLength);
    } else {
      lastBatch.setLength(newLength);
    }
    lastBatch.addData(str);
  });

  return batches;
}

const EXECUTE_MAX_TIME_REACHED = "EXECUTE_MAX_TIME_REACHED";
async function executeCommand(
  rememberer: SuperDuperRememberer,
  command: ExecuteStatementCommand
): Promise<true> {
  const getStatementState = async (id: string) =>
    rememberer.executeCommand(new DescribeStatementCommand({ id }));

  // execute command, check statement until reach different status or max time
  let result = await rememberer.executeCommand(command);

  let maxTimeTimeout: null | NodeJS.Timeout = null;
  const maxTimePromise = new Promise((done) => {
    maxTimeTimeout = setTimeout(
      () => done(EXECUTE_MAX_TIME_REACHED),
      EXECUTE_CHECK_MAX_WAIT_TIME
    );
  });

  while (result.status === SDR_EXEC_STATES.RUNNING) {
    const timeoutResult = await Promise.race([
      wait(EXECUTE_CHECK_TIMEOUT),
      maxTimePromise,
    ]);
    if (timeoutResult === EXECUTE_MAX_TIME_REACHED)
      throw new RememberError("Remembering reached max time");
    result = await getStatementState(result.id);
  }
  // clearing max wait time
  maxTimeTimeout && clearTimeout(maxTimeTimeout);

  // handle results
  if (result.status === SDR_EXEC_STATES.FAILED) {
    throw new RememberError(`Remembering failed: ${result.error || "unknown"}`);
  }
  if (result.status === SDR_EXEC_STATES.DONE) {
    return true;
  }

  throw new RememberError("Remembering returned unknown status");
}

export async function rememberData(
  rememberer: SuperDuperRememberer,
  data: string[]
): Promise<void> {
  if (data.length <= 0) {
    throw new InvalidInputError("Invalid input: input array is empty");
  }

  const hasValidInput = data.every((str) => /^[a-z]+$/g.test(str));
  if (!hasValidInput) {
    throw new InvalidInputError(
      "Invalid input: expecting small english letters(a-z)"
    );
  }

  // statements can be only MAX_STATEMENT_LENGTH (300) chars long -> therefore input strings have also max length
  const hasValidLength = data.every(
    (str) => str.length <= MAX_INPUT_STRING_LENGTH
  );
  if (!hasValidLength) {
    throw new InvalidInputError(
      "Invalid input: string is too long for statement"
    );
  }

  // parse input to batches, then commands
  const batches = createBatches(data);
  const commands = batches.map(
    (batch) =>
      new ExecuteStatementCommand({
        statement: batch.getRememberStatement(),
      })
  );

  // execute commands sequentially (to preserve order) with max attempts
  for (const command of commands) {
    let attempt = 0;
    while (attempt < EXECUTE_COMMAND_MAX_RETRY) {
      attempt++;
      try {
        await executeCommand(rememberer, command);
        break;
      } catch (error) {
        if (error instanceof Error) {
          console.error(`Command execute error: ${error.message}`);
        } else {
          console.error("Command execute error: unknown");
        }
      }
    }

    if (attempt >= EXECUTE_COMMAND_MAX_RETRY) {
      throw new RememberError("Remembering reached max attempts");
    }
  }

  return;
}
