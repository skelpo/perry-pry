function isArray(v: any): boolean {
  if (v === null) return false
  if (typeof v !== "object") return false
  const s = JSON.stringify(v)
  return s[0] === "["
}

export function findMatches(value: any, query: string, path: string): string[] {
  if (query.length === 0) return JSON.parse('[]')
  const lowerQuery = query.toLowerCase()
  // Must use JSON.parse to get heap-allocated array (Perry stack-allocation bug)
  const results: string[] = JSON.parse('[]')
  searchRecursive(value, lowerQuery, path, results)
  return results
}

function searchRecursive(value: any, lowerQuery: string, path: string, results: string[]): void {
  if (value === null) {
    if ("null".indexOf(lowerQuery) >= 0) {
      results.push(path)
    }
    return
  }
  if (typeof value === "boolean") {
    const s = value ? "true" : "false"
    if (s.indexOf(lowerQuery) >= 0) {
      results.push(path)
    }
    return
  }
  if (typeof value === "number") {
    const s = "" + value
    if (s.indexOf(lowerQuery) >= 0) {
      results.push(path)
    }
    return
  }
  if (typeof value === "string") {
    if (value.toLowerCase().indexOf(lowerQuery) >= 0) {
      results.push(path)
    }
    return
  }
  if (isArray(value)) {
    for (let i = 0; i < value.length; i++) {
      const childPath = path + "[" + i + "]"
      const indexStr = "" + i
      if (indexStr.indexOf(lowerQuery) >= 0) {
        results.push(childPath)
      } else {
        const child = value[i]
        searchRecursive(child, lowerQuery, childPath, results)
      }
    }
    return
  }
  if (typeof value === "object") {
    for (const k in value) {
      const childPath = path + "." + k
      if (k.toLowerCase().indexOf(lowerQuery) >= 0) {
        results.push(childPath)
      } else {
        const child = value[k]
        searchRecursive(child, lowerQuery, childPath, results)
      }
    }
    return
  }
}
