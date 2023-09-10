import {
  Type as ZType,
  AnyType as ZAnyType,
  number as ZNumber,
  string as ZString,
  boolean as ZBoolean,
  enum as ZEnum,
  array as ZArray,
  NullableType as ZNullableType,
  object as ZObject,
  Infer as ZInfer,
} from "@redistedi/zod";
import { InferObjectShape } from "@redistedi/zod/types";

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

const zodShapeEgress = Symbol("zodShapeEgress");

export type ExtractObjectShape<T> = T extends Schema<infer S> ? S : never;

type ExtractZodObjectType<T> = {
  [key in keyof T]: T[key] extends AnyType
    ? T[key] extends Type<infer Z>
      ? ReturnType<Type<Z>["zodShapeEgress"]>
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
type InternalInfer<T> = T extends AnyType
  ? T extends Type<infer K>
    ? K
    : any
  : T;

abstract class Type<T> {
  private [zodShapeEgress]: ZType<T>;
  constructor(zShapeEgress: ZAnyType) {
    this[zodShapeEgress] = zShapeEgress;
  }
  nullable(): NullableType<this>;
  nullable(): any {
    if (this instanceof NullableType) {
      return clone(this);
    }
    return new NullableType(this);
  }
  zodShapeEgress(): ZType<T>;
  zodShapeEgress(): ZType<T> {
    return this[zodShapeEgress];
  }
}

export class NullableType<
  T extends AnyType,
> extends Type<InternalInfer<T> | null> {
  constructor(readonly schema: T) {
    let arg: ZType<ZAnyType>;
    if (schema.zodShapeEgress() instanceof ZNullableType) {
      arg = schema.zodShapeEgress();
    } else {
      arg = new ZNullableType(schema.zodShapeEgress());
    }
    super(arg);
  }
}

export class StringType extends Type<string> {
  constructor() {
    super(ZString());
  }
}

export class NumberType extends Type<number> {
  constructor() {
    super(ZNumber());
  }
}

export class BooleanType extends Type<boolean> {
  constructor() {
    super(ZBoolean());
  }
}

export class EnumType<T> extends Type<ValueOf<T>> {
  constructor(enumeration: T) {
    super(ZEnum(enumeration));
  }
}

export class ArrayType<T extends AnyType> extends Type<InternalInfer<T>[]> {
  constructor(readonly schema: T) {
    super(ZArray(schema.zodShapeEgress()));
  }
}

export class Schema<T extends ObjectShape> {
  private [zodShapeEgress]: ZType<InferObjectShape<ExtractZodObjectType<T>>>;
  constructor(readonly objectShape: T) {
    const obj: ExtractZodObjectType<T> = Object.keys(objectShape).reduce(
      (acc, key) => {
        acc[key] = objectShape[key].zodShapeEgress();
        return acc;
      },
      {} as any,
    );

    this[zodShapeEgress] = ZObject(obj);
  }

  parse(value: unknown): Infer<Schema<T>> {
    return this[zodShapeEgress].parse(value);
  }
}
