import { Schema, ObjectShape, Infer } from "@redistedi/schema";
import { RedisClientType } from "redis";
import { Exit } from "@effect/io/Exit";
import * as Effect from "@effect/io/Effect";
import * as Context from "@effect/data/Context";
import {
  object as ZObject,
  string as ZString,
  Infer as ZInfer,
  number as ZNumber,
} from "@redistedi/zod";
import { pipe } from "@effect/data/Function";
import { HSETFunc, HSETPrepare, LogEncode } from "./lua";

const schemaKey = Symbol("schemaKey");
const connectionKey = Symbol("connectionKey");
const objectKeys = Symbol("objectKeys");
const entityIDPrefixKey = Symbol("entityIDPrefixKey");
export const ModelID = Symbol("ModelId");

const saveLuaReply = ZObject({ response: ZNumber(), id: ZNumber() });

type IdxPrefix = "rs:$entity$:";
type EntityCounterPrefix = `{${IdxPrefix}$counter$:${string}}`;
type EntityKeyPrefix = `{${IdxPrefix}${string}}:`;
type EntityIDField = `${IdxPrefix}$ID$`;

interface EvalOptions {
  keys?: Array<string>;
  arguments?: Array<string>;
}

interface PersistEntityService {
  connection: RedisClientType;
  keyPrefix: EntityKeyPrefix;
}
const PersistEntityService = Context.Tag<PersistEntityService>();

export type StediModel<T extends ObjectShape> = Infer<Schema<T>> & {
  toObject(): StediObject<T>;
  toJSON(): string;
  [ModelID]: number;
  [entityIDPrefixKey]: EntityKeyPrefix;
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
  [entityIDPrefixKey]: EntityKeyPrefix;
};

export type RediModel<T extends ObjectShape> = {
  new (arg: Infer<Schema<T>>): IRediModel<T>;
};
export type StediModelBuilder<T extends ObjectShape> = {
  new (): StediModel<T>;
};

export type ModelObject<T extends ObjectShape> = Infer<Schema<T>>;
export type StediObject<T extends ObjectShape> = Infer<Schema<T>> & {
  [ModelID]: number;
};

export function stediBuilder<T extends ObjectShape>(
  obj: Infer<Schema<T>>,
  id: number,
  entityIdPrefix: EntityKeyPrefix,
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
  modelName: string,
  connection: RedisClientType | undefined,
): RediModel<T> {
  function Redi(this: IRediModel<T>, arg: Infer<Schema<T>>) {
    this[schemaKey] = schema;
    this[connectionKey] = connection;
    this[objectKeys] = Object.keys(arg) as [keyof Infer<Schema<T>>];
    this[entityIDPrefixKey] = `{rs:$entity$:${modelName}}:`;
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
      const luaScriptArgs: [
        EntityCounterPrefix,
        EntityKeyPrefix,
        EntityIDField,
      ] = [
        `{rs:$entity$:$counter$:${modelName}}`,
        `{rs:$entity$:${modelName}}:`,
        "rs:$entity$:$ID$",
      ];

      const persistProgram = PersistEntityService.pipe(
        Effect.flatMap((service) =>
          toIngressJSON(this.toObject(), this[schemaKey]).pipe(
            Effect.flatMap((ingressJSON) => {
              const { script, inputs } = luaEntityCreate(luaScriptArgs, [
                ingressJSON,
              ]);
              return persist(service.connection, script, inputs);
            }),
            Effect.flatMap(toPersistReply),
            Effect.flatMap((reply) =>
              toStediInstance<T>(
                reply,
                this.toObject(),
                this[schemaKey],
                service,
              ),
            ),
          ),
        ),
      );
      const runnableProgram = Effect.provideService(
        persistProgram,
        PersistEntityService,
        PersistEntityService.of({
          connection: this[connectionKey],
          keyPrefix: this[entityIDPrefixKey],
        }),
      );

      return await Effect.runPromiseExit(runnableProgram);
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
  keys: [EntityCounterPrefix, EntityKeyPrefix, EntityIDField],
  argv: Array<string>,
) {
  return {
    script: `
        local insert = table.insert
        local counterID = KEYS[1]
        local entityKeyPrefix = KEYS[2]
        local entityIDField = KEYS[3]
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
          "entityKeyPrefix",
          "entityIDField",
          "incrID",
          "decodedObj",
        )}
        local response = redis.pcall(unpack(builtArgs))

        ${LogEncode("builtArgs")}

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
function toPersistReply(obj: unknown) {
  return Effect.try({
    try: () => {
      return pipe(ZString().parse(obj), JSON.parse, (a) =>
        saveLuaReply.parse(a),
      );
    },
    catch: (caught) => new ModelError(caught),
  });
}

function toIngressJSON<T extends ObjectShape>(
  obj: ModelObject<T>,
  schema: Schema<T>,
) {
  return Effect.try({
    try: () => {
      const parsed = schema.parseIngress(obj);
      return JSON.stringify(parsed);
    },
    catch: (caught) => new ModelError(caught),
  });
}

function toStediInstance<T extends ObjectShape>(
  reply: ZInfer<typeof saveLuaReply>,
  obj: ModelObject<T>,
  schema: Schema<T>,
  service: PersistEntityService,
) {
  const stediInstance = stediBuilder<T>(
    obj,
    reply.id,
    service.keyPrefix,
    schema,
    service.connection,
  );
  return Effect.succeed(new stediInstance());
}
