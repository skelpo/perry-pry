#!/bin/bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
PROJECT_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"
REPO_DIR="$(cd "$PROJECT_DIR/.." && pwd)"
PERRY_DIR="/Users/amlug/projects/perry"
ARCHIVE_PATH="$PROJECT_DIR/build/Pry.xcarchive"
EXPORT_DIR="$PROJECT_DIR/build/export"

echo "=== Step 1: Compile with Perry ==="
cd "$PERRY_DIR"
cargo run --release -- compile "$REPO_DIR/src/main.ts" -o "$REPO_DIR/pry"
echo "Perry binary compiled: $REPO_DIR/pry"

echo ""
echo "=== Step 2: Generate icons ==="
swift "$PROJECT_DIR/scripts/generate_icon.swift" "$PROJECT_DIR/Pry/Assets.xcassets/AppIcon.appiconset/"

echo ""
echo "=== Step 3: Generate Xcode project ==="
cd "$PROJECT_DIR"
xcodegen generate
echo "Xcode project generated"

echo ""
echo "=== Step 4: Archive ==="
xcodebuild archive \
  -project "$PROJECT_DIR/Pry.xcodeproj" \
  -scheme Pry \
  -configuration Release \
  -archivePath "$ARCHIVE_PATH" \
  CODE_SIGN_STYLE=Manual \
  DEVELOPMENT_TEAM=K6UW5YV9F7 \
  CODE_SIGN_IDENTITY="3rd Party Mac Developer Application" \
  | tail -20

echo ""
echo "Archive created: $ARCHIVE_PATH"

echo ""
echo "=== Step 5: Export for App Store ==="
xcodebuild -exportArchive \
  -archivePath "$ARCHIVE_PATH" \
  -exportOptionsPlist "$PROJECT_DIR/scripts/export_options.plist" \
  -exportPath "$EXPORT_DIR" \
  | tail -10

echo ""
echo "=== Done ==="
echo "Exported to: $EXPORT_DIR"
echo "Upload with: xcrun altool --upload-app -f $EXPORT_DIR/Pry.pkg -t macos"
