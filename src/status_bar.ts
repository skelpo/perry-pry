import { HStack, Text, Spacer, textSetFontSize, textSetColor } from "perry/ui"
import { formatNumber, formatBytes, formatTime } from "./format"

export function buildStatusBar(nodeCount: number, byteSize: number, parseTimeMs: number): any {
  let statusText = ""
  if (nodeCount > 0) {
    statusText = formatNumber(nodeCount) + " nodes  ·  " + formatBytes(byteSize) + "  ·  parsed in " + formatTime(parseTimeMs)
  }
  const label = Text(statusText)
  textSetFontSize(label, 11)
  textSetColor(label, 0.5, 0.5, 0.5, 1.0)

  const bar = HStack(8, [
    label,
    Spacer(),
  ])
  return bar
}
