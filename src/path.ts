export function jsonPath(keys: string[]): string {
  let result = "$"
  for (let i = 0; i < keys.length; i++) {
    const key = keys[i]
    // Check if it's a numeric index
    let isNumeric = true
    for (let j = 0; j < key.length; j++) {
      const c = key.charCodeAt(j)
      if (c < 48 || c > 57) {
        isNumeric = false
        break
      }
    }
    if (key.length > 0 && isNumeric) {
      result = result + "[" + key + "]"
    } else {
      result = result + "." + key
    }
  }
  return result
}
