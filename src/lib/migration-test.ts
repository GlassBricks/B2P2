import { _MigrationHandler, formatVersion, versionLess } from "./migration"

test("formatVersion", () => {
  assert.same("01.02.03", formatVersion("1.2.3"))
  assert.same("01.02.03", formatVersion("01.02.03"))
})

test.each<[string | false, string, boolean]>(
  [
    ["1.2.3", "1.2.4", true],
    ["1.2.3", "1.2.3", false],
    ["1.1.3", "1.2.2", true],
    ["1.2.3", "1.1.4", false],
    ["1.2.3", "2.1.0", true],
    ["2.1.0", "1.2.3", false],
    [false, "1.2.3", true],
  ],
  "versionStrLess: %s < %s => %s",
  (a, b, expected) => {
    assert.equal(expected, versionLess(a || undefined, b))
  },
)

describe("_MigrationHandler", () => {
  let handler: _MigrationHandler
  let oldVersion: string | undefined
  let run: string[]
  let onLoadFuncs: (() => void)[]
  let onInitFuncs: (() => void)[]
  let onConfigurationChangedFuncs: (() => void)[]
  function runOnInit() {
    for (const func of onInitFuncs) func()
  }
  function runOnLoad() {
    for (const func of onLoadFuncs) func()
  }
  function runOnConfigurationChanged() {
    for (const func of onConfigurationChangedFuncs) func()
  }
  function runUpdate() {
    runOnLoad()
    runOnConfigurationChanged()
  }
  before_each(() => {
    run = []
    oldVersion = undefined
    onLoadFuncs = []
    onInitFuncs = []
    onConfigurationChangedFuncs = []
    handler = new _MigrationHandler(
      {
        on_load: (func) => onLoadFuncs.push(func),
        on_init: (func) => onInitFuncs.push(func),
        on_configuration_changed: (func) => onConfigurationChangedFuncs.push(func),
      },
      {
        getOldVersion: () => oldVersion,
        setOldVersion: (version) => {
          oldVersion = version
        },
      },
    )
  })

  test("sets oldVersion to current on_init", () => {
    runOnInit()
    assert.equal(script.active_mods[script.mod_name], oldVersion)
  })

  test("sets oldVersion to current on_config_changed", () => {
    runOnConfigurationChanged()
    assert.equal(script.active_mods[script.mod_name], oldVersion)
  })

  describe("from", () => {
    before_each(() => {
      for (const version of ["1.2.5", "1.2.4", "1.2.3"]) {
        handler.fromBefore(version, () => {
          run.push(version)
        })
      }
      oldVersion = "1.2.3"
    })
    test("does not run on_init", () => {
      runOnInit()
      assert.same([], run)
    })
    test("only runs later versions on config changed, in sorted order", () => {
      runUpdate()
      assert.same(["1.2.4", "1.2.5"], run)
    })
    test("runs all if oldVersion is undefined, in sorted order", () => {
      oldVersion = undefined
      runUpdate()
      assert.same(["1.2.3", "1.2.4", "1.2.5"], run)
    })

    after_each(() => {
      assert.equal(script.active_mods[script.mod_name], oldVersion)
      runUpdate()
    })
  })

  describe("since", () => {
    before_each(() => {
      for (const version of ["1.2.5", "1.2.4", "1.2.3"]) {
        handler.since(version, () => {
          run.push(version)
        })
      }
      oldVersion = "1.2.3"
    })
    test("runs all on_init in given order", () => {
      runOnInit()
      assert.same(["1.2.5", "1.2.4", "1.2.3"], run)
    })
    test("only runs later versions on config changed in sorted order", () => {
      runUpdate()
      assert.same(["1.2.4", "1.2.5"], run)
    })
  })

  describe("onLoadOrMigrate", () => {
    before_each(() => {
      handler.onLoadOrMigrate(() => {
        run.push("onLoadOrMigrate")
      })
    })
    test("does nothing on_init", () => {
      runOnInit()
      assert.same([], run)
    })
    test("runs on_load", () => {
      runOnLoad()
      assert.same(["onLoadOrMigrate"], run)
    })
    test("only runs after if there are migrations", () => {
      oldVersion = "1.2.4"
      handler.fromBefore("1.2.5", () => {
        run.push("from")
      })
      runOnLoad()
      assert.same([], run)
      runOnConfigurationChanged()
      assert.same(["from", "onLoadOrMigrate"], run)
    })
  })
})
