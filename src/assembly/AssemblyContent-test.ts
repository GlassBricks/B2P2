import { Blueprint } from "../blueprint/Blueprint"
import { getEntitySourceLocation } from "../blueprint/EntitySourceMap"
import { clearBuildableEntities, pasteBlueprint } from "../blueprint/world"
import { getTileBox } from "../entity/entity"
import { Classes } from "../lib"
import { bbox, BoundingBoxClass } from "../lib/geometry/bounding-box"
import { pos } from "../lib/geometry/position"
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

let originalBlueprintSample: Blueprint

before_all(() => {
  ;[surface, area] = getWorkingArea1()

  originalBlueprintSample = Blueprint.fromArray(getBlueprintSample("original"))
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
    assert.same({}, content.ownContents.get().entities)
  })

  test("in an area with entities sets ownContents", () => {
    pasteBlueprint(surface, area.left_top, originalBlueprintSample.entities)
    const content = createAssemblyContent()
    assertBlueprintsEquivalent(originalBlueprintSample, content.ownContents.get())
    assertBlueprintsEquivalent(originalBlueprintSample, content.resultContent.get()!)
  })
})

describe("refreshInWorld", () => {
  before_each(() => {
    clearBuildableEntities(surface, area)
  })
  test("reset an empty assembly clears area", () => {
    const content = createAssemblyContent()
    pasteBlueprint(surface, area.left_top, originalBlueprintSample.entities)
    content.resetInWorld()
    const bp = Blueprint.take(surface, area, area.left_top)
    assert.same({}, bp.entities)
    assert.same({}, content.resultContent.get()!.entities)
  })
  test.each<BlueprintSampleName>(
    ["original", "module change", "module purple sci"],
    "refreshing an assembly with entities sets entities: %s",
    (sampleName) => {
      const sample = Blueprint.fromArray(getBlueprintSample(sampleName))
      pasteBlueprint(surface, area.left_top, sample.entities)
      const content = createAssemblyContent()
      content.resetInWorld()
      const bp = Blueprint.take(surface, area, area.left_top)
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
    content.saveAndAddImport(mockImport(originalBlueprintSample))
    assert.same({}, content.ownContents.get().entities)
    content.resetInWorld()
    const bp = Blueprint.take(surface, area)
    assertBlueprintsEquivalent(originalBlueprintSample, bp)
    assertNoGhosts()
    assertBlueprintsEquivalent(originalBlueprintSample, content.resultContent.get()!)
  })
  test("adding import to blueprint adds to in world at nearest 2x2 grid pos", () => {
    const content = createAssemblyContent()
    content.saveAndAddImport(mockImport(originalBlueprintSample, pos(2, 2)))
    assert.same({}, content.ownContents.get().entities)
    content.resetInWorld()
    const bp = Blueprint.take(surface, bbox.shift(area, pos(2, 2)))
    assertBlueprintsEquivalent(originalBlueprintSample, bp)
    assertNoGhosts()

    const shiftedBlueprint = Blueprint.fromArray(
      originalBlueprintSample.asArray().map((x) => ({ ...x, position: pos.add(x.position, pos(2, 2)) })),
    )
    assertBlueprintsEquivalent(shiftedBlueprint, content.resultContent.get()!)
  })

  test("inactive import does not add in world", () => {
    const content = createAssemblyContent()
    content.saveAndAddImport(mockImport(originalBlueprintSample, pos(1, 2)))
    content.imports.get(0).active.set(false)
    content.resetInWorld()
    const bp = Blueprint.take(surface, area)
    assert.same({}, bp.entities)
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
    content.saveAndAddImport(mockImport(Blueprint.fromArray(mockEntities)))

    content.resetInWorld()
    const bp = Blueprint.take(surface, area, area.left_top)
    const expected = Blueprint.fromArray(mockEntities.slice(0, 1))
    assertBlueprintsEquivalent(expected, bp)
    assertNoGhosts()
  })

  test("does not paste invalid import", () => {
    const content = createAssemblyContent()
    content.saveAndAddImport(invalidMockImport())
    const bp = Blueprint.take(surface, area, area.left_top)
    assert.same({}, bp.entities)
  })
})

describe("paste conflicts", () => {
  before_each(() => {
    clearBuildableEntities(surface, area)
  })

  it("has no conflicts for simple paste", () => {
    pasteBlueprint(surface, area.left_top, originalBlueprintSample.entities)
    const content = createAssemblyContent()
    assert.same(
      [{}],
      content.pasteDiagnostics.get().map((x) => x.diagnostics),
    )
  })

  it("highlights conflicts", () => {
    const below = getBlueprintSample("original")
    const above = getBlueprintSample("inserter rotate")
    pasteBlueprint(surface, area.left_top, above)
    const content = createAssemblyContent()
    content.saveAndAddImport(mockImport(Blueprint.fromArray(below)))
    const conflictingEntity = above.find((x) => x.name === "inserter")!
    const conflictingPosition = pos.add(conflictingEntity.position, area.left_top)
    const higlightbox = surface.find_entity("highlight-box", conflictingPosition)
    assert.not_nil(higlightbox)
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
    const map = contents.entitySourceMap.get()!
    assert.not_nil(map)
    for (const entity of blueprintSample) {
      const box = getEntitySourceLocation(map, entity, area.left_top)?.area
      assert.same(shift(getTileBox(entity), area.left_top), box)
    }
  })

  it("gives imported location for imported contents", () => {
    const ownContent = getBlueprintSample("add chest")
    pasteBlueprint(surface, area.left_top, ownContent)
    const contents = createAssemblyContent()
    const importContent = getBlueprintSample("original")
    const [, area2] = getWorkingArea2()
    const imp = mockImport(Blueprint.fromArray(importContent), undefined, { surface, area: area2 })
    contents.saveAndAddImport(imp)

    const map = contents.entitySourceMap.get()!
    assert.not_nil(map)
    for (const entity of importContent) {
      const box = getEntitySourceLocation(map, entity, area.left_top)?.area
      assert.same(shift(getTileBox(entity), area2.left_top), box, "imported entity maps to source location")
    }
    for (const entity of ownContent) {
      if (entity.name === "iron-chest") {
        const box = getEntitySourceLocation(map, entity, area.left_top)?.area
        assert.same(shift(getTileBox(entity), area.left_top), box, "own chest maps to own location")
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
    assert.same({}, Blueprint.take(surface, area, area.left_top).entities)
    assertNoGhosts()
  })

  it("sets ownContents", () => {
    const contents = createAssemblyContent()
    pasteBlueprint(surface, area.left_top, originalBlueprintSample.entities)
    contents.prepareSave()
    contents.commitSave()
    assertBlueprintsEquivalent(originalBlueprintSample, contents.ownContents.get())
    assertNoGhosts()
  })

  it("is empty when content exactly matches imports", () => {
    const contents = createAssemblyContent()
    contents.saveAndAddImport(mockImport(originalBlueprintSample))
    contents.resetInWorld()
    contents.prepareSave()
    contents.commitSave()
    assert.same({}, contents.ownContents.get().entities)
    assertNoGhosts()
  })
})
