import {
  StringType,
  NumberType,
  BooleanType,
  EnumType,
  ArrayType,
  BoolPrimitiveFalse,
  BoolPrimitiveTrue,
  ArrayPrimitivePrefixRef,
  ArrayConstrainedTypes,
  NullPrimitive,
} from "./schema";

export {
  StringType,
  Schema,
  ObjectShape,
  Infer,
  ExtractObjectShape,
  BoolPrimitiveTrue,
  BoolPrimitiveFalse,
  ArrayPrimitivePrefixRef,
  NullPrimitive,
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
export function array<T extends ArrayConstrainedTypes>(schema: T) {
  return new ArrayType(schema);
}
export default {
  string,
  number,
  boolean,
  enum: enumValue,
};
