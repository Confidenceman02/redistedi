import { assert } from "chai";
import {
  Schema,
  NumberType,
  StringType,
  BooleanType,
  EnumType,
  NullableType,
  ArrayType,
  BoolPrimitiveTrue,
  BoolPrimitiveFalse,
  ArrayPrimitivePrefixRef,
  NullPrimitive,
} from "../schema";
import {
  StringType as ZStringType,
  NumberType as ZNumberType,
  BooleanType as ZBooleanType,
  EnumType as ZEnumType,
  NullableType as ZNullableType,
  ArrayType as ZArrayType,
  MTypeClass as ZMTypeClass,
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
  it("BooleanType returns ZMTypeClass", () => {
    const SUT = new BooleanType();

    assert.instanceOf(SUT.ingressShape(), ZMTypeClass);
  });
  it("NullableType with StringType returns ZMTypeClass", () => {
    const SUT = new NullableType(new StringType());

    assert.instanceOf(SUT.ingressShape(), ZMTypeClass);
  });
  it("NullableType with NumberType returns ZMTypeClass", () => {
    const SUT = new NullableType(new NumberType());

    assert.instanceOf(SUT.ingressShape(), ZMTypeClass);
  });
  it("NullableType with BooleanType returns ZMTypeClass", () => {
    const SUT = new NullableType(new BooleanType());

    assert.instanceOf(SUT.ingressShape(), ZMTypeClass);
  });
  it("NullableType with EnumType returns ZMTypeClass", () => {
    enum SomeEnum {
      Hi,
      There,
    }
    const SUT = new NullableType(new EnumType(SomeEnum));

    assert.instanceOf(SUT.ingressShape(), ZMTypeClass);
  });
  it("NullableType with ArrayType returns ZMTypeClass", () => {
    const SUT = new NullableType(new ArrayType(new StringType()));

    assert.instanceOf(SUT.ingressShape(), ZMTypeClass);
  });
  it("NullableType with NullableType<StringType> returns ZMTypeClass", () => {
    const SUT = new NullableType(new NullableType(new StringType()));

    assert.instanceOf(SUT.ingressShape(), ZMTypeClass);
  });
  it("NullableType with NullableType<NumberType> returns ZMTypeClass", () => {
    const SUT = new NullableType(new NullableType(new NumberType()));

    assert.instanceOf(SUT.ingressShape(), ZMTypeClass);
  });
  it("NullableType with NullableType<EnumType> returns ZMTypeClass", () => {
    enum SomeEnum {
      Hi,
      There,
    }
    const SUT = new NullableType(new NullableType(new EnumType(SomeEnum)));

    assert.instanceOf(SUT.ingressShape(), ZMTypeClass);
  });
  it("NullableType with NullableType<Boolean> returns ZMTypeClass", () => {
    enum SomeEnum {
      Hi,
      There,
    }
    const SUT = new NullableType(new NullableType(new EnumType(SomeEnum)));

    assert.instanceOf(SUT.ingressShape(), ZMTypeClass);
  });
});

