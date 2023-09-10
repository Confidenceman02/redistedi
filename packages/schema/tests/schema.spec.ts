import { assert } from "chai";
import {
  Schema,
  NumberType,
  StringType,
  BooleanType,
  EnumType,
  NullableType,
  ArrayType,
} from "../schema";
import {
  StringType as ZStringType,
  NumberType as ZNumberType,
  BooleanType as ZBooleanType,
  EnumType as ZEnumType,
  NullableType as ZNullableType,
  ArrayType as ZArrayType,
  UnionType as ZUnionType,
} from "@redistedi/zod";

describe("primitives", () => {
  it("is a StringType instance", () => {
    const SUT = new StringType();

    assert.instanceOf(SUT, StringType);
  });
  it("is a StringType zod instance", () => {
    const SUT = new StringType().zodShape();

    assert.instanceOf(SUT, ZStringType);
  });
  it("is a NumberType instance", () => {
    const SUT = new NumberType();

    assert.instanceOf(SUT, NumberType);
  });
  it("is a NumberType zod instance", () => {
    const SUT = new NumberType().zodShape();

    assert.instanceOf(SUT, ZNumberType);
  });
  it("is a BooleanType instance", () => {
    const SUT = new BooleanType();

    assert.instanceOf(SUT, BooleanType);
  });
  it("is a BooleanType zod instance", () => {
    const SUT = new BooleanType().zodShape();

    assert.instanceOf(SUT, ZBooleanType);
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

    assert.instanceOf(SUT, ZEnumType);
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

    assert.instanceOf(SUT, ZNullableType);
  });
  it("is a ArrayType instance", () => {
    const SUT = new ArrayType(new StringType());

    assert.instanceOf(SUT, ArrayType);
  });
  it("is a ArrayType zod instance", () => {
    const SUT = new ArrayType(new StringType()).zodShape();

    assert.instanceOf(SUT, ZArrayType);
  });
});

describe("ingressShape", () => {
  it("StringType returns ZStringType", () => {
    const SUT = new StringType();

    assert.instanceOf(SUT.ingressShape(), ZStringType);
  });
  it("NullableType with StringType returns ZStringType", () => {
    const SUT = new NullableType(new StringType());

    assert.instanceOf(SUT.ingressShape(), ZStringType);
  });
  it("NullableType with NumberType returns ZUnionType", () => {
    const SUT = new NullableType(new NumberType());

    assert.instanceOf(SUT.ingressShape(), ZUnionType);
  });
  it("NullableType with EnumType returns ZUnionType", () => {
    enum SomeEnum {
      Hi,
      There,
    }
    const SUT = new NullableType(new EnumType(SomeEnum));

    assert.instanceOf(SUT.ingressShape(), ZUnionType);
  });
  it("NullableType with ArrayType returns ZUnionType", () => {
    const SUT = new NullableType(new ArrayType(new StringType()));

    assert.instanceOf(SUT.ingressShape(), ZUnionType);
  });
  it("NullableType with NullableType<StringType> returns ZStringType", () => {
    const SUT = new NullableType(new NullableType(new StringType()));

    assert.instanceOf(SUT.ingressShape(), ZStringType);
  });
  // TODO test all NullableType nested cases
});

describe.skip("ingressShape.parse", () => {});

describe("Schema", () => {
  it("is a Schema instance", () => {
    const SUT = new Schema({});
    assert.instanceOf(SUT, Schema);
  });
  it("errors when invalid shape is parsed", () => {
    const obj = { hello: new StringType() };

    const SUT = new Schema(obj);

    try {
      SUT.parse({});
    } catch (err) {
      assert.instanceOf(err, Error);
    }
  });
  it("validates an object with StringType", () => {
    const obj = { hello: new StringType() };

    const SUT = new Schema(obj);

    const result = SUT.parse({ hello: "world" });

    assert.deepEqual(result, { hello: "world" });
  });
  it("validates an object with NumberType", () => {
    const obj = { hello: new NumberType() };

    const SUT = new Schema(obj);

    const result = SUT.parse({ hello: 1234 });

    assert.deepEqual(result, { hello: 1234 });
  });
  it("validates an object with BooleanType", () => {
    const obj = { hello: new BooleanType() };

    const SUT = new Schema(obj);

    const result = SUT.parse({ hello: true });

    assert.deepEqual(result, { hello: true });
  });
  it("validates an object with NullableType<StringType>", () => {
    const obj = { hello: new StringType().nullable() };

    const SUT = new Schema(obj);

    const result1 = SUT.parse({ hello: null });
    const result2 = SUT.parse({ hello: "world" });

    assert.deepEqual(result1, { hello: null });
    assert.deepEqual(result2, { hello: "world" });
  });
  it("validates an object with ArrayType<StringType>", () => {
    const obj = { hello: new ArrayType(new StringType()) };

    const SUT = new Schema(obj);

    const result1 = SUT.parse({ hello: ["world"] });

    assert.deepEqual(result1, { hello: ["world"] });
  });
});
