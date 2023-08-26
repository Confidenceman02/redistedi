import { Schema, ObjectShape } from "@redistedi/schema";

export class Model<T extends ObjectShape> {
  constructor(arg: Schema<T>) {}
}
