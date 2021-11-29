import { Binding, BindingClass, Bindings, ObservableValue, PropertyAdapter, SimpleProperty } from "./value"
import { ClassRegisterer, Func, Functions, funcOn } from "./references"

const registerClass = ClassRegisterer()

describe("Simple property", () => {
  let property: SimpleProperty<number>
  let actions: string[] = []
  const listener = {
    func() {
      actions.push("called")
    },
  }
  let ref: Func<() => void>
  before_all(() => {
    ref = funcOn(listener, "func")
  })
  before_each(() => {
    property = new SimpleProperty(0)
    actions = []
  })

  test("get and set", () => {
    property.set(1)
    assert.equals(1, property.get())
  })

  test("notifies listeners on change", () => {
    property.addListener(ref)
    assert.same([], actions)
    property.set(1)
    assert.same(["called"], actions)
    property.set(1)
    assert.same(["called"], actions)
    property.set(2)
    assert.same(["called", "called"], actions)
    property.removeListener(ref)
    property.set(3)
    assert.same(["called", "called"], actions)
  })

  test("can register listeners multiple times", () => {
    property.addListener(ref)
    property.addListener(ref)
    property.set(1)
    assert.same(["called", "called"], actions)
    property.removeListener(ref)
    property.set(2)
    assert.same(["called", "called", "called"], actions)
  })

  test("weak listener", () => {
    property.addListener(ref, true)
    property.set(1)
    assert.same(["called"], actions)
    ref = undefined!
    collectgarbage("collect")
    property.set(2)
    assert.same(["called"], actions)
  })
})

describe("Binding class", () => {
  @registerClass()
  class Doubler extends Binding<number> {
    constructor(private readonly otherValue: ObservableValue<number>) {
      super()
      this.addDependencies([otherValue])
    }
    protected computeValue(): number {
      return this.otherValue.get() * 2
    }
  }
  let source: SimpleProperty<number>
  before_each(() => {
    source = new SimpleProperty(1)
  })

  test("Invalidation and recalculate on source changed", () => {
    const binding = new Doubler(source)
    assert.is_false(binding.isValid())
    assert.equal(2, binding.get())
    assert.is_true(binding.isValid())
    source.set(3)
    assert.is_false(binding.isValid())
    assert.equal(6, binding.get())
    assert.is_true(binding.isValid())
  })

  test("Binding chain", () => {
    const binding1 = new Doubler(source)
    const binding = new Doubler(binding1)
    assert.is_false(binding.isValid())
    assert.equal(4, binding.get())
    assert.is_true(binding.isValid())
    source.set(3)
    assert.is_false(binding.isValid())
    assert.equal(12, binding.get())
    assert.is_true(binding.isValid())
  })

  test("Manual invalidation", () => {
    const spyGet = spy.on(source, "get")
    const binding = new Doubler(source)

    binding.get()
    assert.is_true(binding.isValid())

    binding.invalidate()
    assert.is_false(binding.isValid())
    assert.spy(spyGet).called(1)

    assert.equal(2, binding.get())
    assert.is_true(binding.isValid())
    assert.spy(spyGet).called(2)
  })
})

describe("createBindingClass", () => {
  const Binding = BindingClass("test-add", (a: number, b: number, c: number) => a + b + c)
  test("Binding", () => {
    const property1 = new SimpleProperty(1)
    const property2 = new SimpleProperty(3)
    const binding = Binding(property1, property2, 1)
    assert.equal(5, binding.get())
    property1.set(4)
    assert.equal(8, binding.get())
    property2.set(0.5)
    assert.equal(5.5, binding.get())
  })
})

describe("Expression bindings", () => {
  let value1: SimpleProperty<any>
  let value2: SimpleProperty<any>
  before_each(() => {
    value1 = new SimpleProperty(undefined)
    value2 = new SimpleProperty(undefined)
  })
  function foo(value: number) {
    return value + 1
  }
  Functions.register("test2-foo", foo)

  test.each<[any, string, any, any]>(
    [
      [1, "and", 2, 2],
      [false, "or", 2, 2],
      [1, "plus", 2, 3],
      [3, "minus", 2, 1],
      [2, "times", 3, 6],
      [6, "div", 3, 2],
      [5, "mod", 2, 1],
      ["hello", "concat", " world", "hello world"],
      [{ obj: 3 }, "index", "obj", 3],
      [foo, "invoke", 2, 3],
      [2, "map", foo, 3],
      [1, "orElse", 2, 1],
    ],
    "Binary op: %s %s %s = %s",
    (a, op, b, c) => {
      const result = (value1 as any)[op](value2) as ObservableValue<any>
      value1.set(a)
      value2.set(b)
      assert.are_equal(c, result.get())
    },
  )

  test.each<[any, string, any]>(
    [
      [false, "not", true],
      [2, "asString", "2"],
    ],
    "Unary op: %s %s = %s",
    (a, op, b) => {
      const result = (value1 as any)[op]() as ObservableValue<any>
      value1.set(a)
      assert.are_equal(b, result.get())
    },
  )
})

test("Long expression chain", () => {
  const value1 = new SimpleProperty(0)

  const message = Bindings.concat(["There are ", value1.times(2).plus(1).times(3), " bananas!"])

  assert.equal("There are 3 bananas!", message.get())
  value1.set(1)
  assert.equal("There are 9 bananas!", message.get())
})

describe("Bidirectional binding", () => {
  let value1: SimpleProperty<any>
  let value2: SimpleProperty<any>
  before_each(() => {
    value1 = new SimpleProperty<any>(undefined)
    value2 = new SimpleProperty<any>(undefined)
  })

  test("sets value on bind", () => {
    value1.set(1)
    value2.set(2)
    assert.equal(1, value1.get())
    value1.bindBidirectional(value2)
    assert.equal(2, value1.get())
  })

  test("notifies both ways on bind", () => {
    value1.set(1)
    value2.set(2)
    value1.bindBidirectional(value2)

    value1.set(3)
    assert.equal(3, value1.get())
    assert.equal(3, value2.get())

    value2.set(4)
    assert.equal(4, value1.get())
    assert.equal(4, value2.get())
  })

  test("can unbind both ways", () => {
    value1.set(1)
    value2.set(2)
    value1.bindBidirectional(value2)

    value1.set(3)
    assert.equal(3, value1.get())
    assert.equal(3, value2.get())

    value1.unbindBidirectional(value2)
    value2.set(4)
    assert.equal(3, value1.get())
    assert.equal(4, value2.get())

    value1.bindBidirectional(value2)
    value1.set(3)
    assert.equal(3, value1.get())
    assert.equal(3, value2.get())

    value2.unbindBidirectional(value1)
    value2.set(4)
    assert.equal(3, value1.get())
    assert.equal(4, value2.get())
  })
})

describe("PropertyAdapter", () => {
  const obj = {
    value: 0,
  }
  let value: PropertyAdapter<number>
  before_each(() => {
    obj.value = 0
    value = PropertyAdapter.from(obj, "value")
  })

  test("get value", () => {
    obj.value = 1
    assert.equal(1, value.get())
  })
  test("set value", () => {
    value.set(1)
    assert.equal(1, obj.value)
  })

  test("valueChanged", () => {
    const binding = value.plus(1)
    assert.equal(1, binding.get())
    obj.value = 1
    assert.equal(1, binding.get())
    value.valueChanged()
    assert.equal(2, binding.get())
  })
})
