import { assert } from "chai";
import { modelBuilder } from "..";
import { Schema, string } from "@redistedi/schema";

describe("Model.toObject", () => {
  it("turns model in to a flat javascript object", () => {
    const schema = new Schema({ hello: string() });
    const instance = modelBuilder(schema, undefined);

    const SUT = new instance({ hello: "world" });

    assert.deepEqual(SUT.toObject(), { hello: "world" });
  });
});

describe("Model.toJSON", () => {
  it("turns model in to a JSON string", () => {
    const schema = new Schema({ hello: string() });
    const instance = modelBuilder(schema, undefined);

    const SUT = new instance({ hello: "world" });

    assert.equal(JSON.stringify(SUT), '"{\\"hello\\":\\"world\\"}"');
  });
});
