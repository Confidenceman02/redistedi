import { Schema, ObjectShape, Infer } from "@redistedi/schema";
import { RedisClientType } from "redis";
import { Exit } from "@effect/io/Exit";
import * as Effect from "@effect/io/Effect";
import { pipe } from "@effect/data/Function";
import { HSETFunc, HSETPrepare, LogEncode } from "./lua";

const schemaKey = Symbol("schemaKey");
const connectionKey = Symbol("connectionKey");
const objectKeys = Symbol("objectKeys");
const entityIDPrefixKey = Symbol("entityIDPrefixKey");
export const ModelID = Symbol("ModelId");

type IdxPrefix = "rs:$entity$:";
type EntityCounterPrefix = `${IdxPrefix}$counter$:${string}`;
type EntityIDPrefix = `${IdxPrefix}${string}:`;

interface EvalOptions {
  keys?: Array<string>;
  arguments?: Array<string>;
}

export type StediModel<T extends ObjectShape> = Infer<Schema<T>> & {
  toObject(): StediObject<T>;
  toJSON(): string;
  [ModelID]: string;
  [entityIDPrefixKey]: EntityIDPrefix;
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
  entityIdPrefix: EntityIDPrefix,
  schema: Schema<T>,
  connection: RedisClientType | undefined,
): StediModelBuilder<T> {
  function Stedi(this: StediModel<T>) {
    this[ModelID] = id;
    this[entityIDPrefixKey] = entityIdPrefix;
    this[schemaKey] = schema;
    this[connectionKey] = connection;
    this[objectKeys] = Object.keys(obj) as [keyof Infer<Schema<T>>];
    for (let key in obj) {
      const k = key as keyof Infer<Schema<T>>;
      this[k] = obj[key] as any;
    }

    this.toObject = function () {
      let obj = this[objectKeys].reduce(
        (acc, key) => {
          acc[key] = this[key];
          return acc;
        },
        {} as Infer<Schema<T>>,
      );
      return Object.assign(obj, { [ModelID]: this[ModelID] });
    };
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
      if (!this[connectionKey])
        return Effect.runSyncExit(
          Effect.fail(new ModelError("Redis client is undefined")),
        );
      const { script, inputs } = luaEntityCreate(
        [`rs:$entity$:$counter$:${name}`, `rs:$entity$:${name}:`],
        [this.toJSON()],
      );
      const modelEffect = (_arrReply: Array<unknown>) => {
        const stediInstance = stediBuilder(
          this.toObject(),
          // TODO needs to be returned ID
          "1",
          this[entityIDPrefixKey],
          this[schemaKey],
          this[connectionKey],
        );
        return Effect.succeed(new stediInstance());
      };

      const effects = pipe(
        persist(this[connectionKey], script, inputs),
        Effect.map(HSETReply),
        Effect.flatMap(modelEffect),
      );

      return await Effect.runPromiseExit(effects);
    };
  }

  return Redi as any as RediModel<T>;
}

// SAVE
function persist(
  client: RedisClientType,
  script: string,
  options: EvalOptions,
) {
  return Effect.tryPromise<unknown, ModelError>({
    try: () => {
      return client.EVAL(script, options);
    },
    catch: (unknown) => new ModelError(unknown),
  });
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

        ${HSETFunc()}

        --[[
          3 - Persist
        --]]

        local builtArgs = ${HSETPrepare(
          "entityIDPrefix .. incrID",
          "decodedObj",
        )}
        local response = redis.pcall(unpack(builtArgs))

        ${LogEncode("KEYS")}

        local ret = {response = response, id = incrID}

        return cjson.encode(ret)
    `,
    inputs: { keys, arguments: argv },
  };
}

export class ModelError extends Error {
  readonly _tag: string = "ModelError";
  constructor(err: any) {
    super(err);
    this.name = this.constructor.name;
  }
}

// UTILS
function HSETReply(a: unknown): Array<unknown> {
  if (Array.isArray(a)) return a;
  return [a];
}
