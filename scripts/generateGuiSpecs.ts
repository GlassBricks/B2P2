import * as ts from "typescript"
import * as path from "path"
import * as fs from "fs"
import * as prettier from "prettier"

type GuiElementType =
  | "choose-elem-button"
  | "drop-down"
  | "empty-widget"
  | "entity-preview"
  | "list-box"
  | "scroll-pane"
  | "sprite-button"
  | "tabbed-pane"
  | "text-box"
  | "button"
  | "camera"
  | "checkbox"
  | "flow"
  | "frame"
  | "label"
  | "line"
  | "minimap"
  | "progressbar"
  | "radiobutton"
  | "slider"
  | "sprite"
  | "switch"
  | "tab"
  | "table"
  | "textfield"

const indexFileName = path.resolve(__dirname, "../node_modules/typed-factorio/index.d.ts")
const defFileName = path.resolve(__dirname, "../node_modules/typed-factorio/generated/classes.d.ts")
const outDir = path.resolve(__dirname, "../src/lib/factoriofx")

const program = ts.createProgram({
  rootNames: [defFileName, indexFileName],
  options: {},
})

function error(msg: string): never {
  throw new Error(msg)
}
const defFile = program.getSourceFile(defFileName) ?? error("Could not find gui.d.ts")

const guiElementTypes: GuiElementType[] = [
  "choose-elem-button",
  "drop-down",
  "empty-widget",
  "entity-preview",
  "list-box",
  "scroll-pane",
  "sprite-button",
  "tabbed-pane",
  "text-box",
  "button",
  "camera",
  "checkbox",
  "flow",
  "frame",
  "label",
  "line",
  "minimap",
  "progressbar",
  "radiobutton",
  "slider",
  "sprite",
  "switch",
  "tab",
  "table",
  "textfield",
]
function normalizeName(name: string): string {
  return name.replace(/-/g, "").toLowerCase()
}

const normElemTypeNames: Record<string, GuiElementType | "base"> = {}
for (const type of guiElementTypes) {
  normElemTypeNames[normalizeName(type)] = type
}
normElemTypeNames.base = "base"

interface PropDef {
  property: string | [string]
  type: string
  optional: boolean
}

type TypeDef = Record<string, PropDef>

interface Prop {
  name: string
  type: string
  optional: boolean
  add?: string | [string]
  element?: string | [string]
}

type SpecDef = Record<string, Prop>

const merged = {} as Record<GuiElementType, SpecDef>

// read and process types from gui.d.ts
{
  function mapDef(def: ts.InterfaceDeclaration, skipReadonly: boolean): TypeDef {
    const result: TypeDef = {}
    for (const member of def.members) {
      if (!ts.isPropertySignature(member)) continue
      const name = (member.name as ts.Identifier).text
      if (skipReadonly && member.modifiers?.some((x) => x.kind === ts.SyntaxKind.ReadonlyKeyword)) continue
      const type = member.type!.getText(defFile)
      const optional = member.questionToken !== undefined
      result[name] = {
        property: name,
        type,
        optional,
      }
    }
    return result
  }

  const specs = {} as Record<GuiElementType | "base", TypeDef>
  const elements = {} as Record<GuiElementType | "base", TypeDef>

  for (const def of defFile.statements) {
    if (!ts.isInterfaceDeclaration(def)) continue
    let match = def.name.text.match(/^(.+?)GuiSpec|^Base(ChooseElemButton)Spec/)
    if (match) {
      const matchName = match[1] || match[2]
      const elemType = normElemTypeNames[normalizeName(matchName)]
      if (!elemType) throw new Error("not recognized spec: " + match[0])
      specs[elemType] = mapDef(def, false)
      continue
    }

    match = def.name.text.match(/^(.+?)GuiElement/)
    if (match) {
      const matchName = match[1]
      const elemType = normElemTypeNames[normalizeName(matchName)]
      if (!elemType) throw new Error("not recognized element: " + match[0])
      elements[elemType] = mapDef(def, true)
    }
  }

  // manual changes
  delete specs.base.index
  delete specs.slider.value // use element slider_value instead
  const sliderElem = elements.slider
  sliderElem.value_step = {
    property: ["set_slider_value_step"],
    type: "double",
    optional: true,
  }
  sliderElem.discrete_slider = {
    property: ["set_slider_discrete_slider"],
    type: "double",
    optional: true,
  }
  sliderElem.discrete_value = {
    property: ["set_slider_discrete_value"],
    type: "double",
    optional: true,
  }
  sliderElem.minimum_value = {
    property: ["slider_minimum"],
    type: "double",
    optional: true,
  }
  sliderElem.maximum_value = {
    property: ["slider_maximum"],
    type: "double",
    optional: true,
  }

  // inline attributes of "base" type
  function spreadBase(defs: Record<GuiElementType | "base", TypeDef>) {
    const baseDef = defs.base
    for (const [name, def] of Object.entries(defs)) {
      if (name === "base") continue
      defs[name as GuiElementType] = Object.assign({}, baseDef, def)
    }
  }

  spreadBase(specs)
  spreadBase(elements)

  // merge spec and element definitions
  for (const type of guiElementTypes) {
    const spec = specs[type]
    const element = elements[type]
    if (!spec) throw new Error(`Spec def for ${type} not found`)
    if (!elements) throw new Error(`Element def for ${type} not found`)

    const result: SpecDef = {}

    function merge(name: string, prop: Prop) {
      result[name] = Object.assign(result[name] || {}, prop)
    }

    // spec only
    for (const [name, attr] of Object.entries(spec)) {
      merge(name, {
        ...attr,
        name,
        add: attr.property,
      })
    }

    for (const [name, attr] of Object.entries(element)) {
      const specAttr = spec[name]
      const type = `MaybeSource<${attr.type}>`
      merge(name, {
        name,
        type,
        optional: !specAttr || specAttr.optional,
        element: attr.property,
      })
    }
    merged[type] = result
  }
}

