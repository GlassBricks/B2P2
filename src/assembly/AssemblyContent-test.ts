import { Blueprint } from "../blueprint/Blueprint"
import { getEntitySourceLocation } from "../blueprint/EntitySourceMap"
import { LuaBlueprint } from "../blueprint/LuaBlueprint"
import { clearBuildableEntities, pasteBlueprint, takeBlueprint } from "../blueprint/world"
import { computeTileBox } from "../entity/entity-info"
import { Classes } from "../lib"
import { bbox, BoundingBoxClass, pos } from "../lib/geometry"
import { assertBlueprintsEquivalent } from "../test/blueprint"
import { BlueprintSampleName, getBlueprintSample } from "../test/blueprint-sample"
import { getWorkingArea1, getWorkingArea2 } from "../test/misc"
import { AssemblyContent, DefaultAssemblyContent } from "./AssemblyContent"
import { invalidMockImport, mockImport } from "./imports/import-mock"
import shift = bbox.shift

test("registered", () => {
  Classes.nameOf(DefaultAssemblyContent)
})

let area: BoundingBoxClass
let surface: LuaSurface

before_all(() => {
  ;[surface, area] = getWorkingArea1()
})

function createAssemblyContent(area1: BoundingBoxClass = area): AssemblyContent {
  return new DefaultAssemblyContent(surface, area1)
}

function assertNoGhosts() {
  const ghosts = surface.find_entities_filtered({ type: "ghost" })
  assert.same(
    {},
    ghosts.map((x) => ({ name: x.name, position: x.position })),
    "ghosts found",
  )
  const itemRequestProxies = surface.find_entities_filtered({ type: "item-request-proxy" })
  assert.same(
    {},
    itemRequestProxies.map((x) => ({ position: x.position })),
    "item-request-proxies found",
  )
}

describe("initializing contents", () => {
  before_each(() => {
    clearBuildableEntities(surface, area)
  })
  test("in an empty area yields empty ownContents ", () => {
    const content = createAssemblyContent()
    assert.same({}, content.ownContents.get().getEntities())
  })

  test("in an area with entities sets ownContents", () => {
    pasteBlueprint(surface, area.left_top, getBlueprintSample("original"))
    const content = createAssemblyContent()
    assertBlueprintsEquivalent(getBlueprintSample("original"), content.ownContents.get())
    assertBlueprintsEquivalent(getBlueprintSample("original"), content.resultContent.get()!)
  })
})

describe("refreshInWorld", () => {
  before_each(() => {
    clearBuildableEntities(surface, area)
  })
  test("reset an empty assembly clears area", () => {
    const content = createAssemblyContent()
    pasteBlueprint(surface, area.left_top, getBlueprintSample("original"))
    content.resetInWorld()
    const bp = takeBlueprint(surface, area, area.left_top)
    assert.same({}, bp.getEntities())
    assert.same({}, content.resultContent.get()!.getEntities())
  })
  test.each<BlueprintSampleName>(
    ["original", "module change", "module purple sci"],
    "refreshing an assembly with entities sets entities: %s",
    (sampleName) => {
      const sample = getBlueprintSample(sampleName)
      pasteBlueprint(surface, area.left_top, sample)
      const content = createAssemblyContent()
      content.resetInWorld()
      const bp = takeBlueprint(surface, area, area.left_top)
      assertBlueprintsEquivalent(sample, bp)
      assertNoGhosts()

      assertBlueprintsEquivalent(sample, content.resultContent.get()!)
    },
  )
})

