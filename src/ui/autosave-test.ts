import { Assembly } from "../assembly/Assembly"
import { mockImport } from "../assembly/imports/import-mock"
import { clearBuildableEntities } from "../blueprint/world"
import { Settings } from "../constants"
import { ContextualFun } from "../lib"
import { bbox, pos } from "../lib/geometry"
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
  if (player.controller_type !== defines.controllers.editor) {
    player.toggle_map_editor()
  }
  oldAutosaveSetting = player.mod_settings[Settings.Autosave].value as boolean
  assembly = Assembly.create("test", game.surfaces[1], bbox.fromCoords(0, 0, 10, 10))
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
  player.teleport(pos(-1, -1))
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
  assembly.getContent()!.saveAndAddImport(mockImport(getBlueprintSample("original")))
  clearBuildableEntities(assembly.surface, assembly.area)
  saved.clear()
  teleportIn()
  assert.spy(saved).not_called()
  teleportOut()
  assert.spy(saved).not_called()
})
//
// function findRefValue(): string[] {
//   const seen = new LuaTable()
//   const currentPath: string[] = []
//
//   const found: string[] = []
//
//   function visit(value: any) {
//     if (typeof value !== "object" && typeof value !== "function") return
//     if (seen.has(value)) return
//     seen.set(value, true)
//
//     if (typeof value === "function") {
//       const info = debug.getinfo(value, "nu")
//       if (info.nups === 0) return
//       for (const i of $range(1, info.nups!)) {
//         const [name, upvalue] = debug.getupvalue(value, i)
//         currentPath.push("upvalue " + name)
//         visit(upvalue)
//         currentPath.pop()
//       }
//       // seen.set(value, false)
//       return
//     }
//     if (rawget(value, "__self")) return
//     if (getmetatable(value) === Blueprint.prototype) {
//       error(currentPath.join("."))
//     }
//
//     for (const [k, v] of pairs(value as unknown)) {
//       currentPath.push("in key " + tostring(k))
//       visit(k)
//       currentPath.pop()
//       currentPath.push(tostring(k))
//       visit(v)
//       currentPath.pop()
//     }
//     // seen.set(value, false)
//   }
//   visit(global)
//   return found
// }
