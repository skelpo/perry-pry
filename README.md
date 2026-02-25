# Pry

A fast, native JSON viewer built with the [Perry](https://github.com/nicklasxyz/perry) framework.

Perry compiles TypeScript to native ARM64 binaries — no Electron, no browser, no runtime. The app uses Perry's UI bindings which map directly to platform-native widgets (AppKit on macOS, UIKit on iOS, Android Views on Android).

![Pry on macOS](screenshots/iphone/03_expanded.png)

## Download

[<img src="https://developer.apple.com/assets/elements/badges/download-on-the-app-store.svg" height="40">](https://apps.apple.com/us/app/pry-json-viewer/id6759329040)

## Features

- Tree view with expand/collapse for objects and arrays
- Full-text search across keys and values
- Keyboard shortcuts (Cmd+O open, Cmd+F search, Cmd+E expand all)
- Copy values, keys, or JSONPath to clipboard via context menu
- Status bar with node count, file size, and parse time

## Platforms

- **macOS** — native AppKit (`src/main.ts`) — [App Store](https://apps.apple.com/app/pry-json-viewer/id6759329040)
- **iOS** — native UIKit (`src/main_ios.ts`) — [App Store](https://apps.apple.com/us/app/pry-json-viewer/id6759329040)
- **Android** — native Android Views (`src/main_android.ts`)

## Building

Pry is compiled by the Perry compiler. You need the [perry](https://github.com/nicklasxyz/perry) repo cloned as a sibling directory.

```bash
# macOS
cd /path/to/perry && cargo run --release -- compile /path/to/perry-pry/src/main.ts -o /path/to/perry-pry/pry
./pry

# iOS Simulator
cd /path/to/perry && cargo run --release -- compile /path/to/perry-pry/src/main_ios.ts -o /path/to/perry-pry/pry-ios --target ios-simulator

# Android
cd /path/to/perry && cargo run --release -- compile /path/to/perry-pry/src/main_android.ts --target android -o /path/to/perry-pry/android/app/src/main/jniLibs/arm64-v8a/libpry.so
cd /path/to/perry-pry/android && ./gradlew installDebug
```

## Project Structure

```
src/                 # TypeScript source (3 entry points + 11 shared modules)
android/             # Android Studio project
xcode/               # Xcode project for iOS/macOS App Store builds
test-data/           # Sample JSON files
screenshots/         # App screenshots by platform
```

## License

MIT License. See [LICENSE](LICENSE) for details.
