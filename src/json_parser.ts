export interface ParseResult {
  ok: boolean
  value: any
  nodeCount: number
  byteSize: number
  parseTimeMs: number
  error: string
}

function isArray(v: any): boolean {
  if (v === null) return false
  if (typeof v !== "object") return false
  const s = JSON.stringify(v)
  return s[0] === "["
}

function countNodes(value: any): number {
  if (value === null || value === undefined) return 1
  if (typeof value === "string" || typeof value === "number" || typeof value === "boolean") return 1
  if (isArray(value)) {
    let count = 1
    for (let i = 0; i < value.length; i++) {
      const child = value[i]
      count = count + countNodes(child)
    }
    return count
  }
  if (typeof value === "object") {
    let count = 1
    for (const k in value) {
      const child = value[k]
      count = count + countNodes(child)
    }
    return count
  }
  return 1
}

export function parseJsonInput(text: string): ParseResult {
  const byteSize = text.length
  const startTime = Date.now()
  try {
    const value = JSON.parse(text)
    const parseTimeMs = Date.now() - startTime
    const nodeCount = countNodes(value)
    return {
      ok: true,
      value: value,
      nodeCount: nodeCount,
      byteSize: byteSize,
      parseTimeMs: parseTimeMs,
      error: ""
    }
  } catch (e: any) {
    const parseTimeMs = Date.now() - startTime
    return {
      ok: false,
      value: null,
      nodeCount: 0,
      byteSize: byteSize,
      parseTimeMs: parseTimeMs,
      error: e.message || "Invalid JSON"
    }
  }
}
