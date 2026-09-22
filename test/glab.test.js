import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { glabStatus } from "../lib/glab.js";
describe("glab", () => {
  it("status shape", async () => { assert.equal((await glabStatus()).ok, true); });
});
