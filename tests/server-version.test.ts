import { describe, expect, test } from "bun:test";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { SERVER_VERSION } from "../src/server.ts";

describe("server metadata", () => {
  test("SERVER_VERSION matches package.json", () => {
    const pkg = JSON.parse(readFileSync(join(import.meta.dir, "..", "package.json"), "utf8")) as {
      version: string;
    };
    expect(SERVER_VERSION).toBe(pkg.version);
  });
});
