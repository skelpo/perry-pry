# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Pry is a native macOS JSON viewer built with the Perry framework. Perry compiles TypeScript to native ARM64 binaries — there is no Electron, no browser, no Node.js runtime. The app uses Perry's UI bindings which map directly to AppKit widgets.

## Build Commands

```bash
# Compile the main app (perry repo is expected to be a sibling directory)
cd /path/to/perry && cargo run --release -- compile /path/to/perry-pry/src/main.ts -o /path/to/perry-pry/pry

# Compile test harnesses
cd /path/to/perry && cargo run --release -- compile /path/to/perry-pry/src/test_tree.ts -o /path/to/perry-pry/test_tree
cd /path/to/perry && cargo run --release -- compile /path/to/perry-pry/src/minimal.ts -o /path/to/perry-pry/minimal

# Run the compiled binary
/path/to/perry-pry/pry
```

There is no test suite, linter, or package manager. The project is compiled entirely by the Perry compiler (a Rust program in the sibling `perry` repo).

## Architecture

The app is a single-window JSON tree viewer. `src/main.ts` is the entry point and contains the core app loop. The remaining `src/` files are utility modules:

- **main.ts** — Entry point. Sets up the scroll view, tree container, keyboard shortcuts, and calls `App()` (which blocks forever). Contains the original inline tree builder.
- **tree_node.ts** — `buildNode()` renders a single tree row (indent + toggle button + key + value + context menu). `buildClosingBracket()` renders `]` or `}`.
- **tree_builder.ts** — `buildTree()` recursively walks a JSON value and calls `buildNode` for each node. `collectAllPaths()` gathers all container paths for expand-all.
- **json_parser.ts** — `parseJsonInput()` wraps `JSON.parse` with timing, node counting, and error handling. Returns a `ParseResult`.
- **search.ts** — `findMatches()` recursively searches keys and values (case-insensitive) and returns matching path strings.
- **search_bar.ts** — `buildSearchBar()` creates the search UI row (text field + match counter + prev/next buttons).
- **status_bar.ts** — `buildStatusBar()` shows node count, byte size, and parse time.
- **error_view.ts** — `buildErrorView()` displays parse errors with a raw text preview.
- **colors.ts** — RGBA color constants for JSON types (string=green, number=blue, boolean=orange, null=gray).
- **format.ts** — Number/byte/time formatting and string truncation utilities.
- **path.ts** — `jsonPath()` builds JSONPath strings like `$.data.users[0].name` from key arrays.
- **clipboard.ts** — Thin wrappers around `perry/ui` clipboard functions.

Test harnesses (`test_tree.ts`, `test_scroll.ts`, `minimal.ts`) are standalone apps for testing specific features in isolation.

## Perry Framework Constraints

These are critical — violating them causes compiler or runtime errors:

- **`App()` must be the last statement.** It blocks the thread. Code after it never runs. `addKeyboardShortcut`, `appSetMinSize`, etc. must all be called before `App()`.
- **All imports must be static.** No `require()` — Perry is statically compiled.
- **No Set/Map types.** Use arrays with manual `indexOf`/linear scan instead.
- **Widget handles are opaque values** (NaN-boxed f64 or i64 pointers). Treat them as `any`.
- **Don't use `fs.readFileSync` inside `openFileDialog` callbacks** — causes i64/f64 type mismatch. Extract file reading to a separate function.
- **Colors are RGBA floats** in 0.0–1.0 range.
- **`textSetFontWeight(handle, fontSize, weight)`** — requires the fontSize parameter; weight 1.0 = bold.
- **`VStackWithInsets(spacing, top, left, bottom, right)`** — returns a handle; add children via `widgetAddChild`.
- **Keyboard modifier flags:** 1=Cmd, 2=Shift, 4=Option, 8=Control (bitwise OR to combine).

## UI Pattern

The app uses an imperative widget tree pattern (not declarative/reactive):
1. Create widget handles (`Text()`, `HStack()`, `Button()`, etc.)
2. Configure them (`textSetFontSize()`, `textSetColor()`, etc.)
3. Assemble via `widgetAddChild(parent, child)`
4. On state change, call `widgetClearChildren()` and rebuild the subtree

