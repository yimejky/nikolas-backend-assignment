import { SuperDuperRememberer } from "./super-duper-rememberer";
import { rememberData } from "./client";

jest.setTimeout(99999999);

describe("SDR client test", () => {
  // small english letters (a-z)
  const alphabet = "abcdefghijklmnopqrstuvwxyz";
  const genRandomStr = (min: number, max: number) => {
    const length = Math.floor(Math.random() * (max - min + 1)) + min;
    return [...new Array(length)]
      .map(() => alphabet[Math.floor(Math.random() * alphabet.length)])
      .join("");
  };

  let rememberer: SuperDuperRememberer;
  beforeEach(() => {
    rememberer = new SuperDuperRememberer();
  });

  it("should test a-z chars in input", async () => {
    const data = [
      alphabet,
      "randomtest",
      "kezenwbuub",
      "wwlefhkqyngvdceagfxe",
      "xynatwtcljgvmmgnhpad",
    ];

    const promise = rememberData(rememberer, data);

    await expect(promise).resolves.not.toThrow();
    expect(rememberer.memory).toEqual(data);
  });

  it("should fail with different chars than a-z in input", async () => {
    const symbols = "-$ /{\\@&*(){}[]";
    const digits = "123456789";
    const upperAlphabet = alphabet.toUpperCase();
    const data = [
      `${symbols}${alphabet}`,
      `${symbols}${upperAlphabet}`,
      `${digits}${alphabet}`,
    ];

    const promise = rememberData(rememberer, data);

    await expect(promise).rejects.toThrow(
      "Invalid input: expecting small english letters(a-z)"
    );
  });

  it("should fail with empty string", async () => {
    const data = ["", "", ""];

    const promise = rememberData(rememberer, data);

    await expect(promise).rejects.toThrow(
      "Invalid input: expecting small english letters(a-z)"
    );
  });

  it("should fail with empty input", async () => {
    const data: string[] = [];

    const promise = rememberData(rememberer, data);

    await expect(promise).rejects.toThrow(
      "Invalid input: input array is empty"
    );
  });

  it("should correctly handle larger number of input strings", async () => {
    const numberOfStrings = 125;
    const randomStringsLength = 20;
    const stringMaxLen = 3;
    // approx 125 * (3 + 2) + 124 = 749 chars + statement length
    const randomStrings = [...new Array(randomStringsLength)].map(() =>
      genRandomStr(stringMaxLen, stringMaxLen)
    );
    const data = [...new Array(numberOfStrings)].map(
      () => randomStrings[Math.floor(Math.random() * randomStrings.length)]
    );

    const promise = rememberData(rememberer, data);

    await expect(promise).resolves.not.toThrow();
    expect(rememberer.memory).toEqual(data);
  });

  it("should remember items in the same order as they appear in the calls order", async () => {
    const data0 = [alphabet, "randomcawcwaawawcvxvgjhklawcawtest"];
    const data1 = [
      "xwawacawcacawcawcawcawwcaw",
      "wwlefhkcawcawcawqyngvdceagfxe",
      "xynatwtcljgcawcawcawhykipioseddfghyiyuoipvmmgnhpad",
    ];

    const promise0 = rememberData(rememberer, data0);
    await expect(promise0).resolves.not.toThrow();
    const promise1 = rememberData(rememberer, data1);
    await expect(promise1).resolves.not.toThrow();

    const merged = [...data0, ...data1];
    expect(rememberer.memory).toEqual(merged);
  });

  it("should fail with too long string in input", async () => {
    const longString = genRandomStr(800, 1000);
    const data = [longString];

    const promise = rememberData(rememberer, data);

    await expect(promise).rejects.toThrow(
      "Invalid input: string is too long for statement"
    );
  });
});
