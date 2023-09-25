import {
  Type as ZType,
  AnyType as ZAnyType,
  number as ZNumber,
  string as ZString,
  boolean as ZBoolean,
  enum as ZEnum,
  array as ZArray,
  NullableType as ZNullableType,
  StringType as ZStringType,
  NumberType as ZNumberType,
  EnumType as ZEnumType,
  object as ZObject,
  Infer as ZInfer,
} from "@redistedi/zod";
import { InferObjectShape, MappedType } from "@redistedi/zod/types";

function clone<T>(value: T): T {
  if (typeof value !== "object" || value === null) {
    return value;
  }
  if (Array.isArray(value)) {
    return value.map((elem) => clone(elem)) as any;
  }
  const cpy: any = Object.create(null);
  for (const k in value) {
    cpy[k] = clone(value[k]);
  }
  for (const s of Object.getOwnPropertySymbols(value)) {
    cpy[s] = clone((value as any)[s]);
  }
  Object.setPrototypeOf(cpy, Object.getPrototypeOf(value));
  return cpy;
}

type NullPrimitiveType = "rs:$entity$:$primitive$:null";
type BoolPrimitiveType = `rs:$entity$:$primitive$:$bool$:${boolean}`;
type ArrayPrimitivePrefixRefType = `rs:$entity$:$primitive$:$array$:`;
export const ArrayPrimitivePrefixRef: ArrayPrimitivePrefixRefType =
  "rs:$entity$:$primitive$:$array$:";
export const NullPrimitive: NullPrimitiveType = "rs:$entity$:$primitive$:null";
export const BoolPrimitiveTrue: BoolPrimitiveType =
  "rs:$entity$:$primitive$:$bool$:true";
export const BoolPrimitiveFalse: BoolPrimitiveType =
  "rs:$entity$:$primitive$:$bool$:false";

const zodShape = Symbol("zodShape");
const zodIngressObject = Symbol("zodIngressShape");

export type ExtractObjectShape<T> = T extends Schema<infer S> ? S : never;

type ExtractZodObjectType<T> = {
  [key in keyof T]: T[key] extends AnyType
    ? T[key] extends Type<infer Z>
      ? ReturnType<Type<Z>["zodShape"]>
      : never
    : never;
};
type ExtractZodIngressObjectType<T> = {
  [key in keyof T]: T[key] extends AnyType
    ? T[key] extends Type<infer Z>
      ? ReturnType<Type<Z>["ingressShape"]>
      : never
    : never;
};

export type ObjectShape = {
  [key: string]: AnyType;
};

export type AnyType = Type<any>;

type ValueOf<T> = T[keyof T];

export type Infer<T> = T extends Schema<infer Z>
  ? ZInfer<ZType<InferObjectShape<ExtractZodObjectType<Z>>>>
  : never;
export type InferIngress<T> = T extends Schema<infer Z>
  ? ZInfer<ZType<InferObjectShape<ExtractZodIngressObjectType<Z>>>>
  : never;

type InternalInfer<T> = T extends AnyType
  ? T extends Type<infer K>
    ? K
    : any
  : T;

abstract class Type<T> {
  private [zodShape]: ZType<T>;
  constructor(zShape: ZAnyType) {
    this[zodShape] = zShape;
  }
  nullable(): NullableType<this>;
  nullable(): any {
    if (this instanceof NullableType) {
      return clone(this);
    }
    return new NullableType(this);
  }
  zodShape(): ZType<T>;
  zodShape(): ZType<T> {
    return this[zodShape];
  }

  abstract ingressShape(): ZAnyType;
}

export class NullableType<
  T extends AnyType,
> extends Type<InternalInfer<T> | null> {
  constructor(private readonly schema: T) {
    let arg: ZType<ZAnyType>;
    if (schema.zodShape() instanceof ZNullableType) {
      arg = schema.zodShape();
    } else {
      arg = new ZNullableType(schema.zodShape());
    }
    super(arg);
  }

  ingressShape(): ZAnyType {
    if (this.schema instanceof StringType)
      return this.zodShape().map((val) => {
        if (val !== null) return val;
        return NullPrimitive;
      });
    if (this.schema instanceof IntegerType)
      return this.zodShape().map((val) => {
        if (val !== null) return val;
        return NullPrimitive;
      });
    if (this.schema instanceof BooleanType) {
      const s = this.schema;
      return this.zodShape().map((val) => {
        if (val !== null) return s.ingressShape().parse(val);
        return NullPrimitive;
      });
    }
    if (this.schema instanceof EnumType) {
      const s = this.schema;
      return this.zodShape().map((val) => {
        if (val !== null) return s.ingressShape().parse(val);
        return NullPrimitive;
      });
    }
    if (this.schema instanceof ArrayType) {
      const s = this.schema;
      return this.zodShape().map((val) => {
        if (val !== null) return s.ingressShape().parse(val);
        return NullPrimitive;
      });
    }

    const newShape = this.schema as any as NullableType<AnyType>;

    return new NullableType(newShape.schema).ingressShape();
  }
}

export class StringType extends Type<string> {
  constructor() {
    super(ZString());
  }
  ingressShape(): ZStringType {
    return ZString();
  }
}

export class IntegerType extends Type<number> {
  constructor() {
    super(ZNumber());
  }
  ingressShape(): ZNumberType {
    return ZNumber().withPredicate(
      isInt,
      (v) =>
        `${v} can not be represented in IntegerType, use FloatType instead.`,
    );
  }
}

export class BooleanType extends Type<boolean> {
  constructor() {
    super(ZBoolean());
  }
  ingressShape(): MappedType<string> {
    return ZBoolean().map((pred) => {
      if (pred) return BoolPrimitiveTrue as string;
      return BoolPrimitiveFalse;
    });
  }
}

export class EnumType<T> extends Type<ValueOf<T>> {
  constructor(private readonly enumeration: T) {
    super(ZEnum(enumeration));
  }
  ingressShape(): ZEnumType<T> {
    return ZEnum(this.enumeration);
  }
}

export type ArrayConstrainedTypes = StringType;

export class ArrayType<T extends ArrayConstrainedTypes> extends Type<
  InternalInfer<T>[]
> {
  constructor(readonly schema: T) {
    super(ZArray(schema.zodShape()));
  }
  ingressShape(): MappedType<string> {
    return this.zodShape().map(() => ArrayPrimitivePrefixRef as string);
  }
}

export class Schema<T extends ObjectShape> {
  private [zodShape]: ZType<InferObjectShape<ExtractZodObjectType<T>>>;
  private [zodIngressObject]: ExtractZodIngressObjectType<T>;
  constructor(readonly objectShape: T) {
    let ingress = {} as any;
    const obj: ExtractZodObjectType<T> = Object.keys(objectShape).reduce(
      (acc, key) => {
        ingress[key] = objectShape[key].ingressShape();
        acc[key] = objectShape[key].zodShape();
        return acc;
      },
      {} as any,
    );

    this[zodShape] = ZObject(obj);
    this[zodIngressObject] = ingress as ExtractZodIngressObjectType<T>;
  }

  parse(value: unknown): Infer<Schema<T>> {
    return this[zodShape].parse(value);
  }

  parseIngress(value: unknown): InferIngress<Schema<T>> {
    return ZObject(this[zodIngressObject]).parse(value);
  }
}

// UTILS
function isInt(n: number) {
  return n % 1 === 0;
}
