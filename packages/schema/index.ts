import {
  StringType,
  NumberType,
  BooleanType,
  EnumType,
  ArrayType,
  AnyType,
} from "./schema";

export {
  StringType,
  Schema,
  ObjectShape,
  AnyType,
  Infer,
  ExtractObjectShape,
} from "./schema";

export function string() {
  return new StringType();
}
export function number() {
  return new NumberType();
}
export function boolean() {
  return new BooleanType();
}
function enumValue<T>(e: T) {
  return new EnumType(e);
}
export function array<T extends AnyType>(schema: T) {
  return new ArrayType(schema);
}
export default {
  string,
  number,
  boolean,
  enum: enumValue,
};
