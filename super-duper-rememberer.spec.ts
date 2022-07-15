import { DescribeStatementCommand, ExecuteStatementCommand, SuperDuperRememberer } from "./super-duper-rememberer";

jest.setTimeout(99999999);

let rememberer: SuperDuperRememberer;
beforeEach(() => {
  rememberer = new SuperDuperRememberer();
});

it("should successfully execute a statement", async () => {
  const command = await rememberer.executeCommand(
    new ExecuteStatementCommand({
      statement: "CAN YOU PLEASE REMEMBER THESE ITEMS? 'banana','orange','pomegranate' K THX BYE."
    })
  );
  expect(command).toEqual({
    id: expect.anything(),
    status: "RUNNING"
  });
  expect(rememberer.memory).toEqual([]);
  expect(await rememberer.executeCommand(new DescribeStatementCommand({id: command.id}))).toEqual({
    id: command.id,
    status: "RUNNING"
  });
  expect(rememberer.memory).toEqual([]);
  await new Promise(done => setTimeout(done, 10000)); // I wish SDR wasn't so slow..
  expect(await rememberer.executeCommand(new DescribeStatementCommand({id: command.id}))).toEqual({
    id: command.id,
    status: "DONE"
  });
  expect(rememberer.memory).toEqual(["banana", "orange", "pomegranate"]);
});

it("should fail invalid statement", async() => {
  const command = await rememberer.executeCommand(
    new ExecuteStatementCommand({
      statement: "CAN YOU PLEASE REMEMBER THESE ITEMS 'banana','orange','pomegranate' K THX BYE."
    })
  );
  expect(command).toEqual({
    id: expect.anything(),
    status: "RUNNING"
  });
  expect(rememberer.memory).toEqual([]);
  expect(await rememberer.executeCommand(new DescribeStatementCommand({id: command.id}))).toEqual({
    id: command.id,
    status: "RUNNING"
  });
  expect(rememberer.memory).toEqual([]);
  await new Promise(done => setTimeout(done, 10000)); // if only there was a better way to do this...
  expect(await rememberer.executeCommand(new DescribeStatementCommand({id: command.id}))).toEqual({
    id: command.id,
    status: "FAILED",
    error: "STATEMENT IS INVALID"
  });
  expect(rememberer.memory).toEqual([]);
});

it("should fail long statement", async() => {
  const command = await rememberer.executeCommand(
    new ExecuteStatementCommand({
      statement: "CAN YOU PLEASE REMEMBER THESE ITEMS? 'pneumonoultramicroscopicsilicovolcanoconiosis'," +
            "'pseudopseudohypoparathyroidism','floccinaucinihilipilification','antidisestablishmentarianism'," +
            "'supercalifragilisticexpialidocious','pneumonoultramicroscopicsilicovolcanoconiosis'," +
            "'hippopotomonstrosesquippedaliophobia' K THX BYE."
    })
  );
  expect(command).toEqual({
    id: expect.anything(),
    status: "RUNNING"
  });
  expect(rememberer.memory).toEqual([]);
  expect(await rememberer.executeCommand(new DescribeStatementCommand({id: command.id}))).toEqual({
    id: command.id,
    status: "RUNNING"
  });
  expect(rememberer.memory).toEqual([]);
  await new Promise(done => setTimeout(done, 10000)); // my god this is slow..
  expect(await rememberer.executeCommand(new DescribeStatementCommand({id: command.id}))).toEqual({
    id: command.id,
    status: "FAILED",
    error: "THERE'S NO WAY TO REMEMBER ALL THAT AT ONCE!"
  });
  expect(rememberer.memory).toEqual([]);
});