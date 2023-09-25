import {
  StringType,
  IntegerType,
  BooleanType,
  EnumType,
  ArrayType,
  BoolPrimitiveFalse,
  BoolPrimitiveTrue,
  ArrayPrimitivePrefixRef,
  ArrayConstrainedTypes,
  NullPrimitive,
  InferIngress,
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
  InferIngress,
} from "./schema";

export function string() {
  return new StringType();
}
export function integer() {
  return new IntegerType();
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
  integer,
  boolean,
  enum: enumValue,
};
