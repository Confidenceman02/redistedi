export function HSETFunc() {
  return `
        local function buildCommand(keyPrefix,idField,idValue,T)
          local values = {"HSET", keyPrefix .. idValue, idField, idValue}
          for k,v in pairs(T) do 
            insert(values, k)
            insert(values, v)
          end
          return values
        end
    `;
}

export function HSETPrepare(
  keyPrefix: string,
  idField: string,
  id: string,
  refString: string,
) {
  return `buildCommand(${keyPrefix},${idField},${id},${refString})`;
}

export function LogEncode(name: string) {
  return `
     redis.log(redis.LOG_WARNING, cjson.encode(${name}))
  `;
}
