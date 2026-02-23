import {
  HStack, Text, Button,
  textSetColor, textSetFontSize, textSetFontWeight,
  buttonSetBordered, textSetSelectable,
  widgetAddChild,
  menuCreate, menuAddItem, widgetSetContextMenu,
  clipboardWrite,
} from "perry/ui"
import { truncateString } from "./format"

// Inline colors — Perry doesn't correctly import cross-module export const numbers
// Strings: green
const STRING_R = 0.2
const STRING_G = 0.7
const STRING_B = 0.3
// Numbers: blue
const NUMBER_R = 0.3
const NUMBER_G = 0.5
const NUMBER_B = 0.9
// Booleans: orange
const BOOL_R = 0.9
const BOOL_G = 0.6
const BOOL_B = 0.2
// Null: gray
const NULL_R = 0.5
const NULL_G = 0.5
const NULL_B = 0.5
// Badges (collapsed containers): gray
const BADGE_R = 0.6
const BADGE_G = 0.6
const BADGE_B = 0.6
// Dimmed (search non-match): dark gray
const DIM_R = 0.4
const DIM_G = 0.4
const DIM_B = 0.4

function isArray(v: any): boolean {
  if (v === null) return false
  if (typeof v !== "object") return false
  const s = JSON.stringify(v)
  return s[0] === "["
}

