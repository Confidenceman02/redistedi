import { expect, assert } from "chai";
import {
  Schema,
  NumberType,
  StringType,
  BooleanType,
  EnumType,
  NullableType,
} from "../schema";
import {
  StringType as ZodStringType,
  NumberType as ZodNumberType,
  BooleanType as ZodBooleanType,
  EnumType as ZodEnumType,
  NullableType as ZodNullableType,
} from "@redistedi/zod";

describe("schema", () => {
  it("is a StringType instance", () => {
    const SUT = new StringType();

    assert.instanceOf(SUT, StringType);
  });
  it("is a StringType zod instance", () => {
    const SUT = new StringType().zodShape();

    assert.instanceOf(SUT, ZodStringType);
  });
  it("is a NumberType instance", () => {
    const SUT = new NumberType();

    assert.instanceOf(SUT, NumberType);
  });
  it("is a NumberType zod instance", () => {
    const SUT = new NumberType().zodShape();

    assert.instanceOf(SUT, ZodNumberType);
  });
  it("is a BooleanType instance", () => {
    const SUT = new BooleanType();

    assert.instanceOf(SUT, BooleanType);
  });
  it("is a BooleanType zod instance", () => {
    const SUT = new BooleanType().zodShape();

    assert.instanceOf(SUT, ZodBooleanType);
  });
  it("is a EnumType instance", () => {
    enum SomeEnum {
      Hi,
      There,
    }

    const SUT = new EnumType(SomeEnum);

    assert.instanceOf(SUT, EnumType);
  });
  it("is a EnumType zod instance", () => {
    enum SomeEnum {
      Hi,
      There,
    }

    const SUT = new EnumType(SomeEnum).zodShape();

    assert.instanceOf(SUT, ZodEnumType);
  });
  it("is a NullableType instance", () => {
    enum SomeEnum {
      Hi,
      There,
    }

    const SUT = new NullableType(new EnumType(SomeEnum));

    assert.instanceOf(SUT, NullableType);
  });
  it("is a NullableType zod instance", () => {
    enum SomeEnum {
      Hi,
      There,
    }

    const SUT = new NullableType(new EnumType(SomeEnum)).zodShape();

    assert.instanceOf(SUT, ZodNullableType);
  });
});
