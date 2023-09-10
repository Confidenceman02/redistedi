export function HSETFunc() {
  return `
        local function buildCommand(keyPrefix,idPrefix,id,T)
          local values = {"HSET", keyPrefix .. id, idPrefix, id}
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
  idPrefix: string,
  id: string,
  refString: string,
) {
  return `buildCommand(${keyPrefix},${idPrefix},${id},${refString})`;
}

export function LogEncode(name: string) {
  return `
     redis.log(redis.LOG_WARNING, cjson.encode(${name}))
  `;
}
