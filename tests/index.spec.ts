import { expect, assert } from "chai";
import { RediStedi, RediStediError } from "../index";
import { createClient } from "redis";
import { Schema, string } from "@redistedi/schema";

const REDISTEDI_PORT = "6376";
const REDISTEDI_IP = "localhost";
const REDISTEDI_PASSWORD = "somepassword";

const baseSchema = new Schema({ hello: string(), world: string() });

const baseModels = {
  helloWorld: baseSchema,
};

describe("RediStedi.connection", () => {
  it("produces TypeError with invalid URL", async () => {
    try {
      await new RediStedi(baseModels).connection(
        createClient({ url: "someurl", password: "somepassword" }),
      );
    } catch (err) {
      expect(err).to.be.instanceof(TypeError);
    }
  });
  it("produces RediStediError when connection fails", async () => {
    try {
      await new RediStedi(baseModels).connection(
        createClient({
          url: "redis://localhost:6311",
          password: "somepassword",
        }),
      );
    } catch (err) {
      expect(err).to.be.instanceof(RediStediError);
    }
  });
  it("establishes connection PING", async () => {
    const instance = new RediStedi(baseModels);
    // const helloModel = instance.model("helloWorld");
    // const int = new helloModel({ hello: "Hello", world: "World" });
    await instance.connection(
      createClient({
        url: `redis://${REDISTEDI_IP}:${REDISTEDI_PORT}`,
        password: REDISTEDI_PASSWORD,
      }),
    );

    const SUT = instance.client();
    if (!SUT.ok) assert.fail();
    const response = await SUT.value.PING();

    expect(response).to.eq("PONG");
  });
});
