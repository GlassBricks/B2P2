import { table } from "util"
import { _getSetupHooks } from "./setup"
import deepcopy = table.deepcopy

/** @noSelf */
export interface MockScript extends LuaBootstrap {
  simulateOnInit(): void
  simulateOnLoad(): void
  simulateOnConfigurationChanged(data: ConfigurationChangedData): void
  revert(): void
  _isMockSetup: true
  mockGlobal: any
}

declare const global: unknown
function MockSetup(): MockScript {
  if (rawget(script as MockScript, "_isMockSetup")) error("Already in mock setup.")
  log("Mocking setup")
  const oldScript = script
  const oldGame = game
  const oldGlobal = global
  const mockGlobal = {}

  function cannotRunInMock(): never {
    error("This function cannot be run in mock setup mode.")
  }
  let onInitHook: (() => void) | undefined
  let onLoadHook: (() => void) | undefined
  let onConfigChangedHook: ((data: ConfigurationChangedData) => void) | undefined
  const result: MockScript = {
    active_mods: oldScript.active_mods,
    level: oldScript.level,
    mod_name: oldScript.mod_name,
    object_name: "LuaBootstrap",
    generate_event_name: cannotRunInMock,
    get_event_filter: oldScript.get_event_filter,
    get_event_handler: oldScript.get_event_handler,
    get_event_order: oldScript.get_event_order,

    on_event: cannotRunInMock,
    on_nth_tick: cannotRunInMock,
    raise_biter_base_built: cannotRunInMock,
    raise_console_chat: cannotRunInMock,
    raise_event: cannotRunInMock,
    raise_market_item_purchased: cannotRunInMock,
    raise_player_crafted_item: cannotRunInMock,
    raise_player_fast_transferred: cannotRunInMock,
    raise_script_built: cannotRunInMock,
    raise_script_destroy: cannotRunInMock,
    raise_script_revive: cannotRunInMock,
    raise_script_set_tiles: cannotRunInMock,
    register_on_entity_destroyed: cannotRunInMock,
    set_event_filter: cannotRunInMock,

    mockGlobal,
    on_init(f: (() => void) | undefined) {
      onInitHook = f
    },
    on_load(f: (() => void) | undefined): void {
      onLoadHook = f
    },
    on_configuration_changed(f: ((param1: ConfigurationChangedData) => void) | undefined): void {
      onConfigChangedHook = f
    },
    simulateOnInit(): void {
      ;(_G as any).game = oldGame
      ;(_G as any).global = mockGlobal
      onInitHook?.()
    },
    simulateOnLoad(): void {
      ;(_G as any).global = mockGlobal
      const oldGlobal = deepcopy(mockGlobal)
      onLoadHook?.()
      ;(_G as any).game = oldGame // AFTER onLoadHook
      collectgarbage()
      assert.same(oldGlobal, mockGlobal, "global modified in on_load!")
    },
    simulateOnConfigurationChanged(data: ConfigurationChangedData): void {
      ;(_G as any).game = oldGame
      ;(_G as any).global = mockGlobal
      onConfigChangedHook?.(data)
    },
    revert() {
      ;(_G as any).script = oldScript
      ;(_G as any).game = oldGame
      ;(_G as any).global = oldGlobal
    },
    _isMockSetup: true,
  }
  ;(_G as any).global = undefined
  ;(_G as any).script = result
  ;(_G as any).game = undefined
  for (const hook of _getSetupHooks()) hook()
  return result
}

function _endSetupMock(): void {
  if (!rawget(script as MockScript, "_isMockSetup")) return
  ;(script as MockScript).revert()
}

export function mockSetupInTest(): void {
  after_test(_endSetupMock)
  MockSetup()
}

function assertInMockSetup(script: LuaBootstrap): asserts script is MockScript {
  if (!rawget(script as MockScript, "_isMockSetup")) error("Not in mock setup.")
}

export function simulateOnInit(): void {
  assertInMockSetup(script)
  script.simulateOnInit()
}

export function simulateOnLoad(): void {
  assertInMockSetup(script)
  script.simulateOnLoad()
}

export function simulateOnConfigurationChanged(data: ConfigurationChangedData): void {
  assertInMockSetup(script)
  script.simulateOnConfigurationChanged(data)
}
export function simulateConfigChangedModUpdate(fromVersion: string, toVersion: string): void {
  assertInMockSetup(script)
  script.simulateOnConfigurationChanged({
    mod_changes: {
      [script.mod_name]: {
        old_version: fromVersion,
        new_version: toVersion,
      },
    },
    migration_applied: false,
    mod_startup_settings_changed: false,
  })
}

export function getMockGlobal(): any {
  assertInMockSetup(script)
  return script.mockGlobal
}

export function simulateModUpdated(fromVersion: string, toVersion: string): void {
  assertInMockSetup(script)
  script.simulateOnLoad()
  simulateConfigChangedModUpdate(fromVersion, toVersion)
}