export function buildNode(
  container: any,
  key: string,
  value: any,
  pathStr: string,
  depth: number,
  isExpanded: boolean,
  isContainer: boolean,
  onToggle: (path: string) => void,
  searchQuery: string,
  matchPaths: string[],
  currentMatchPath: string,
): void {
  // Build indent string
  let indent = ""
  for (let i = 0; i < depth; i++) {
    indent = indent + "  "
  }

  const row = HStack(0, [])

  // Indent
  if (indent.length > 0) {
    const indentText = Text(indent)
    textSetFontSize(indentText, 13)
    widgetAddChild(row, indentText)
  }

  // Toggle button for containers
  if (isContainer) {
    const toggleChar = isExpanded ? "▼" : "▶"
    const togglePath = pathStr
    const toggleBtn = Button(toggleChar, () => {
      onToggle(togglePath)
    })
    buttonSetBordered(toggleBtn, 0)
    widgetAddChild(row, toggleBtn)
  } else {
    // Small spacer for alignment
    const spacer = Text("  ")
    textSetFontSize(spacer, 13)
    widgetAddChild(row, spacer)
  }

  // Determine if this node is dimmed (search active but not matching)
  const isSearchActive = searchQuery.length > 0
  let isMatch = false
  let isCurrentMatch = false
  if (isSearchActive) {
    for (let i = 0; i < matchPaths.length; i++) {
      if (matchPaths[i] === pathStr) {
        isMatch = true
        break
      }
    }
    isCurrentMatch = pathStr === currentMatchPath
  }

  // Key label
  if (key.length > 0) {
    const keyLabel = Text(key + ": ")
    textSetFontSize(keyLabel, 13)
    textSetFontWeight(keyLabel, 13, 1.0)
    if (isSearchActive && !isMatch) {
      textSetColor(keyLabel, DIM_R, DIM_G, DIM_B, 1.0)
    } else if (isCurrentMatch) {
      textSetColor(keyLabel, 1.0, 0.9, 0.3, 1.0) // highlight yellow
    }
    widgetAddChild(row, keyLabel)
  }

  // Value display
  if (value === null) {
    const valText = Text("null")
    textSetFontSize(valText, 13)
    if (isSearchActive && !isMatch) {
      textSetColor(valText, DIM_R, DIM_G, DIM_B, 1.0)
    } else {
      textSetColor(valText, NULL_R, NULL_G, NULL_B, 1.0)
    }
    widgetAddChild(row, valText)
  } else if (typeof value === "boolean") {
    const valText = Text(value ? "true" : "false")
    textSetFontSize(valText, 13)
    if (isSearchActive && !isMatch) {
      textSetColor(valText, DIM_R, DIM_G, DIM_B, 1.0)
    } else {
      textSetColor(valText, BOOL_R, BOOL_G, BOOL_B, 1.0)
    }
    widgetAddChild(row, valText)
  } else if (typeof value === "number") {
    const valText = Text("" + value)
    textSetFontSize(valText, 13)
    if (isSearchActive && !isMatch) {
      textSetColor(valText, DIM_R, DIM_G, DIM_B, 1.0)
    } else {
      textSetColor(valText, NUMBER_R, NUMBER_G, NUMBER_B, 1.0)
    }
    widgetAddChild(row, valText)
  } else if (typeof value === "string") {
    const display = '"' + truncateString(value, 80) + '"'
    const valText = Text(display)
    textSetFontSize(valText, 13)
    textSetSelectable(valText, 1)
    if (isSearchActive && !isMatch) {
      textSetColor(valText, DIM_R, DIM_G, DIM_B, 1.0)
    } else {
      textSetColor(valText, STRING_R, STRING_G, STRING_B, 1.0)
    }
    widgetAddChild(row, valText)
  } else if (isArray(value)) {
    if (!isExpanded) {
      const badge = Text("[ " + value.length + " items ]")
      textSetFontSize(badge, 13)
      textSetColor(badge, BADGE_R, BADGE_G, BADGE_B, 1.0)
      widgetAddChild(row, badge)
    } else {
      const bracket = Text("[")
      textSetFontSize(bracket, 13)
      textSetColor(bracket, BADGE_R, BADGE_G, BADGE_B, 1.0)
      widgetAddChild(row, bracket)
    }
  } else if (typeof value === "object") {
    // Count keys using for...in (Object.keys crashes in Perry)
    let keyCount = 0
    for (const _k in value) {
      keyCount = keyCount + 1
    }
    if (!isExpanded) {
      const badge = Text("{ " + keyCount + " keys }")
      textSetFontSize(badge, 13)
      textSetColor(badge, BADGE_R, BADGE_G, BADGE_B, 1.0)
      widgetAddChild(row, badge)
    } else {
      const bracket = Text("{")
      textSetFontSize(bracket, 13)
      textSetColor(bracket, BADGE_R, BADGE_G, BADGE_B, 1.0)
      widgetAddChild(row, bracket)
    }
  }

  // Context menu — use pathStr directly (it's already in $.field[0].name format)
  const nodeValue = value
  const nodePath = pathStr
  const menu = menuCreate()
  menuAddItem(menu, "Copy Value", () => {
    if (typeof nodeValue === "string") {
      clipboardWrite(nodeValue)
    } else {
      clipboardWrite(JSON.stringify(nodeValue))
    }
  })
  menuAddItem(menu, "Copy Path", () => {
    clipboardWrite(nodePath)
  })
  menuAddItem(menu, "Copy Subtree", () => {
    clipboardWrite(JSON.stringify(nodeValue, null, 2))
  })
  widgetSetContextMenu(row, menu)

  widgetAddChild(container, row)
}

export function buildClosingBracket(
  container: any,
  depth: number,
  isArray: boolean,
): void {
  let indent = ""
  for (let i = 0; i < depth; i++) {
    indent = indent + "  "
  }
  const bracket = isArray ? "]" : "}"
  const row = HStack(0, [])
  if (indent.length > 0) {
    const indentText = Text(indent)
    textSetFontSize(indentText, 13)
    widgetAddChild(row, indentText)
  }
  // Spacer for alignment with toggle button
  const spacer = Text("  ")
  textSetFontSize(spacer, 13)
  widgetAddChild(row, spacer)

  const bracketText = Text(bracket)
  textSetFontSize(bracketText, 13)
  textSetColor(bracketText, 0.6, 0.6, 0.6, 1.0)
  widgetAddChild(row, bracketText)
  widgetAddChild(container, row)
}
