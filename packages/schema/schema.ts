import {
  AnyType as ZodAnyType,
  number as ZodNumber,
  string as ZodString,
  boolean as ZodBoolean,
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

export type Infer<T> = T extends AnyType
  ? T extends Type<infer K>
    ? K
    : any
  : T;

abstract class Type<T> {
  private [zodShape]: ZodAnyType;
  constructor(zShape: ZodAnyType) {
    this[zodShape] = zShape;
  }
  nullable(): NullableType<this>;
  nullable(): any {
    if (this instanceof NullableType) {
      return clone(this);
    }
    this[zodShape] = new ZodNullableType(this[zodShape]);
    return new NullableType(this);
  }
  zodShape(): ZodAnyType;
  zodShape(): ZodAnyType {
    return this[zodShape];
  }
}

export class NullableType<T extends AnyType> extends Type<Infer<T> | null> {
  constructor(readonly schema: T) {
    super(new ZodNullableType(schema.zodShape()));
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

export class Schema<T extends ObjectShape> {
  constructor(private readonly objectShape: T) {}
}
