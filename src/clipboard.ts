import { clipboardRead, clipboardWrite } from "perry/ui"

export function readClipboard(): string {
  return clipboardRead()
}

export function writeClipboard(text: string): void {
  clipboardWrite(text)
}