The tree view rebuilds by clearing all children from the container VStack and re-adding them from the parsed JSON data. Expand/collapse state is tracked as a `string[]` of expanded path strings (e.g., `["$", "$.config", "$.data[0]"]`).

# UI Testing with Geisterhand

This project uses [Geisterhand](https://github.com/Geisterhand-io/macos) for UI automation and testing.
All requests/responses use `snake_case` JSON.

**Required macOS permissions** (grant in System Settings > Privacy & Security):
- Accessibility (keyboard/mouse control)
- Screen Recording (screenshots)

## Starting the App Under Test

`geisterhand run` launches (or attaches to) an app and starts an HTTP server scoped to it. It prints a JSON line with the connection details, then blocks until the app quits:

```bash
# Launch pry and start Geisterhand server scoped to it
geisterhand run /path/to/perry-pry/pry &
# Output: {"app":"pry","host":"127.0.0.1","pid":12345,"port":49152}
# Parse PORT and PID from the JSON output
```

The server auto-selects a free port (use `--port` to pin one). All API requests are scoped to the target app's PID. When the target app terminates, the server exits automatically.

You can pass an app name (`Calculator`), bundle path (`/Applications/Safari.app`), bundle identifier, or a direct binary path. If the app is already running, Geisterhand attaches to it.

## Testing Workflow

1. **Start Geisterhand:** `geisterhand run /path/to/pry &` — note the `port` and `pid` from JSON output
2. **Verify permissions:** `GET http://127.0.0.1:$PORT/status`
3. **Inspect UI:** `GET http://127.0.0.1:$PORT/accessibility/tree?format=compact` to see what's on screen
4. **Interact:** click, type, press keys, trigger menus
5. **Assert:** take screenshots, read element values, wait for conditions
6. **Repeat**

## Key Patterns

- Prefer `/click/element` and `/accessibility/action` over coordinate-based `/click`
- Use `/wait` instead of `sleep` between steps
- Use `?format=compact` on `/accessibility/tree` for readable output
- Use `/screenshot` to capture the app's window (scoped automatically)
- Use background mode (`pid`, `path`, `use_accessibility_action`) when you don't want to steal focus
- Always pass `pid` (from `geisterhand run` output) when targeting a specific app

## API Quick Reference

All endpoints run on the host/port from the `geisterhand run` JSON output (e.g. `http://127.0.0.1:$PORT`).

| Action | Method | Endpoint | Key Params |
|--------|--------|----------|------------|
| Server status | GET | `/status` | - |
| Screenshot | GET | `/screenshot` | `app`, `format`, `windowId` |
| Click coordinates | POST | `/click` | `x`, `y`, `button`, `click_count`, `modifiers` |
| Click element | POST | `/click/element` | `title`, `title_contains`, `role`, `label`, `pid`, `use_accessibility_action` |
| Type text | POST | `/type` | `text`, `delay_ms`, `pid`\*, `path`\*, `role`\*, `title`\* |
| Press key | POST | `/key` | `key`, `modifiers`, `pid`\*, `path`\* |
| Scroll | POST | `/scroll` | `x`, `y`, `delta_x`, `delta_y`, `pid`\*, `path`\* |
| Wait for element | POST | `/wait` | `title`, `role`, `condition`, `timeout_ms` |
| UI tree | GET | `/accessibility/tree` | `pid`, `maxDepth`, `format` |
| Find elements | GET | `/accessibility/elements` | `role`, `title`, `titleContains`, `labelContains`, `valueContains`, `pid` |
| Focused element | GET | `/accessibility/focused` | `pid` |
| Perform action | POST | `/accessibility/action` | `path`, `action`, `value` |
| Get menus | GET | `/menu` | `app` |
| Trigger menu | POST | `/menu` | `app`, `path`, `background` |

\* = background mode param

## Core Concepts

### Element Paths

Every UI element has a `path` of the form `{"pid": 1234, "path": [0, 0, 1, 3]}`. This is an array of child indices from the app root. You get paths from `/accessibility/tree`, `/accessibility/elements`, or `/click/element` responses. Pass them to `/accessibility/action`, `/type`, `/key`, `/scroll` for targeted interaction.

Paths are stable within a session but change when the UI structure changes (windows open/close, views reload). Re-query if an action fails with a stale path.

### Foreground vs Background Mode

**Foreground (default):** Uses global CGEvents. The app must be frontmost.

**Background:** Uses accessibility APIs or AX-targeted keyboard events. The app stays behind other windows.

| Endpoint | How to Enable Background | Mechanism |
|----------|-------------------------|-----------|
| `/type` | Add `pid` + element query or `path` | Accessibility `setValue` (replaces entire field) |
| `/key` | Add `pid` | AXUIElement keyboard event posted to app |
| `/key` | Add `path` | Maps key to AX action (return/enter->confirm, escape->cancel, space->press) |
| `/scroll` | Add `pid` or `path` | PID-targeted scroll event |
| `/click/element` | Set `use_accessibility_action: true` | AX press action |
| `/menu` | Set `background: true` | AX menu trigger without `app.activate()` |
| `/screenshot` | Add `?app=Name` | ScreenCaptureKit window capture (works off-screen) |

### Wait Conditions

Use `/wait` instead of `sleep` to synchronize with UI state:

| Condition | Meaning |
|-----------|---------|
| `exists` (default) | Element appears in the UI |
| `not_exists` | Element disappears (e.g., loading spinner gone) |
| `enabled` | Element exists and is enabled (e.g., submit button becomes clickable) |
| `focused` | Element exists and has focus |

Timeout defaults to 5000ms (max 60000ms). Poll interval defaults to 100ms.

### Common Accessibility Roles

| Role | What It Is |
|------|-----------|
| `AXButton` | Buttons |
| `AXTextField` | Single-line text input |
| `AXTextArea` | Multi-line text input |
| `AXStaticText` | Label / static text |
| `AXWindow` | Window |
| `AXSheet` | Sheet/dialog |
| `AXMenuItem` | Menu item |
| `AXImage` | Image |
| `AXTable` | Table |
| `AXRow` | Table row |
| `AXToolbar` | Toolbar |

### Available Actions (`/accessibility/action`)

| Action | Use For |
|--------|---------|
| `press` | Click a button, toggle a checkbox |
| `setValue` | Set text field content (requires `value` param) |
| `focus` | Move focus to an element |
| `confirm` | Confirm a dialog (like pressing Return) |
| `cancel` | Dismiss a dialog (like pressing Escape) |
| `showMenu` | Open a context/dropdown menu |

### Key Names for `/key`

- **Letters:** `a`-`z`
- **Numbers:** `0`-`9`
- **Function keys:** `f1`-`f12`
- **Navigation:** `up`, `down`, `left`, `right`, `home`, `end`, `pageup`, `pagedown`
- **Special:** `return`, `tab`, `space`, `delete`, `escape`
- **Modifiers** (array): `cmd`, `ctrl`, `alt`, `shift`, `fn`

## Best Practices

1. **Always start with `geisterhand run`** — use it to launch the app and server together. Parse the JSON output to get `port` and `pid`. Then verify with `GET /status`.
2. **Use `/wait` instead of `sleep`** — synchronize with actual UI state, not arbitrary delays.
3. **Use semantic selectors over coordinates** — `title`, `title_contains`, `role`, `label` find elements wherever they are.
4. **Re-query stale paths** — element paths change when the UI updates. Re-query before retrying.
5. **Use background mode when possible** — prevents focus theft and lets tests run without disrupting the user.
6. **Use screenshots for debugging** — when a test fails, capture the current state with `GET /screenshot`.

## Troubleshooting

| Problem | Cause | Fix |
|---------|-------|-----|
| `connection refused` | Server not running | Run `geisterhand run /path/to/app &` |
| `accessibility: false` in `/status` | Missing permission | Grant in System Settings > Privacy & Security > Accessibility |
| `screen_recording: false` in `/status` | Missing permission | Grant in System Settings > Privacy & Security > Screen Recording |
| Element not found | Wrong PID or element not visible | Check PID from `geisterhand run` output, use `/accessibility/tree` to inspect UI |
| Action failed on element | Stale path or element disabled | Re-query element, check `is_enabled` |
| `/type` background mode replaces text | Expected behavior | Background `/type` uses `setValue` which sets the whole field |
| `/key` with `path` doesn't work | Only 3 keys supported | Use `pid` instead of `path` for arbitrary keys |
| Menu not found | Case-sensitive match | Use exact titles from `GET /menu` response |