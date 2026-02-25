import {
  App, HStack, Text, Button, ScrollView,
  VStackWithInsets,
  textSetColor, textSetFontSize, textSetFontWeight,
  buttonSetBordered, textfieldFocus,
  scrollviewSetChild, scrollviewSetOffset,
  widgetAddChild, widgetClearChildren,
  addKeyboardShortcut,
  clipboardRead,
} from "perry/ui"
import { buildTree } from "./tree_builder"
import { findMatches } from "./search"
import { buildSearchBar } from "./search_bar"
import { buildStatusBar } from "./status_bar"
import { buildErrorView } from "./error_view"
import { parseJsonInput } from "./json_parser"

// --- State ---
let currentData: any = null
let expanded: string[] = JSON.parse('["$"]')
let searchQuery = ""
let matchPaths: string[] = JSON.parse('[]')
let currentMatchIndex = 0
let lastNodeCount = 0
let lastByteSize = 0
let lastParseTimeMs = 0
let lastError = ""
let lastRawText = ""
let parseOk = true
let searchBarVisible = false
let searchField: any = null
let showAbout = true

// --- Layout ---
// Wrapper holds toolbar (persistent) + search bar (toggle) + tree content (rebuilt).
const wrapper = VStackWithInsets(2, 4, 8, 4, 8)
const toolbarRow = HStack(6)
const searchBarContainer = VStackWithInsets(0, 0, 0, 0, 0)
const treeContent = VStackWithInsets(2, 0, 0, 0, 0)
widgetAddChild(wrapper, toolbarRow)
widgetAddChild(wrapper, searchBarContainer)
widgetAddChild(wrapper, treeContent)
const scroll = ScrollView()
scrollviewSetChild(scroll, wrapper)

// --- Toolbar buttons ---
function makeToolbarButton(label: string, callback: any): any {
  const btn = Button(label, callback)
  textSetFontSize(btn, 15)
  return btn
}

const btnPaste = makeToolbarButton("Paste", () => { handlePaste() })
const btnSample = makeToolbarButton("Sample", () => { handleLoadTest() })
const btnSearch = makeToolbarButton("Search", () => { handleSearch() })
const btnExpandAll = makeToolbarButton("Expand", () => { handleExpandAll() })
const btnCollapseAll = makeToolbarButton("Collapse", () => { handleCollapseAll() })

widgetAddChild(toolbarRow, btnPaste)
widgetAddChild(toolbarRow, btnSample)
widgetAddChild(toolbarRow, btnSearch)
widgetAddChild(toolbarRow, btnExpandAll)
widgetAddChild(toolbarRow, btnCollapseAll)

// --- Helpers ---
function resetExpanded(): void {
  expanded = JSON.parse('["$"]')
}

function currentMatchPath(): string {
  if (matchPaths.length === 0) return ""
  if (currentMatchIndex < 0) return ""
  if (currentMatchIndex >= matchPaths.length) return ""
  return matchPaths[currentMatchIndex]
}

// Toggle expand/collapse on a node path.
function togglePath(p: string): void {
  let json = "["
  let first = true
  let found = false
  for (let i = 0; i < expanded.length; i++) {
    if (expanded[i] === p) {
      found = true
    } else {
      if (!first) json = json + ","
      json = json + JSON.stringify(expanded[i])
      first = false
    }
  }
  if (!found) {
    if (!first) json = json + ","
    json = json + JSON.stringify(p)
  }
  json = json + "]"
  expanded = JSON.parse(json)
  rebuild()
}

