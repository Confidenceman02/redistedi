import {
  Type as ZodType,
  Infer as ZodInfer,
  AnyType as ZodAnyType,
  number as ZodNumber,
  string as ZodString,
  boolean as ZodBoolean,
  enum as ZodEnum,
  NullableType as ZodNullableType,
} from "@redistedi/zod";

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

const zodShape = Symbol("zodShape");

type ObjectShape = {
  [key: string]: AnyType;
};

type AnyType = Type<any>;

type ValueOf<T> = T[keyof T];

type SchemaZodType<T> = {
  [k in keyof T]: ZodAnyType;
};

export type Infer<T> = T extends AnyType
  ? T extends Type<infer K>
    ? K
    : any
  : T;

abstract class Type<T> {
  private [zodShape]: ZodType<T>;
  constructor(zShape: ZodAnyType) {
    this[zodShape] = zShape;
  }
  nullable(): NullableType<this>;
  nullable(): any {
    if (this instanceof NullableType) {
      return clone(this);
    }
    return new NullableType(this);
  }
  zodShape(): ZodType<T>;
  zodShape(): ZodType<T> {
    return this[zodShape];
  }
}

export class NullableType<T extends AnyType> extends Type<Infer<T> | null> {
  constructor(readonly schema: T) {
    let arg: ZodType<ZodAnyType>;
    if (schema.zodShape() instanceof ZodNullableType) {
      arg = schema.zodShape();
    } else {
      arg = new ZodNullableType(schema.zodShape());
    }
    super(arg);
  }
}

export class StringType extends Type<string> {
  constructor() {
    super(ZodString());
  }
}

export class NumberType extends Type<number> {
  constructor() {
    super(ZodNumber());
  }
}

export class BooleanType extends Type<boolean> {
  constructor() {
    super(ZodBoolean());
  }
}

export class EnumType<T> extends Type<ValueOf<T>> {
  constructor(enumeration: T) {
    super(ZodEnum(enumeration));
  }
}

export class Schema<T extends ObjectShape> {
  private [zodShape]: SchemaZodType<T>;
  constructor(readonly objectShape: T) {
    this[zodShape] = (
      Object.keys(objectShape) as Array<keyof typeof objectShape>
    ).reduce((acc, key) => {
      acc[key] = objectShape[key].zodShape();
      return acc;
    }, {} as SchemaZodType<T>);
  }
}
