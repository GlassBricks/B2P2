import { observable, ObservableValue } from "./ObservableValue"
import { MutableObservableSet, observableSet, ObservableSetChange } from "./ObservableSet"
import { MutableObservableMap, observableMap, ObservableMapChange } from "./ObservableMap"
import { MutableObservableArray, observableArray, ObservableArrayChange } from "./ObservableArray"
import { Event } from "./Event"

describe("Event", () => {
  let event: Event<string>
  before_each(() => {
    event = new Event<string>()
  })
  it("can be constructed", () => {
    assert.not_nil(event)
  })
  describe("subscribe", () => {
    it("can be subscribed to", () => {
      const fn = spy()
      event.subscribe({ next: fn })
      assert.spy(fn).not_called()
    })
    it("calls the subscriber with the value", () => {
      const fn = spy()
      event.subscribe({ next: fn })
      event.raise("hello")
      assert.spy(fn).called(1)
      assert.spy(fn).called_with(match._, "hello")
    })

    it("can fire events multiple times", () => {
      const fn = spy()
      event.subscribe({ next: fn })
      event.raise("1")
      event.raise("2")
      assert.spy(fn).called(2)
      assert.spy(fn).called_with(match._, "1")
      assert.spy(fn).called_with(match._, "2")
    })

    it("broadcasts to multiple subscribers", () => {
      const fn = spy()
      const fn2 = spy()
      event.subscribe({ next: fn })
      event.subscribe({ next: fn2 })
      event.raise("hello")
      assert.spy(fn).called(1)
      assert.spy(fn2).called(1)
    })

    it("allows the same observer to be subscribed multiple times", () => {
      const fn = spy()
      const observer = { next: fn }
      event.subscribe(observer)
      event.subscribe(observer)
      event.raise("1")
      assert.spy(fn).called(2)
    })
  })

  describe("end", () => {
    it("calls observer end when ended", () => {
      const end = spy()
      event.subscribe({ end })
      event.end()
      assert.spy(end).called(1)
    })

    it("does not notify observers after end", () => {
      const fn = spy()
      event.subscribe({ next: fn })
      event.end()
      event.raise("hello")
      assert.spy(fn).not_called()
    })
  })

  describe("unsubscribe", () => {
    it("returns subscription object", () => {
      const fn = spy()
      const subscription = event.subscribe({ next: fn })
      assert.not_nil(subscription)
    })
    it("can be unsubscribed", () => {
      const fn = spy()
      const subscription = event.subscribe({ next: fn })
      event.raise("before")
      subscription.unsubscribe()
      event.raise("after")
      assert.spy(fn).called(1)
      assert.spy(fn).called_with(match._, "before")
      assert.spy(fn).not_called_with(match._, "after")
    })
  })
})

describe("State", () => {
  let s: ObservableValue<string>
  before_each(() => {
    s = observable("begin")
  })

  it("can be constructed with initial value", () => {
    assert.equal(s.get(), "begin")
  })

  it("can be set", () => {
    s.set("end")
    assert.equal(s.get(), "end")
  })

  it("notifies subscribers of value upon subscription", () => {
    const fn = spy()
    s.subscribe({ next: fn })
    assert.spy(fn).called(1)
    assert.spy(fn).called_with(match._, "begin")
  })

  it("notifies subscribers of value when value changed", () => {
    const fn = spy()
    s.subscribe({ next: fn })
    s.set("end")
    assert.spy(fn).called_with(match._, "end")
  })
})

describe("ObservableSet", () => {
  let set: MutableObservableSet<string>
  before_each(() => {
    set = observableSet<string>()
  })

  it("can be constructed", () => {
    assert.equal(set.size(), 0)
  })

  it("keeps track of size", () => {
    set.add("a")
    assert.equal(set.size(), 1)
    set.add("b")
    assert.equal(set.size(), 2)
    set.delete("a")
    assert.equal(set.size(), 1)
  })

  it("keeps track of added items", () => {
    set.add("a")
    assert.true(set.has("a"))
    set.add("b")
    assert.true(set.has("b"))
    set.delete("a")
    assert.false(set.has("a"))
  })

  it("allows to inspect value", () => {
    set.add("a")
    set.add("b")
    assert.same(new LuaSet("a", "b"), set.value())
  })

  it("can be iterated", () => {
    set.add("a")
    set.add("b")
    const values: string[] = []
    for (const [value] of set) {
      values.push(value)
    }
    assert.same(["a", "b"], values)
  })

  it("notifies subscribers of added items", () => {
    const fn = spy()
    set.subscribe({ next: fn })
    set.add("a")
    const change: ObservableSetChange<string> = {
      set,
      value: "a",
      added: true,
    }
    assert.spy(fn).called(1)
    assert.spy(fn).called_with(match._, change)
  })

  it("does not notify subscribers of already present items", () => {
    set.add("a")
    const fn = spy()
    set.subscribe({ next: fn })
    set.add("a")
    assert.spy(fn).not_called()
  })

  it("notifies subscribers of deleted items", () => {
    set.add("a")
    const fn = spy()
    set.subscribe({ next: fn })
    set.delete("a")
    const change: ObservableSetChange<string> = {
      set,
      value: "a",
    }
    assert.spy(fn).called(1)
    assert.spy(fn).called_with(match._, change)
  })

  it("does not notify subscribers of deleting not present items", () => {
    const fn = spy()
    set.subscribe({ next: fn })
    set.delete("a")
    assert.spy(fn).not_called()
  })
})

