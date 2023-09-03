import { assert } from "chai";
import { Schema, string } from "@redistedi/schema";
import { rediBuilder, stediBuilder, ModelError, StediModel } from "..";
import * as Effect from "@effect/io/Effect";
import Sinon from "sinon";
import { RedisClientType, createClient } from "redis";

const REDISTEDI_PORT = "6376";
const REDISTEDI_IP = "localhost";
const REDISTEDI_PASSWORD = "somepassword";
const baseSchema = new Schema({ hello: string(), world: string() });
const baseModels = {
  helloWorld: baseSchema,
};
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
  let client: RedisClientType;
  before(async () => {
    client = createClient({
      url: `redis://${REDISTEDI_IP}:${REDISTEDI_PORT}`,
      password: REDISTEDI_PASSWORD,
    });
    await client.connect();
  });

  beforeEach(() => {
    client.FLUSHALL();
  });

  it("returns Failure when there is no conneciton", async () => {
    const obj = { hello: string() };
    const schema = new Schema(obj);
    const instance = rediBuilder(schema, "", undefined);

    const SUT = new instance({ hello: "world" });
    const returnVal = await SUT.save();

    assert.include(returnVal, { _tag: "Failure" });
  });
  // TODO This test is pointless make better
  it.only("returns Success Exit", async () => {
    const obj = { hello: string() };
    const schema = new Schema(obj);
    const stediInstance = stediBuilder(
      { hello: "world" },
      "someID",
      schema,
      undefined,
    );
    // const eff = Effect.tryPromise<StediModel<typeof obj>, ModelError>({
    // try: () => new Promise((resolve) => resolve(new stediInstance())),
    // catch: (unknown) => new ModelError(unknown),
    // });
    const builder = rediBuilder(schema, "someModelName", client);

    const SUT = new builder({ hello: "world" });
    // Sinon.stub(SUT, "save").returns(Effect.runPromiseExit(eff));

    const returnVal = await SUT.save();

    assert.include(returnVal, { _tag: "Success" });
  });
});