describe("ingressParse", () => {
  it("StringType returns parsed string", () => {
    const SUT = new StringType();

    assert.equal(SUT.ingressShape().parse("hello"), "hello");
  });
  it("NumberType returns parsed number", () => {
    const SUT = new NumberType();

    assert.equal(SUT.ingressShape().parse(42), 42);
  });
  it("BooleanType returns internal boolean primitive", () => {
    const SUT = new BooleanType();

    assert.equal(SUT.ingressShape().parse(true), BoolPrimitiveTrue);
    assert.equal(SUT.ingressShape().parse(false), BoolPrimitiveFalse);
  });
  it("indexed EnumType returns parsed number", () => {
    enum SomeEnum {
      Hi,
      There,
    }
    const SUT = new EnumType(SomeEnum);

    assert.equal(SUT.ingressShape().parse(SomeEnum.Hi), 0);
  });
  it("named EnumType returns parsed string", () => {
    enum SomeEnum {
      Hi = "hi",
      There = "there",
    }
    const SUT = new EnumType(SomeEnum);

    assert.equal(SUT.ingressShape().parse(SomeEnum.Hi), "hi");
  });
  it("ArrayType returns internal array prefix reference", () => {
    const SUT = new ArrayType(new StringType());

    assert.equal(
      SUT.ingressShape().parse(["hello", "world"]),
      ArrayPrimitivePrefixRef,
    );
  });
  it("NullableType with StringType returns internal null primitive when null", () => {
    const SUT = new NullableType(new StringType());

    assert.equal(SUT.ingressShape().parse(null), NullPrimitive);
  });
  it("NullableType with StringType returns parsed string", () => {
    const SUT = new NullableType(new StringType());

    assert.equal(SUT.ingressShape().parse("Hello World"), "Hello World");
  });
  it("NullableType with StringType returns error", () => {
    const SUT = new NullableType(new StringType());

    try {
      SUT.ingressShape().parse(12);
    } catch (err: unknown) {
      return assert.instanceOf(err, Error);
    }

    assert.fail("Non string type should have thrown.");
  });
  it("NullableType with ArrayType returns internal null primitive when null", () => {
    const SUT = new NullableType(new ArrayType(new StringType()));

    assert.equal(SUT.ingressShape().parse(null), NullPrimitive);
  });
  it("NullableType with ArrayType returns ArrayPrimitivePrefixRef", () => {
    const SUT = new NullableType(new ArrayType(new StringType()));

    assert.equal(
      SUT.ingressShape().parse(["Hello", "World"]),
      ArrayPrimitivePrefixRef,
    );
  });
  it("NullableType with ArrayType returns error", () => {
    const SUT = new NullableType(new ArrayType(new StringType()));

    try {
      SUT.ingressShape().parse([12]);
    } catch (err: unknown) {
      return assert.instanceOf(err, Error);
    }

    assert.fail("Non Array type should have thrown.");
  });
  it("NullableType with NumberType returns internal null primitive when null", () => {
    const SUT = new NullableType(new NumberType());

    assert.equal(SUT.ingressShape().parse(null), NullPrimitive);
  });
  it("NullableType with NumberType returns parsed number", () => {
    const SUT = new NullableType(new NumberType());

    assert.equal(SUT.ingressShape().parse(23), 23);
  });
  it("NullableType with NumberType returns error", () => {
    const SUT = new NullableType(new NumberType());

    try {
      SUT.ingressShape().parse([12]);
    } catch (err: unknown) {
      return assert.instanceOf(err, Error);
    }

    assert.fail("Non Array type should have thrown.");
  });
  it("NullableType with BooleanType returns internal null primitive when null", () => {
    const SUT = new NullableType(new BooleanType());

    assert.equal(SUT.ingressShape().parse(null), NullPrimitive);
  });
  it("NullableType with BooleanType returns BoolPrimitiveType", () => {
    const SUT = new NullableType(new BooleanType());

    assert.equal(SUT.ingressShape().parse(true), BoolPrimitiveTrue);
  });
  it("NullableType with EnumType returns internal null primitive when null", () => {
    enum SomeEnum {
      Hi = "hi",
      There = "there",
    }
    const SUT = new NullableType(new EnumType(SomeEnum));

    assert.equal(SUT.ingressShape().parse(null), NullPrimitive);
  });
  it("NullableType with EnumType returns parsed enum", () => {
    enum SomeEnum {
      Hi = "hi",
      There = "there",
    }
    const SUT = new NullableType(new EnumType(SomeEnum));

    assert.equal(SUT.ingressShape().parse(SomeEnum.There), "there");
  });
  it("NullableType with EnumType returns error", () => {
    enum SomeEnum {
      Hi = "hi",
      There = "there",
    }
    const SUT = new NullableType(new EnumType(SomeEnum));
    try {
      SUT.ingressShape().parse([12]);
    } catch (err: unknown) {
      return assert.instanceOf(err, Error);
    }

    assert.fail("Non Enum type should have thrown.");
  });
});

describe("Schema.parse", () => {
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

describe("Schema.parseIngress", () => {
  it("errors when invalid shape is parsed", () => {
    const obj = { hello: new StringType() };

    const SUT = new Schema(obj);

    try {
      SUT.parseIngress({});
    } catch (err) {
      assert.instanceOf(err, Error);
    }
  });
  it("validates an object with StringType", () => {
    const obj = { hello: new StringType() };

    const SUT = new Schema(obj);

    const result = SUT.parseIngress({ hello: "world" });

    assert.deepEqual(result, { hello: "world" });
  });
  it("validates an object with NumberType", () => {
    const obj = { hello: new NumberType() };

    const SUT = new Schema(obj);

    const result = SUT.parseIngress({ hello: 1234 });

    assert.deepEqual(result, { hello: 1234 });
  });
  it("validates an object with BooleanType", () => {
    const obj = { hello: new BooleanType() };

    const SUT = new Schema(obj);

    const result = SUT.parseIngress({ hello: true });

    assert.deepEqual(result, { hello: BoolPrimitiveTrue });
  });
  it("validates an object with NullableType<StringType>", () => {
    const obj = { hello: new StringType().nullable() };

    const SUT = new Schema(obj);

    const result1 = SUT.parseIngress({ hello: null });
    const result2 = SUT.parseIngress({ hello: "world" });

    assert.deepEqual(result1, { hello: NullPrimitive });
    assert.deepEqual(result2, { hello: "world" });
  });
  it("validates an object with ArrayType<StringType>", () => {
    const obj = { hello: new ArrayType(new StringType()) };

    const SUT = new Schema(obj);

    const result1 = SUT.parseIngress({ hello: ["world"] });

    assert.deepEqual(result1, { hello: ArrayPrimitivePrefixRef });
  });
});
