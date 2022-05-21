import { _MigrationHandler, formatVersion } from "./migration"

test("formatVersion", () => {
  assert.same("01.02.03", formatVersion("1.2.3"))
  assert.same("01.02.03", formatVersion("01.02.03"))
})

test.each<[string, string, boolean]>(
  [
    ["1.2.3", "1.2.4", true],
    ["1.2.3", "1.2.3", false],
    ["1.1.3", "1.2.2", true],
    ["1.2.3", "1.1.4", false],
    ["1.2.3", "2.1.0", true],
    ["2.1.0", "1.2.3", false],
  ],
  "versionStrLess: %s < %s => %s",
  (a, b, expected) => {
    assert.equal(expected, formatVersion(a) < formatVersion(b))
  },
)

class MockMigrationHandler extends _MigrationHandler {
  oldVersion: string | undefined
  onLoadFuncs: (() => void)[] = []
  onInitFuncs: (() => void)[] = []
  onConfigurationChangedFuncs: (() => void)[] = []
  constructor() {
    super(
      {
        on_load: (func) => this.onLoadFuncs.push(func),
        on_init: (func) => this.onInitFuncs.push(func),
        on_configuration_changed: (func) => this.onConfigurationChangedFuncs.push(func),
      },
      {
        getOldVersion: () => this.oldVersion,
        setOldVersion: (version) => (this.oldVersion = version),
      },
    )
    this._init()
  }

  runOnInit() {
    for (const func of this.onInitFuncs) func()
  }
  runOnLoad() {
    for (const func of this.onLoadFuncs) func()
  }
  runOnConfigurationChanged() {
    for (const func of this.onConfigurationChangedFuncs) func()
  }
  runUpdate() {
    this.runOnLoad()
    this.runOnConfigurationChanged()
  }
}

describe("_MigrationHandler", () => {
  let handler: MockMigrationHandler
  let run: string[]
  before_each(() => {
    handler = new MockMigrationHandler()
    run = []
  })

  test("sets oldVersion to current on_init", () => {
    handler.runOnInit()
    assert.equal(script.active_mods[script.mod_name], handler.oldVersion)
  })

  test("sets oldVersion to current on_config_changed", () => {
    handler.runOnConfigurationChanged()
    assert.equal(script.active_mods[script.mod_name], handler.oldVersion)
  })

  describe("from", () => {
    before_each(() => {
      for (const version of ["1.2.5", "1.2.4", "1.2.3"]) {
        handler.from(version, () => {
          run.push(version)
        })
      }
      handler.oldVersion = "1.2.3"
    })
    test("does not run on_init", () => {
      handler.runOnInit()
      assert.same([], run)
    })
    test("only runs later versions on config changed, in sorted order", () => {
      handler.runUpdate()
      assert.same(["1.2.4", "1.2.5"], run)
    })
    test("runs all if oldVersion is undefined, in sorted order", () => {
      handler.oldVersion = undefined
      handler.runUpdate()
      assert.same(["1.2.3", "1.2.4", "1.2.5"], run)
    })

    after_each(() => {
      assert.equal(script.active_mods[script.mod_name], handler.oldVersion)
      handler.runUpdate()
    })
  })

  describe("since", () => {
    before_each(() => {
      for (const version of ["1.2.5", "1.2.4", "1.2.3"]) {
        handler.since(version, () => {
          run.push(version)
        })
      }
      handler.oldVersion = "1.2.3"
    })
    test("runs all on_init in given order", () => {
      handler.runOnInit()
      assert.same(["1.2.5", "1.2.4", "1.2.3"], run)
    })
    test("only runs later versions on config changed in sorted order", () => {
      handler.runUpdate()
      assert.same(["1.2.4", "1.2.5"], run)
    })
  })

  describe("onLoadOrMigrate", () => {
    before_each(() => {
      handler.fromBeforeLoad("1.2.3", () => {
        run.push("fromBeforeLoad")
      })
      handler.onLoadOrMigrate(() => {
        run.push("onLoadOrMigrate")
      })
    })
    test("does nothing on_init", () => {
      handler.runOnInit()
      assert.same([], run)
    })
    test("runs on_load if no migrations", () => {
      handler.oldVersion = "1.2.3"
      handler.runOnLoad()
      assert.same(["onLoadOrMigrate"], run)
    })
    test("only runs after if there are migrations", () => {
      handler.oldVersion = "1.2.0"
      handler.runOnLoad()
      assert.same([], run)
      handler.runOnConfigurationChanged()
      assert.same(["fromBeforeLoad", "onLoadOrMigrate"], run)
    })
    test("normal migrations run after on_load", () => {
      handler.from("1.2.3", () => {
        run.push("from")
      })
      handler.oldVersion = "1.2.0"
      handler.runOnLoad()
      assert.same([], run)
      handler.runOnConfigurationChanged()
      assert.same(["fromBeforeLoad", "onLoadOrMigrate", "from"], run)
    })
  })
})
