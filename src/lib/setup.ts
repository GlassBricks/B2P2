export function checkIsBeforeLoad(): void {
  if (game) {
    error("This operation must only be done during script load.")
  }
}

export type SetupHook = () => void

let hooksFinalized = false

const setupHooks: SetupHook[] = []
export function onSetupReset(hook: SetupHook): void {
  checkIsBeforeLoad()
  if (hooksFinalized) error("Cannot add setup hooks at this time.")
  setupHooks.push(hook)
}

export function _getSetupHooks(): readonly SetupHook[] {
  hooksFinalized = true
  return setupHooks
}
