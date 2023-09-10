export function HSETFunc() {
  return `
        local function buildCommand(id, T)
          local values = {"HSET", id}
          for k,v in pairs(T) do 
            insert(values, k)
            insert(values, v)
          end
          return values
        end
    `;
}

export function HSETPrepare(id: string, refString: string) {
  return `buildCommand("${id}",${refString})`;
}

export function LogEncode(name: string) {
  return `
     redis.log(redis.LOG_WARNING, cjson.encode(${name}))
  `;
}