// Ensure all parent paths of pathStr are expanded.
function expandParents(pathStr: string): void {
  let json = "["
  let first = true
  for (let i = 0; i < expanded.length; i++) {
    if (!first) json = json + ","
    json = json + JSON.stringify(expanded[i])
    first = false
  }
  for (let i = 1; i < pathStr.length; i++) {
    const ch = pathStr[i]
    if (ch === "." || ch === "[") {
      const parent = pathStr.substring(0, i)
      let found = false
      for (let j = 0; j < expanded.length; j++) {
        if (expanded[j] === parent) {
          found = true
          break
        }
      }
      if (!found) {
        if (!first) json = json + ","
        json = json + JSON.stringify(parent)
        first = false
      }
    }
  }
  json = json + "]"
  expanded = JSON.parse(json)
}

// --- About view ---
function buildAboutView(container: any): void {
  const title = Text("Pry")
  textSetFontSize(title, 28)
  textSetFontWeight(title, 28, 1.0)
  widgetAddChild(container, title)

  const subtitle = Text("A native Android JSON viewer")
  textSetFontSize(subtitle, 15)
  textSetColor(subtitle, 0.5, 0.5, 0.5, 1.0)
  widgetAddChild(container, subtitle)

  const spacer1 = Text(" ")
  textSetFontSize(spacer1, 10)
  widgetAddChild(container, spacer1)

  const tech = Text("Built with Perry \u2014 TypeScript compiled to native ARM64")
  textSetFontSize(tech, 13)
  textSetColor(tech, 0.4, 0.4, 0.4, 1.0)
  widgetAddChild(container, tech)

  const author = Text("by Skelpo GmbH")
  textSetFontSize(author, 13)
  textSetColor(author, 0.4, 0.4, 0.4, 1.0)
  widgetAddChild(container, author)

  const spacer2 = Text(" ")
  textSetFontSize(spacer2, 16)
  widgetAddChild(container, spacer2)

  const hint1 = Text("Paste    Load JSON from clipboard")
  textSetFontSize(hint1, 13)
  textSetColor(hint1, 0.5, 0.5, 0.5, 1.0)
  widgetAddChild(container, hint1)

  const hint2 = Text("Sample   Load example JSON data")
  textSetFontSize(hint2, 13)
  textSetColor(hint2, 0.5, 0.5, 0.5, 1.0)
  widgetAddChild(container, hint2)

  const hint3 = Text("Search   Find keys and values")
  textSetFontSize(hint3, 13)
  textSetColor(hint3, 0.5, 0.5, 0.5, 1.0)
  widgetAddChild(container, hint3)

  const hint4 = Text("Expand / Collapse   Show or hide all nodes")
  textSetFontSize(hint4, 13)
  textSetColor(hint4, 0.5, 0.5, 0.5, 1.0)
  widgetAddChild(container, hint4)
}

// --- Rebuild ---
function rebuild(): void {
  widgetClearChildren(treeContent)

  // Status bar
  if (currentData !== null) {
    const bar = buildStatusBar(lastNodeCount, lastByteSize, lastParseTimeMs)
    widgetAddChild(treeContent, bar)
  }

  // Error view
  if (!parseOk) {
    buildErrorView(treeContent, lastError, lastRawText)
    return
  }

  // Empty / About state
  if (currentData === null && parseOk) {
    if (showAbout) {
      buildAboutView(treeContent)
    } else {
      const emptyMsg = Text("Tap Paste to load JSON from clipboard")
      textSetFontSize(emptyMsg, 15)
      textSetColor(emptyMsg, 0.5, 0.5, 0.5, 1.0)
      widgetAddChild(treeContent, emptyMsg)
    }
    return
  }

  // Tree
  buildTree(treeContent, "", currentData, "$", 0, expanded, togglePath, searchQuery, matchPaths, currentMatchPath())

  // Scroll to top after rebuilding
  scrollviewSetOffset(scroll, 0)
}

// Show/hide search bar
function showSearchBar(): void {
  widgetClearChildren(searchBarContainer)
  searchField = buildSearchBar(
    searchBarContainer,
    matchPaths.length,
    currentMatchIndex,
    onSearchQueryChange,
    onSearchNext,
    onSearchPrev,
  )
}

function hideSearchBar(): void {
  widgetClearChildren(searchBarContainer)
  searchField = null
}

