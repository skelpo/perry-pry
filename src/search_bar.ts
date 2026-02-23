import {
  HStack, Text, TextField, Button,
  textSetFontSize, textSetColor, buttonSetBordered, textfieldFocus,
  widgetAddChild,
} from "perry/ui"

export function buildSearchBar(
  container: any,
  matchCount: number,
  currentMatch: number,
  onQueryChange: (text: string) => void,
  onNext: () => void,
  onPrev: () => void,
): any {
  const field = TextField("Search keys and values...", onQueryChange)

  let countText = ""
  if (matchCount > 0) {
    countText = (currentMatch + 1) + " of " + matchCount
  } else {
    countText = "No matches"
  }
  const countLabel = Text(countText)
  textSetFontSize(countLabel, 12)
  textSetColor(countLabel, 0.5, 0.5, 0.5, 1.0)

  const prevBtn = Button("▲", onPrev)
  buttonSetBordered(prevBtn, 0)
  const nextBtn = Button("▼", onNext)
  buttonSetBordered(nextBtn, 0)

  const row = HStack(6, [
    field,
    countLabel,
    prevBtn,
    nextBtn,
  ])

  widgetAddChild(container, row)
  return field
}
