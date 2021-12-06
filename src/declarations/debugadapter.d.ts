/** @noSelf */
interface DebugAdapter {
  stepIgnore(func: Function): void
}

declare const __DebugAdapter: DebugAdapter | undefined