describe("ObservableMap", () => {
  let map: MutableObservableMap<string, number>
  before_each(() => {
    map = observableMap<string, number>()
  })

  it("can be constructed", () => {
    assert.equal(map.size(), 0)
  })

  it("keeps track of size", () => {
    map.set("a", 1)
    assert.equal(map.size(), 1)
    map.set("b", 2)
    assert.equal(map.size(), 2)
    map.delete("a")
    assert.equal(map.size(), 1)
  })

  it("keeps track of added items", () => {
    map.set("a", 1)
    assert.true(map.has("a"))
    map.set("b", 2)
    assert.true(map.has("b"))
    map.delete("a")
    assert.false(map.has("a"))
  })

  it("allows to inspect value", () => {
    map.set("a", 1)
    map.set("b", 2)
    assert.same(
      {
        a: 1,
        b: 2,
      },
      map.value(),
    )
  })

  it("can be iterated", () => {
    map.set("a", 1)
    map.set("b", 2)
    const values: Record<string, number> = {}
    for (const [key, value] of map) {
      values[key] = value
    }
    assert.same({ a: 1, b: 2 }, values)
  })

  it("notifies subscribers of added items", () => {
    const fn = spy()
    map.subscribe({ next: fn })
    map.set("a", 1)
    const change: ObservableMapChange<string, number> = {
      map,
      key: "a",
      oldValue: undefined,
      value: 1,
    }
    assert.spy(fn).called(1)
    assert.spy(fn).called_with(match._, change)
  })

  it("does not notify subscribers of unchanged items", () => {
    map.set("a", 1)
    const fn = spy()
    map.subscribe({ next: fn })
    map.set("a", 1)
    assert.spy(fn).not_called()
  })

  it("notifies subscribers of changed items", () => {
    map.set("a", 1)
    const fn = spy()
    map.subscribe({ next: fn })
    map.set("a", 2)
    const change: ObservableMapChange<string, number> = {
      map,
      key: "a",
      oldValue: 1,
      value: 2,
    }
    assert.spy(fn).called(1)
    assert.spy(fn).called_with(match._, change)
  })

  it("notifies subscribers of deleted items", () => {
    map.set("a", 1)
    const fn = spy()
    map.subscribe({ next: fn })
    map.delete("a")
    const change: ObservableMapChange<string, number> = {
      map,
      key: "a",
      oldValue: 1,
      value: undefined,
    }
    assert.spy(fn).called(1)
    assert.spy(fn).called_with(match._, change)
  })

  it("does not notify subscribers of deleting not present items", () => {
    const fn = spy()
    map.subscribe({ next: fn })
    map.delete("a")
    assert.spy(fn).not_called()
  })
})

describe("ObservableArray", () => {
  let array: MutableObservableArray<string>
  before_each(() => {
    array = observableArray<string>()
  })

  it("can be constructed", () => {
    assert.equal(array.length(), 0)
  })

  it("keeps track of length", () => {
    array.push("a")
    assert.equal(array.length(), 1)
    array.push("b")
    assert.equal(array.length(), 2)
    array.pop()
    assert.equal(array.length(), 1)
  })

  it("allows to inspect value", () => {
    array.push("a")
    array.push("b")
    assert.same(["a", "b"], array.value())
  })

  test("notifies subscribers of pushed items", () => {
    const fn = spy()
    array.subscribe({ next: fn })
    array.push("a")
    const change: ObservableArrayChange<string> = {
      array,
      add: {
        index: 0,
        value: "a",
      },
    }
    assert.spy(fn).called(1)
    assert.spy(fn).called_with(match._, change)
  })

  it("notifies subscribers of inserted items", () => {
    array.push("a")
    const fn = spy()
    array.subscribe({ next: fn })
    array.insert(0, "b")
    const change: ObservableArrayChange<string> = {
      array,
      add: {
        index: 0,
        value: "b",
      },
    }
    assert.spy(fn).called(1)
    assert.spy(fn).called_with(match._, change)
  })

  it("notifies subscribers of popped items", () => {
    array.push("a")
    const fn = spy()
    array.subscribe({ next: fn })
    array.pop()
    const change: ObservableArrayChange<string> = {
      array,
      remove: {
        index: 0,
        value: "a",
      },
    }
    assert.spy(fn).called(1)
    assert.spy(fn).called_with(match._, change)
  })

  it("notifies subscribers of removed items", () => {
    array.push("a")
    array.push("b")
    const fn = spy()
    array.subscribe({ next: fn })
    array.remove(0)
    const change: ObservableArrayChange<string> = {
      array,
      remove: {
        index: 0,
        value: "a",
      },
    }
    assert.spy(fn).called(1)
    assert.spy(fn).called_with(match._, change)
  })

  it("notifies subscribers of changed items", () => {
    array.push("a")
    array.push("b")
    const fn = spy()
    array.subscribe({ next: fn })
    array.set(0, "c")
    const change: ObservableArrayChange<string> = {
      array,
      change: {
        index: 0,
        oldValue: "a",
        value: "c",
      },
    }
    assert.spy(fn).called(1)
    assert.spy(fn).called_with(match._, change)
  })

  it("does not notify subscribers of changed items when value is not changed", () => {
    array.push("a")
    array.push("b")
    const fn = spy()
    array.subscribe({ next: fn })
    array.set(0, "a")
    assert.spy(fn).not_called()
  })

  test("swap", () => {
    array.push("a")
    array.push("b")
    array.swap(0, 1)
    assert.same(["b", "a"], array.value())
  })

  test("it notifies subscribers of swapped items", () => {
    array.push("a")
    array.push("b")
    const fn = spy()
    array.subscribe({ next: fn })
    array.swap(0, 1)
    const change: ObservableArrayChange<string> = {
      array,
      swap: {
        indexA: 0,
        indexB: 1,
        valueA: "a",
        valueB: "b",
      },
    }
    assert.spy(fn).called(1)
    assert.spy(fn).called_with(match._, change)
  })
})
