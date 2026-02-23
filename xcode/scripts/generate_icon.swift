#!/usr/bin/env swift
import AppKit

guard CommandLine.arguments.count > 1 else {
    print("Usage: generate_icon.swift <output-directory>")
    exit(1)
}

let outputDir = CommandLine.arguments[1]
let sizes = [16, 32, 64, 128, 256, 512, 1024]

for size in sizes {
    let s = CGFloat(size)

    // Create bitmap at exact pixel dimensions (1x scale)
    let bitmap = NSBitmapImageRep(
        bitmapDataPlanes: nil,
        pixelsWide: size, pixelsHigh: size,
        bitsPerSample: 8, samplesPerPixel: 4,
        hasAlpha: true, isPlanar: false,
        colorSpaceName: .deviceRGB,
        bytesPerRow: 0, bitsPerPixel: 0
    )!
    bitmap.size = NSSize(width: s, height: s)  // 1 point = 1 pixel

    NSGraphicsContext.saveGraphicsState()
    NSGraphicsContext.current = NSGraphicsContext(bitmapImageRep: bitmap)

    // Dark charcoal background with rounded rect
    let bgRect = NSRect(x: 0, y: 0, width: s, height: s)
    let cornerRadius = s * 0.185  // macOS icon corner radius
    let bgPath = NSBezierPath(roundedRect: bgRect, xRadius: cornerRadius, yRadius: cornerRadius)
    NSColor(calibratedRed: 0.18, green: 0.20, blue: 0.25, alpha: 1.0).setFill()
    bgPath.fill()

    // Subtle border
    NSColor(calibratedRed: 0.25, green: 0.28, blue: 0.33, alpha: 1.0).setStroke()
    bgPath.lineWidth = s * 0.02
    bgPath.stroke()

    // Teal "{ }" text centered
    let fontSize = s * 0.52
    let font = NSFont.monospacedSystemFont(ofSize: fontSize, weight: .bold)
    let tealColor = NSColor(calibratedRed: 0.25, green: 0.83, blue: 0.82, alpha: 1.0)
    let attrs: [NSAttributedString.Key: Any] = [
        .font: font,
        .foregroundColor: tealColor,
    ]
    let text = "{ }" as NSString
    let textSize = text.size(withAttributes: attrs)
    let textX = (s - textSize.width) / 2.0
    let textY = (s - textSize.height) / 2.0
    text.draw(at: NSPoint(x: textX, y: textY), withAttributes: attrs)

    NSGraphicsContext.restoreGraphicsState()

    // Save as PNG
    guard let pngData = bitmap.representation(using: .png, properties: [:]) else {
        print("Failed to generate \(size)px icon")
        exit(1)
    }

    let path = "\(outputDir)/icon_\(size).png"
    do {
        try pngData.write(to: URL(fileURLWithPath: path))
        print("Generated \(path) (\(size)x\(size)px)")
    } catch {
        print("Failed to write \(path): \(error)")
        exit(1)
    }
}

print("Done! Generated \(sizes.count) icons.")
