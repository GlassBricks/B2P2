import { Assembly } from "../assembly/Assembly"
import { mockImport } from "../assembly/imports/import-mock"
import { Blueprint } from "../blueprint/Blueprint"
import { clearBuildableEntities } from "../blueprint/world"
import { Settings } from "../constants"
import { ContextualFun } from "../lib"
import { bbox } from "../lib/geometry/bounding-box"
import { pos } from "../lib/geometry/position"
import { getPlayer } from "../lib/test-util/misc"
import { getBlueprintSample } from "../test/blueprint-sample"
import Spy = spy.Spy

let oldAutosaveSetting: boolean
let player: LuaPlayer
let assembly: Assembly
let saved: Spy<ContextualFun>
before_all(() => {
  for (const [assembly] of Assembly.getAllAssemblies()) {
    assembly.delete()
  }
  player = getPlayer()
  oldAutosaveSetting = player.mod_settings[Settings.Autosave].value as boolean
  assembly = Assembly.create("test", game.surfaces[1], bbox.fromCoords(1, 1, 20, 20))
  const content = assembly.getContent()!
  rawset(content, "commitAndReset", content.commitAndReset)
  saved = spy.on(content, "commitAndReset")
})
before_each(() => {
  player.mod_settings[Settings.Autosave] = { value: true }
  player.teleport(pos(0, 0))
  saved.clear()
})
after_all(() => {
  const modSettings = player.mod_settings
  modSettings[Settings.Autosave] = { value: oldAutosaveSetting }
  for (const [assembly] of Assembly.getAllAssemblies()) {
    assembly.delete()
  }
  saved.revert()
})
function teleportIn() {
  player.teleport(pos(1.5, 1.5))
}
function teleportOut() {
  player.teleport(pos(0, 0))
}

test("autosave works", () => {
  teleportIn()
  assert.spy(saved).not_called()
  teleportOut()
  assert.spy(saved).called(1)
})

test("does not autosave if setting disabled", () => {
  player.mod_settings[Settings.Autosave] = { value: false }
  teleportIn()
  teleportOut()
  assert.spy(saved).not_called()
})

test("does not save if there are conflicts", () => {
  const fn = stub(assembly.getContent()!.hasConflicts, "get")
  fn.returns(true)
  after_test(() => fn.revert())

  teleportIn()
  teleportOut()
  assert.spy(saved).not_called()
})

test("does not save if there are deletions", () => {
  assembly.getContent()!.saveAndAddImport(mockImport(Blueprint.fromArray(getBlueprintSample("original"))))
  clearBuildableEntities(assembly.surface, assembly.area)
  saved.clear()
  teleportIn()
  assert.spy(saved).not_called()
  teleportOut()
  assert.spy(saved).not_called()
})
