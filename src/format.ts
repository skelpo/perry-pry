export function formatNumber(n: number): string {
  if (n < 1000) return "" + n
  if (n < 1000000) {
    const thousands = Math.floor(n / 1000)
    const remainder = n % 1000
    if (remainder === 0) return thousands + ",000"
    if (remainder < 10) return thousands + ",00" + remainder
    if (remainder < 100) return thousands + ",0" + remainder
    return thousands + "," + remainder
  }
  const millions = Math.floor(n / 1000000)
  const rest = n % 1000000
  const thousands = Math.floor(rest / 1000)
  const ones = rest % 1000
  let result = "" + millions + ","
  if (thousands < 10) result = result + "00" + thousands
  else if (thousands < 100) result = result + "0" + thousands
  else result = result + thousands
  result = result + ","
  if (ones < 10) result = result + "00" + ones
  else if (ones < 100) result = result + "0" + ones
  else result = result + ones
  return result
}

export function formatBytes(n: number): string {
  if (n < 1024) return n + " B"
  if (n < 1024 * 1024) {
    const kb = Math.floor(n / 102.4) / 10
    return kb + " KB"
  }
  const mb = Math.floor(n / (1024 * 102.4)) / 10
  return mb + " MB"
}

export function formatTime(ms: number): string {
  if (ms < 1) return "<1ms"
  if (ms < 1000) return Math.floor(ms) + "ms"
  const s = Math.floor(ms / 100) / 10
  return s + "s"
}

export function truncateString(s: string, max: number): string {
  if (s.length <= max) return s
  return s.substring(0, max - 1) + "…"
}
