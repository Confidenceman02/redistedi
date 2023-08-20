import { expect, assert } from "chai";
import {
  Schema,
  NumberType,
  StringType,
  BooleanType,
  EnumType,
} from "../schema";

describe("schema", () => {
  it("is a StringType instance", () => {
    const SUT = new StringType();
    assert.instanceOf(SUT, StringType);
  });
});
