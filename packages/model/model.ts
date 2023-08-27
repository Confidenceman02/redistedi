import { Schema, ObjectShape, Infer } from "@redistedi/schema";

const schemaKey = Symbol("schemaKey");

export type IModel<T extends ObjectShape> = Infer<Schema<T>> & {
  [schemaKey]: Schema<T>;
};

export type Model<T extends ObjectShape> = {
  new (arg: Infer<Schema<T>>): IModel<T>;
};

export function modelBuilder<T extends ObjectShape>(
  schema: Schema<T>,
): Model<T> {
  function Model(this: IModel<T>, arg: Infer<Schema<T>>) {
    this[schemaKey] = schema;
    for (let key in arg) {
      const k = key as keyof Infer<Schema<T>>;
      this[k] = arg[key] as any;
    }
  }

  return Model as any as Model<T>;
}