describe("import", () => {
  before_each(() => {
    clearBuildableEntities(surface, area)
  })
  test("adding import to blueprint adds to in world", () => {
    const content = createAssemblyContent()
    content.saveAndAddImport(mockImport(getBlueprintSample("original")))
    assert.same({}, content.ownContents.get().getEntities())
    content.resetInWorld()
    const bp = takeBlueprint(surface, area, area.left_top)
    assertBlueprintsEquivalent(getBlueprintSample("original"), bp)
    assertNoGhosts()
    assertBlueprintsEquivalent(getBlueprintSample("original"), content.resultContent.get()!)
  })
  test("adding import to blueprint adds to in world at nearest 2x2 grid pos", () => {
    const content = createAssemblyContent()
    content.saveAndAddImport(mockImport(getBlueprintSample("original"), pos(2, 2)))
    assert.same({}, content.ownContents.get().getEntities())
    content.resetInWorld()
    const bp = takeBlueprint(surface, bbox.shift(area, pos(2, 2)))
    assertBlueprintsEquivalent(getBlueprintSample("original"), bp)
    assertNoGhosts()

    const shiftedBlueprint = LuaBlueprint.fromArray(
      getBlueprintSample("original")
        .getEntities()
        .map((x) => ({ ...x, position: pos.add(x.position, pos(2, 2)) })),
    )
    assertBlueprintsEquivalent(shiftedBlueprint, content.resultContent.get()!)
  })

  test("inactive import does not add in world", () => {
    const content = createAssemblyContent()
    content.saveAndAddImport(mockImport(getBlueprintSample("original"), pos(2, 2)))
    content.imports.get(0).active.set(false)
    content.resetInWorld()
    const bp = takeBlueprint(surface, area, area.left_top)
    assert.same({}, bp.getEntities())
  })

  test("imported entities do not extend beyond bounding box", () => {
    const mockEntities: BlueprintEntityRead[] = [
      {
        name: "iron-chest",
        position: pos(0.5, 0.5),
        entity_number: 1,
      },
      {
        name: "steel-chest",
        position: pos(10.5, 10.5),
        entity_number: 2,
      },
    ]
    const content = createAssemblyContent(bbox(area.left_top, pos.add(area.left_top, pos(5, 5))))
    content.saveAndAddImport(mockImport(LuaBlueprint.fromArray(mockEntities)))

    content.resetInWorld()
    const bp = takeBlueprint(surface, area, area.left_top)
    const expected = LuaBlueprint.fromArray(mockEntities.slice(0, 1))
    assertBlueprintsEquivalent(expected, bp)
    assertNoGhosts()
  })

  test("does not paste invalid import", () => {
    const content = createAssemblyContent()
    content.saveAndAddImport(invalidMockImport())
    const bp = takeBlueprint(surface, area, area.left_top)
    assert.same({}, bp.getEntities())
  })

  test("allow upgrades makes diagnostics highlight only", () => {
    const upgradeBlueprint = getBlueprintSample("inserter fast replace and control change")
    pasteBlueprint(surface, area.left_top, upgradeBlueprint)
    const content = createAssemblyContent()
    content.ownOptions.allowUpgrades.set(true)
    content.saveAndAddImport(mockImport(getBlueprintSample("original")))
    const bp = takeBlueprint(surface, area, area.left_top)
    assertBlueprintsEquivalent(upgradeBlueprint, bp)
    assertNoGhosts()

    const diagnostics = content.pasteDiagnostics.get()![1]
    assert.true(diagnostics.diagnostics["cannot-upgrade"]!.highlightOnly)
  })
})

