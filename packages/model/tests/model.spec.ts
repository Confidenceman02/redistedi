import { assert } from "chai";
import { Schema, string } from "@redistedi/schema";
import { ModelId, modelBuilder } from "..";

describe("Model.toObject", () => {
  it("turns model in to a flat javascript object", () => {
    const schema = new Schema({ hello: string() });
    const instance = modelBuilder(schema, undefined);

    const SUT = new instance({ hello: "world" });

    assert.deepEqual(SUT.toObject(), { hello: "world", _modelId: undefined });
  });
  it("includes the _modelId", () => {
    const schema = new Schema({ hello: string() });
    const instance = modelBuilder(schema, undefined);

    const SUT = new instance({ hello: "world" });
    SUT[ModelId] = "1234";

    assert.deepEqual(SUT.toObject(), { hello: "world", _modelId: "1234" });
  });
});

describe("Model.toJSON", () => {
  it("turns model in to a JSON string", () => {
    const schema = new Schema({ hello: string() });
    const instance = modelBuilder(schema, undefined);

    const SUT = new instance({ hello: "world" });

    assert.equal(
      JSON.stringify(SUT),
      '"{\\"hello\\":\\"world\\",\\"_modelId\\":null}"'
    );
  });
  it("includes _modelId when present", () => {
    const schema = new Schema({ hello: string() });
    const instance = modelBuilder(schema, undefined);

    const SUT = new instance({ hello: "world" });
    SUT[ModelId] = "1234";

    assert.equal(
      JSON.stringify(SUT),
      '"{\\"hello\\":\\"world\\",\\"_modelId\\":\\"1234\\"}"'
    );
  });
});