// --- Load data ---
function loadData(text: string): void {
  lastRawText = text
  const result = parseJsonInput(text)
  if (result.ok) {
    parseOk = true
    currentData = result.value
    lastNodeCount = result.nodeCount
    lastByteSize = result.byteSize
    lastParseTimeMs = result.parseTimeMs
    lastError = ""
    resetExpanded()
    searchQuery = ""
    matchPaths = JSON.parse('[]')
    currentMatchIndex = 0
  } else {
    parseOk = false
    currentData = null
    lastNodeCount = 0
    lastByteSize = result.byteSize
    lastParseTimeMs = result.parseTimeMs
    lastError = result.error
  }
  showAbout = false
  searchBarVisible = false
  hideSearchBar()
  rebuild()
}

// --- Search ---
function onSearchQueryChange(text: string): void {
  searchQuery = text
  if (searchQuery.length > 0 && currentData !== null) {
    matchPaths = findMatches(currentData, searchQuery, "$")
    currentMatchIndex = 0
    if (matchPaths.length > 0) {
      expandParents(matchPaths[0])
    }
  } else {
    matchPaths = JSON.parse('[]')
    currentMatchIndex = 0
  }
  rebuild()
}

function onSearchNext(): void {
  if (matchPaths.length === 0) return
  currentMatchIndex = currentMatchIndex + 1
  if (currentMatchIndex >= matchPaths.length) {
    currentMatchIndex = 0
  }
  expandParents(matchPaths[currentMatchIndex])
  rebuild()
  showSearchBar()
}

function onSearchPrev(): void {
  if (matchPaths.length === 0) return
  currentMatchIndex = currentMatchIndex - 1
  if (currentMatchIndex < 0) {
    currentMatchIndex = matchPaths.length - 1
  }
  expandParents(matchPaths[currentMatchIndex])
  rebuild()
  showSearchBar()
}

// --- Action handlers ---

function handlePaste(): void {
  console.log("Paste: loading from clipboard")
  const text = clipboardRead()
  if (text.length > 0) {
    loadData(text)
  }
}

const TEST_JSON = '{"name":"Test User","age":42,"active":true,"address":null,"scores":[100,85,92],"profile":{"email":"test@example.com","bio":"This is a really long string that should be truncated at some point because it exceeds eighty characters in length for testing purposes","tags":["developer","tester"],"nested":{"deep":{"value":"found it"}}},"empty_array":[],"empty_object":{}}'

function handleLoadTest(): void {
  console.log("Sample: loading test data")
  loadData(TEST_JSON)
}

function handleSearch(): void {
  console.log("Search: toggling search bar")
  if (searchBarVisible) {
    searchBarVisible = false
    searchQuery = ""
    matchPaths = JSON.parse('[]')
    currentMatchIndex = 0
    hideSearchBar()
    rebuild()
  } else {
    searchBarVisible = true
    showSearchBar()
    if (searchField !== null) {
      textfieldFocus(searchField)
    }
  }
}

function handleExpandAll(): void {
  console.log("Expand all")
  if (currentData !== null) {
    expanded = JSON.parse('["*"]')
    rebuild()
  }
}

function handleCollapseAll(): void {
  console.log("Collapse all")
  resetExpanded()
  rebuild()
}

// --- Keyboard shortcuts (for Android with external keyboard) ---
addKeyboardShortcut("v", 1, () => { handlePaste() })
addKeyboardShortcut("l", 1, () => { handleLoadTest() })
addKeyboardShortcut("f", 1, () => { handleSearch() })
addKeyboardShortcut("1", 1, () => { handleExpandAll() })
addKeyboardShortcut("2", 1, () => { handleCollapseAll() })

// --- Initial state ---
resetExpanded()
rebuild()

console.log("Pry Android ready")

App({
  title: "Pry",
  width: 0,
  height: 0,
  body: scroll,
})