describe("paste conflicts", () => {
  before_each(() => {
    clearBuildableEntities(surface, area)
  })

  it("has no conflicts for simple paste", () => {
    pasteBlueprint(surface, area.left_top, getBlueprintSample("original"))
    const content = createAssemblyContent()
    assert.same(
      [{}],
      content.pasteDiagnostics.get().map((x) => x.diagnostics),
    )
  })

  function testBlueprints(above: Blueprint, below: Blueprint) {
    pasteBlueprint(surface, area.left_top, above)
    const content = createAssemblyContent()
    content.saveAndAddImport(mockImport(below))
    return content
  }
  it("highlights conflicts", () => {
    const below = getBlueprintSample("original")
    const above = getBlueprintSample("inserter rotate")
    testBlueprints(above, below)
    const conflictingEntity = above.getEntities().find((x) => x.name === "inserter")!
    const conflictingPosition = pos.add(conflictingEntity.position, area.left_top)
    const highlightBox = surface.find_entity("highlight-box", conflictingPosition)
    assert.not_nil(highlightBox)
  })

  test("allowUpgrades", () => {
    const below = getBlueprintSample("original")
    const above = getBlueprintSample("inserter fast replace")
    const content = testBlueprints(above, below)
    let diagnostics = content.pasteDiagnostics.get()![1].diagnostics
    assert.same(["cannot-upgrade"], Object.keys(diagnostics))
    assert.falsy(diagnostics["cannot-upgrade"]!.highlightOnly)
    assert.true(content.hasConflicts.get())

    content.ownOptions.allowUpgrades.set(true)
    content.resetInWorld()

    diagnostics = content.pasteDiagnostics.get()![1].diagnostics
    assert.same(["cannot-upgrade"], Object.keys(diagnostics))
    assert.true(diagnostics["cannot-upgrade"]!.highlightOnly)
    assert.false(content.hasConflicts.get(), "does not have conflicts if allowUpgrades")
  })
})

describe("sourceMap", () => {
  before_each(() => {
    clearBuildableEntities(surface, area)
  })

  it("gives own location for own contents", () => {
    const blueprintSample = getBlueprintSample("original")
    pasteBlueprint(surface, area.left_top, blueprintSample)
    const contents = createAssemblyContent()
    const map = contents.entitySourceMap
    assert.not_nil(map)
    for (const entity of blueprintSample.getEntities()) {
      const box = getEntitySourceLocation(map, entity, area.left_top)?.area
      assert.same(shift(computeTileBox(entity), area.left_top), box)
    }
  })

  it("gives imported location for imported contents", () => {
    const ownContent = getBlueprintSample("add chest")
    pasteBlueprint(surface, area.left_top, ownContent)
    const contents = createAssemblyContent()
    const importContent = getBlueprintSample("original")
    const [, area2] = getWorkingArea2()
    const imp = mockImport(importContent, undefined, { surface, area: area2 })
    contents.saveAndAddImport(imp)

    const map = contents.entitySourceMap
    assert.not_nil(map)
    for (const entity of importContent.getEntities()) {
      const box = getEntitySourceLocation(map, entity, area.left_top)?.area
      assert.same(shift(computeTileBox(entity), area2.left_top), box, "imported entity maps to source location")
    }
    for (const entity of ownContent.getEntities()) {
      if (entity.name === "iron-chest") {
        const box = getEntitySourceLocation(map, entity, area.left_top)?.area
        assert.same(shift(computeTileBox(entity), area.left_top), box, "own chest maps to own location")
      }
    }
  })
})
describe("saveChanges", () => {
  before_each(() => {
    clearBuildableEntities(surface, area)
  })
  it("does not change anything if completely empty", () => {
    const contents = createAssemblyContent()
    contents.prepareSave()
    contents.commitSave()
    assert.same({}, takeBlueprint(surface, area, area.left_top).getEntities())
    assertNoGhosts()
  })

  it("sets ownContents", () => {
    const contents = createAssemblyContent()
    pasteBlueprint(surface, area.left_top, getBlueprintSample("original"))
    contents.prepareSave()
    contents.commitSave()
    assertBlueprintsEquivalent(getBlueprintSample("original"), contents.ownContents.get())
    assertNoGhosts()
  })

  it("is empty when content exactly matches imports", () => {
    const contents = createAssemblyContent()
    contents.saveAndAddImport(mockImport(getBlueprintSample("original")))
    contents.resetInWorld()
    contents.prepareSave()
    contents.commitSave()
    assert.same({}, contents.ownContents.get().getEntities())
    assertNoGhosts()
  })
})
