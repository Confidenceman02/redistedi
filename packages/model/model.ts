import { Schema, ObjectShape, Infer } from "@redistedi/schema";
import { RedisClientType } from "redis";
import { Exit } from "@effect/io/Exit";
import * as Effect from "@effect/io/Effect";
import { pipe } from "@effect/data/Function";

const schemaKey = Symbol("schemaKey");
const connectionKey = Symbol("connectionKey");
const objectKeys = Symbol("objectKeys");
const entityIDPrefixKey = Symbol("entityIDPrefixKey");
export const ModelID = Symbol("ModelId");

type IdxPrefix = "rs:$entity$:";
type EntityCounterPrefix = `${IdxPrefix}$counter$:${string}`;
type EntityIDPrefix = `${IdxPrefix}${string}:`;

export type StediModel<T extends ObjectShape> = Infer<Schema<T>> & {
  toObject(): StediObject<T>;
  toJSON(): string;
  [ModelID]: string;
  [schemaKey]: Schema<T>;
  [connectionKey]: RedisClientType | undefined;
  [objectKeys]: [keyof Infer<Schema<T>>];
};

type IRediModel<T extends ObjectShape> = Infer<Schema<T>> & {
  toObject(): ModelObject<T>;
  toJSON(): string;
  save(): Promise<Exit<ModelError, StediModel<T>>>;
  [schemaKey]: Schema<T>;
  [connectionKey]: RedisClientType | undefined;
  [objectKeys]: [keyof Infer<Schema<T>>];
  [entityIDPrefixKey]: EntityIDPrefix;
};

export type RediModel<T extends ObjectShape> = {
  new (arg: Infer<Schema<T>>): IRediModel<T>;
};
export type StediModelBuilder<T extends ObjectShape> = {
  new (): StediModel<T>;
};

export type ModelObject<T extends ObjectShape> = Infer<Schema<T>>;
export type StediObject<T extends ObjectShape> = Infer<Schema<T>> & {
  [ModelID]: string;
};

export function stediBuilder<T extends ObjectShape>(
  obj: Infer<Schema<T>>,
  id: string,
  schema: Schema<T>,
  connection: RedisClientType | undefined,
): StediModelBuilder<T> {
  function Stedi(this: StediModel<T>) {
    this[ModelID] = id;
    this[schemaKey] = schema;
    this[connectionKey] = connection;
    this[objectKeys] = Object.keys(obj) as [keyof Infer<Schema<T>>];
    for (let key in obj) {
      const k = key as keyof Infer<Schema<T>>;
      this[k] = obj[key] as any;
    }
  }

  return Stedi as any as StediModelBuilder<T>;
}

export function rediBuilder<T extends ObjectShape>(
  schema: Schema<T>,
  name: string,
  connection: RedisClientType | undefined,
): RediModel<T> {
  function Redi(this: IRediModel<T>, arg: Infer<Schema<T>>) {
    this[schemaKey] = schema;
    this[connectionKey] = connection;
    this[objectKeys] = Object.keys(arg) as [keyof Infer<Schema<T>>];
    this[entityIDPrefixKey] = `rs:$entity$:${name}:`;
    for (let key in arg) {
      const k = key as keyof Infer<Schema<T>>;
      this[k] = arg[key] as any;
    }

    this.toObject = function () {
      let obj = this[objectKeys].reduce(
        (acc, key) => {
          acc[key] = this[key];
          return acc;
        },
        {} as Infer<Schema<T>>,
      );
      return obj;
    };

    this.toJSON = function () {
      return JSON.stringify(this.toObject());
    };

    this.save = async function () {
      const stediInstance = stediBuilder(
        this.toObject(),
        this[entityIDPrefixKey],
        this[schemaKey],
        this[connectionKey],
      );
      const { script, inputs } = luaEntityCreate(
        [`rs:$entity$:$counter$:${name}`, `rs:$entity$:${name}:`],
        [this.toJSON()],
      );

      const persist = Effect.tryPromise<unknown, ModelError>({
        try: () => {
          if (!this[connectionKey])
            throw new ModelError("RedisClientType is undefined");
          return this[connectionKey].EVAL(script, inputs);
        },
        catch: (unknown) => new ModelError(unknown),
      });

      const mappedPersisted = pipe(
        persist,
        Effect.map(arrayReply),
        Effect.map(console.log),
      );

      await Effect.runPromise(mappedPersisted);

      const ret = Effect.tryPromise<StediModel<T>, ModelError>({
        try: () => {
          if (!this[connectionKey])
            throw new ModelError("RedisClientType is undefined");
          return new Promise((resolve) => resolve(new stediInstance()));
        },
        catch: (unknown) => new ModelError(unknown),
      });

      return await Effect.runPromiseExit(ret);
    };
  }

  return Redi as any as RediModel<T>;
}

// LUA

function luaEntityCreate(
  keys: [EntityCounterPrefix, EntityIDPrefix],
  argv: Array<any>,
) {
  return {
    script: `
        local insert = table.insert
        local counterID = KEYS[1]
        local entityIDPrefix = KEYS[2]
        local decodedObj = cjson.decode(ARGV[1])

        --[[
          1 - Get the next entityID
        --]]

        local incrID = redis.pcall('INCR', counterID)

        --[[
          2 - Prepare HSET args
        --]]

        ${luaHSET.func}

        --[[
          3 - Persist
        --]]

        local builtArgs = ${luaHSET.prepare(
          "entityIDPrefix .. incrID",
          "decodedObj",
        )}
        local ret = redis.pcall(unpack(builtArgs))

        ${luaLogEncode("KEYS")}

        return ret
    `,
    inputs: { keys, arguments: argv },
  };
}

function luaLogEncode(name: string) {
  return `
     redis.log(redis.LOG_WARNING, cjson.encode(${name}))
  `;
}

const luaHSET = {
  func: `
        local function buildCommand(id, T)
          local values = {"HSET", id}
          for k,v in pairs(T) do 
            insert(values, k)
            insert(values, v)
          end
          return values
        end
    `,
  prepare: (id: string, refString: string) => {
    return `buildCommand("${id}",${refString})`;
  },
};

export class ModelError extends Error {
  readonly _tag: string = "ModelError";
  constructor(err: any) {
    super(err);
    this.name = this.constructor.name;
  }
}

// UTILS
function arrayReply(a: unknown): Array<unknown> {
  if (Array.isArray(a)) return a;
  return [a];
}
