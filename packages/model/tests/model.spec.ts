import { assert } from "chai";
import { Schema, string } from "@redistedi/schema";
import { rediBuilder, stediBuilder, ModelError, StediModel } from "..";
import * as Effect from "@effect/io/Effect";
import * as Cause from "@effect/io/Cause";
import Sinon from "sinon";

describe("RediModel.toObject", () => {
  it("turns model in to a flat javascript object", () => {
    const schema = new Schema({ hello: string() });
    const instance = rediBuilder(schema, "", undefined);

    const SUT = new instance({ hello: "world" });

    assert.deepEqual(SUT.toObject(), { hello: "world" });
  });
});

describe("RediModel.toJSON", () => {
  it("turns model in to a JSON string", () => {
    const schema = new Schema({ hello: string() });
    const instance = rediBuilder(schema, "", undefined);

    const SUT = new instance({ hello: "world" });

    assert.equal(JSON.stringify(SUT), '"{\\"hello\\":\\"world\\"}"');
  });
});

describe("RediModel.save", () => {
  it("returns Failure when there is no conneciton", async () => {
    const obj = { hello: string() };
    const schema = new Schema(obj);
    const instance = rediBuilder(schema, "", undefined);

    const SUT = new instance({ hello: "world" });
    const returnVal = await SUT.save();

    assert.include(returnVal, { _tag: "Failure" });
  });
  // TODO This test is pointless make better
  it.skip("returns Success Exit", async () => {
    const obj = { hello: string() };
    const schema = new Schema(obj);
    const stediInstance = stediBuilder(
      { hello: "world" },
      "someID",
      schema,
      undefined,
    );
    const eff = Effect.tryPromise<StediModel<typeof obj>, ModelError>({
      try: () => new Promise((resolve) => resolve(new stediInstance())),
      catch: (unknown) => new ModelError(unknown),
    });
    const builder = rediBuilder(schema, "someModelName", undefined);

    const SUT = new builder({ hello: "world" });
    Sinon.stub(SUT, "save").returns(Effect.runPromiseExit(eff));

    const returnVal = await SUT.save();

    assert.include(returnVal, { _tag: "Success" });
  });
});
