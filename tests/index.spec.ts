import { expect, assert } from "chai";
import { RediStedi, RediStediError } from "../index";

const REDISTEDI_PORT = "6376";
const REDISTEDI_IP = "localhost";
const REDISTEDI_PASSWORD = "somepassword";

describe("redistedi", () => {
  it("produces TypeError with invalid URL", async () => {
    try {
      await new RediStedi().connect("someurl", "somepassword");
    } catch (err) {
      expect(err).to.be.instanceof(TypeError);
    }
  });
  it("produces RediStediError when conenction fails", async () => {
    try {
      await new RediStedi().connect("redis://localhost:6311", "somepassword");
    } catch (err) {
      expect(err).to.be.instanceof(RediStediError);
    }
  });
  it("establishes connection", async () => {
    const instance = new RediStedi();
    await instance.connect(
      `redis://${REDISTEDI_IP}:${REDISTEDI_PORT}`,
      REDISTEDI_PASSWORD
    );

    const SUT = instance.client();
    if (!SUT.ok) assert.fail();
    const response = await SUT.value.PING();

    expect(response).to.eq("PONG");
  });
});
