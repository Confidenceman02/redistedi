import { assert } from "chai";
import { modelBuilder } from "..";
import { Schema, string } from "@redistedi/schema";

describe("Model.toBject", () => {
  it("Turns model to a flat javascript object", () => {
    const schema = new Schema({ hello: string() });
    const instance = modelBuilder(schema, undefined);

    const SUT = new instance({ hello: "world" });

    assert.deepEqual(SUT.toObject(), { hello: "world" });
  });
});
