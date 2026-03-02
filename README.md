# Pry

A fast, native JSON viewer for macOS, iOS, Android, Linux, and Windows.

Built with **[Perry](https://github.com/PerryTS/perry)** — a compiler that turns TypeScript into native binaries with no Electron, no browser, and no runtime.

![Pry on macOS](screenshots/iphone/03_expanded.png)

## Download

[<img src="https://developer.apple.com/assets/elements/badges/download-on-the-app-store.svg" height="40">](https://apps.apple.com/us/app/pry-json-viewer/id6759329040)
[<img src="https://play.google.com/intl/en_us/badges/static/images/badges/en_badge_web_generic.png" height="40">](https://play.google.com/store/apps/details?id=com.perry.pry)

## Features

- Tree view with expand/collapse for objects and arrays
- Full-text search across keys and values
- Keyboard shortcuts (Cmd/Ctrl+O open, Cmd/Ctrl+F search, Cmd/Ctrl+E expand all)
- Copy values, keys, or JSONPath to clipboard via context menu
- Status bar with node count, file size, and parse time

## How it works

Pry is written in TypeScript and compiled by the [Perry compiler](https://github.com/PerryTS/perry) (a Rust program) directly to native machine code — no Node.js, no JVM, no interpreter.

Perry's UI API maps to native OS widgets on each platform:

| Platform | Widget toolkit | Entry point |
|----------|---------------|-------------|
| macOS | AppKit | `src/main.ts` |
| iOS | UIKit | `src/main_ios.ts` |
| Android | Android Views | `src/main_android.ts` |
| Linux | GTK4 | `src/main_linux.ts` |
| Windows | Win32 | `src/main_windows.ts` |

The result is a small, self-contained binary that starts instantly with no GC pauses or JIT warmup.

## Platforms

- **macOS** — native AppKit (`src/main.ts`) — [App Store](https://apps.apple.com/app/pry-json-viewer/id6759329040)
- **Linux** — native GTK4 (`src/main_linux.ts`)
- **Windows** — native Win32 (`src/main_windows.ts`) — signing coming soon
- **iOS** — native UIKit (`src/main_ios.ts`) — [App Store](https://apps.apple.com/us/app/pry-json-viewer/id6759329040)
- **Android** — native Android Views (`src/main_android.ts`) — [Google Play](https://play.google.com/store/apps/details?id=com.perry.pry)

## Building

Pry is compiled by the Perry compiler. You need the [perry](https://github.com/PerryTS/perry) repo cloned as a sibling directory.

```bash
# macOS
cd /path/to/perry && cargo run --release -- compile /path/to/perry-pry/src/main.ts -o /path/to/perry-pry/pry
./pry

# Linux (requires gtk4-devel)
cd /path/to/perry && cargo run --release -- compile /path/to/perry-pry/src/main_linux.ts -o /path/to/perry-pry/pry
./pry

# Windows
cd /path/to/perry && cargo run --release -- compile /path/to/perry-pry/src/main_windows.ts --target windows -o /path/to/perry-pry/pry.exe
./pry.exe

# iOS Simulator
cd /path/to/perry && cargo run --release -- compile /path/to/perry-pry/src/main_ios.ts -o /path/to/perry-pry/pry-ios --target ios-simulator

# Android
cd /path/to/perry && cargo run --release -- compile /path/to/perry-pry/src/main_android.ts --target android -o /path/to/perry-pry/android/app/src/main/jniLibs/arm64-v8a/libpry.so
cd /path/to/perry-pry/android && ./gradlew installDebug
```

## Project Structure

```
src/                 # TypeScript source (4 entry points + 11 shared modules)
android/             # Android Studio project
xcode/               # Xcode project for iOS/macOS App Store builds
test-data/           # Sample JSON files
screenshots/         # App screenshots by platform
```

## License

MIT License. See [LICENSE](LICENSE) for details.
