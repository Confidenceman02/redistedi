import { assert, expect } from "chai";
import {
  Schema,
  string,
  number,
  boolean,
  BoolPrimitiveFalse,
  BoolPrimitiveTrue,
} from "@redistedi/schema";
import { ModelID, rediBuilder } from "..";
import { RedisClientType, createClient } from "redis";

const REDISTEDI_PORT = "6376";
const REDISTEDI_IP = "localhost";
const REDISTEDI_PASSWORD = "somepassword";

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

  it("returns Success Exit", async () => {
    const obj = { hello: string() };
    const schema = new Schema(obj);
    const builder = rediBuilder(schema, "someModelName", client);

    const SUT = new builder({ hello: "world" });

    const returnVal = await SUT.save();

    assert.include(returnVal, { _tag: "Success" });
  });

  it("returns a StediModel object", async () => {
    const obj = { hello: string() };
    const schema = new Schema(obj);
    const builder = rediBuilder(schema, "someModelName", client);

    const SUT = new builder({ hello: "world" });

    const returnVal = await SUT.save();

    if (returnVal._tag == "Success") {
      return assert.deepEqual(returnVal.value.toObject(), {
        hello: "world",
        [ModelID]: 1,
      });
    }
    {
      expect.fail();
    }
  });

  it("returns a StediModel with an incremented ModelID", async () => {
    const obj = { hello: string() };
    const schema = new Schema(obj);
    const builder = rediBuilder(schema, "someModelName", client);

    const obj1 = new builder({ hello: "world" });
    const obj2 = new builder({ hello: "next world" });

    await obj1.save();
    const SUT = await obj2.save();

    if (SUT._tag == "Success") {
      return assert.deepEqual(SUT.value.toObject(), {
        hello: "next world",
        [ModelID]: 2,
      });
    }
    {
      expect.fail();
    }
  });

  it("persists model with StringType", async () => {
    const obj = { hello: string() };
    const schema = new Schema(obj);
    const builder = rediBuilder(schema, "someModelName", client);

    const obj1 = new builder({ hello: "world" });
    await obj1.save();

    const SUT = await client.HGETALL("rs:$entity$:someModelName:1");

    assert.deepEqual(SUT, { "rs:$entity$:$ID$": "1", hello: "world" });
  });

  it("persists model with NumberType", async () => {
    const obj = { position: number() };
    const schema = new Schema(obj);
    const builder = rediBuilder(schema, "modelName", client);

    const obj1 = new builder({ position: 2 });
    await obj1.save();

    const SUT = await client.HGETALL("rs:$entity$:modelName:1");

    assert.deepEqual(SUT, { "rs:$entity$:$ID$": "1", position: "2" });
  });

  it.skip("persists model with BooleanType", async () => {
    const obj = { position: boolean() };
    const schema = new Schema(obj);
    const builder = rediBuilder(schema, "modelName", client);

    const obj1 = new builder({ position: true });
    await obj1.save();

    const SUT = await client.HGETALL("rs:$entity$:modelName:1");

    assert.deepEqual(SUT, {
      "rs:$entity$:$ID$": "1",
      position: BoolPrimitiveTrue,
    });
  });
});