function getPropName(name: string): string | ts.StringLiteral {
  return name.includes("-") ? ts.factory.createStringLiteral(name) : name
}

function writeFile(filename: string, content: string, parser: prettier.Options["parser"]) {
  return fs.promises.writeFile(
    path.join(outDir, filename),
    prettier.format(content, {
      parser,
      printWidth: 120,
      semi: false,
    }),
  )
}

function printFile(filename: string, header: string, statements: ts.Statement[]) {
  let content = `// This file was auto-generated by ${path.relative(
    path.resolve(__dirname, ".."),
    __filename,
  )}. Do not edit directly!\n\n`
  content += header
  const printer = ts.createPrinter({
    omitTrailingSemicolon: true,
    newLine: ts.NewLineKind.LineFeed,
  })
  for (const statement of statements) {
    content += printer.printNode(ts.EmitHint.Unspecified, statement, defFile)
    content += "\n\n"
  }
  return writeFile(filename, content, "typescript")
}

// propTypes: Record< GuiElementType, Record<spec name, [ guiSpecProp, elementProp ]>>
{
  const result: Record<string, unknown[]> = {}

  function set(name: string, value: unknown[]) {
    if (name in result) {
      if (JSON.stringify(value) !== JSON.stringify(result[name]))
        console.error(
          "Different prop typings for different values: " + JSON.stringify(value) + JSON.stringify(result[name]),
        )
    } else {
      result[name] = value
    }
  }

  for (const type of guiElementTypes) {
    for (const [name, attr] of Object.entries(merged[type])) {
      set(name, [attr.add, attr.element])
    }
  }

  void writeFile("propTypes.json", JSON.stringify(result), "json")
}

// Create ElementSpec.d.ts
{
  function toPascalCase(str: string): string {
    return str
      .split(/[-_ ]/g)
      .map((str) => str[0].toUpperCase() + str.slice(1))
      .join("")
  }

  const statements: ts.Statement[] = []

  for (const type of guiElementTypes) {
    const members: ts.TypeElement[] = []
    // all members
    for (const [name, attr] of Object.entries(merged[type])) {
      members.push(
        ts.factory.createPropertySignature(
          undefined,
          getPropName(name),
          attr.optional ? ts.factory.createToken(ts.SyntaxKind.QuestionToken) : undefined,
          ts.factory.createTypeReferenceNode(attr.type),
        ),
      )
    }
    // children member
    members.push(
      ts.factory.createPropertySignature(
        undefined,
        "children",
        ts.factory.createToken(ts.SyntaxKind.QuestionToken),
        ts.factory.createArrayTypeNode(ts.factory.createTypeReferenceNode("ElementSpec")),
      ),
    )
    statements.push(
      ts.factory.createInterfaceDeclaration(
        undefined,
        [ts.factory.createModifier(ts.SyntaxKind.ExportKeyword)],
        `${toPascalCase(type)}ElementSpec`,
        undefined,
        undefined,
        members,
      ),
    )
  }
  // type ElementSpec = union of all types
  statements.push(
    ts.factory.createTypeAliasDeclaration(
      undefined,
      [ts.factory.createModifier(ts.SyntaxKind.ExportKeyword)],
      "ElementSpec",
      undefined,
      ts.factory.createUnionTypeNode(
        guiElementTypes.map((type) => ts.factory.createTypeReferenceNode(`${toPascalCase(type)}ElementSpec`)),
      ),
    ),
  )

  void printFile("ElementSpec.d.ts", `import { MaybeSource } from "../callbags"\n\n`, statements)
}

// todo:
// state
// style
// ref
// on_create
// tabs
