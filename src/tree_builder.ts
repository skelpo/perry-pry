import { Text, HStack, widgetAddChild, textSetFontSize, textSetColor } from "perry/ui"
import { buildNode, buildClosingBracket } from "./tree_node"

const MAX_ARRAY_DISPLAY = 100

function isArray(v: any): boolean {
  if (v === null) return false
  if (typeof v !== "object") return false
  const s = JSON.stringify(v)
  return s[0] === "["
}

export function buildTree(
  container: any,
  key: string,
  value: any,
  pathStr: string,
  depth: number,
  expandedNodes: string[],
  onToggle: (path: string) => void,
  searchQuery: string,
  matchPaths: string[],
  currentMatchPath: string,
): void {
  if (value === null || typeof value !== "object") {
    // Primitive at root or leaf
    buildNode(container, key, value, pathStr, depth, false, false, onToggle, searchQuery, matchPaths, currentMatchPath)
    return
  }

  if (isArray(value)) {
    const isExpanded = isNodeExpanded(expandedNodes, pathStr)
    buildNode(container, key, value, pathStr, depth, isExpanded, true, onToggle, searchQuery, matchPaths, currentMatchPath)

    if (isExpanded) {
      const limit = value.length > MAX_ARRAY_DISPLAY ? MAX_ARRAY_DISPLAY : value.length
      for (let i = 0; i < limit; i++) {
        const childPath = pathStr + "[" + i + "]"
        const childKey = "" + i
        const child = value[i]
        if (child !== null && typeof child === "object") {
          buildTree(container, childKey, child, childPath, depth + 1, expandedNodes, onToggle, searchQuery, matchPaths, currentMatchPath)
        } else {
          buildNode(container, childKey, child, childPath, depth + 1, false, false, onToggle, searchQuery, matchPaths, currentMatchPath)
        }
      }
      if (value.length > MAX_ARRAY_DISPLAY) {
        buildMorePlaceholder(container, depth + 1, value.length - MAX_ARRAY_DISPLAY)
      }
      buildClosingBracket(container, depth, true)
    }
    return
  }

  // Object — use for...in instead of Object.keys (Perry codegen bug)
  const isExpanded = isNodeExpanded(expandedNodes, pathStr)
  buildNode(container, key, value, pathStr, depth, isExpanded, true, onToggle, searchQuery, matchPaths, currentMatchPath)

  if (isExpanded) {
    for (const k in value) {
      const childPath = pathStr + "." + k
      const child = value[k]
      if (child !== null && typeof child === "object") {
        buildTree(container, k, child, childPath, depth + 1, expandedNodes, onToggle, searchQuery, matchPaths, currentMatchPath)
      } else {
        buildNode(container, k, child, childPath, depth + 1, false, false, onToggle, searchQuery, matchPaths, currentMatchPath)
      }
    }
    buildClosingBracket(container, depth, false)
  }
}

function buildMorePlaceholder(container: any, depth: number, remaining: number): void {
  let indent = ""
  for (let j = 0; j < depth; j++) {
    indent = indent + "  "
  }
  const moreRow = HStack(0, [])
  const indentT = Text(indent + "  ")
  textSetFontSize(indentT, 13)
  widgetAddChild(moreRow, indentT)
  const moreText = Text("... and " + remaining + " more items")
  textSetFontSize(moreText, 13)
  textSetColor(moreText, 0.5, 0.5, 0.5, 1.0)
  widgetAddChild(moreRow, moreText)
  widgetAddChild(container, moreRow)
}

function isNodeExpanded(expandedNodes: string[], path: string): boolean {
  for (let i = 0; i < expandedNodes.length; i++) {
    if (expandedNodes[i] === "*") return true
    if (expandedNodes[i] === path) return true
  }
  return false
}

// Perry workaround: .push() on string arrays doesn't work reliably.
// Build a JSON string of paths and parse it.
export function collectAllPaths(value: any, pathStr: string): string[] {
  // Must use JSON.parse to get heap-allocated array (Perry stack-allocation bug)
  const paths: string[] = JSON.parse('[]')
  collectPathsRecursive(value, pathStr, paths)
  return paths
}

function collectPathsRecursive(value: any, pathStr: string, paths: string[]): void {
  if (value === null || typeof value !== "object") return
  paths.push(pathStr)
  if (isArray(value)) {
    for (let i = 0; i < value.length; i++) {
      const child = value[i]
      collectPathsRecursive(child, pathStr + "[" + i + "]", paths)
    }
  } else {
    for (const k in value) {
      const child = value[k]
      collectPathsRecursive(child, pathStr + "." + k, paths)
    }
  }
}
