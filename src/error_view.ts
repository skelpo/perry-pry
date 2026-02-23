import { Text, widgetAddChild, textSetColor, textSetFontSize, textSetFontWeight, textSetSelectable } from "perry/ui"

export function buildErrorView(container: any, errorMessage: string, rawText: string): void {
  const header = Text("Parse Error")
  textSetFontSize(header, 16)
  textSetFontWeight(header, 16, 1.0)
  textSetColor(header, 0.9, 0.2, 0.2, 1.0)

  const errMsg = Text(errorMessage)
  textSetColor(errMsg, 0.9, 0.3, 0.3, 1.0)
  textSetFontSize(errMsg, 13)
  textSetSelectable(errMsg, 1)

  const preview = rawText.length > 200 ? rawText.substring(0, 200) + "..." : rawText
  const rawLabel = Text("Input preview:")
  textSetFontSize(rawLabel, 11)
  textSetColor(rawLabel, 0.5, 0.5, 0.5, 1.0)

  const rawPreview = Text(preview)
  textSetFontSize(rawPreview, 11)
  textSetColor(rawPreview, 0.6, 0.6, 0.6, 1.0)
  textSetSelectable(rawPreview, 1)

  widgetAddChild(container, header)
  widgetAddChild(container, errMsg)
  widgetAddChild(container, rawLabel)
  widgetAddChild(container, rawPreview)
}
