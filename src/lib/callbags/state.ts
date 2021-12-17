import { bind, Classes, Func, Functions } from "../references"
import { CallbagMsg, PushSink, Sink, Source, START, Talkback, TbMsg } from "./callbag"
import { shallowCopy } from "../_util"

export interface NullableState<T> extends Source<T | undefined> {
  get(): T | undefined
  set(value: T): void
  end(): void

  readonly changes: Downstream<T>

  sub<T extends unknown[], K extends number>(this: State<T | undefined>, key: K): NullableState<T[number]>
  sub<T, K extends keyof T>(this: State<T | undefined>, key: K): NullableState<T[K]>

  /** Beware of differing indexes if using change */
  subArray<T extends unknown[], K extends number>(this: State<T | undefined>, key: K): NullableState<T[K]>
}

export interface State<T> extends Source<T> {
  get(): T
  set(value: T): void
  end(): void

  readonly changes: Downstream<T>

  sub<T, K extends number>(this: State<T[]>, key: K): NullableState<T>
  sub<K extends keyof T>(key: K): State<T[K]>
  sub<T, K extends keyof T>(this: State<T | undefined>, key: K): NullableState<T[K]>

  /** Beware of differing indexes if using change */
  subArray<T extends unknown[], K extends number>(this: State<T | undefined>, key: K): NullableState<T[K]>
}

export interface ChangeTraceLeaf<T> {
  from: T
  to: T
}

export interface ChangeTraceNode<T> {
  subs: {
    [K in keyof T]?: ChangeTrace<T[K]>
  }
}

export function isLeaf<T>(node: ChangeTrace<T>): node is ChangeTraceLeaf<T> {
  return !(node as ChangeTraceNode<any>).subs
}

export type ChangeTrace<T> = ChangeTraceLeaf<T> | ChangeTraceNode<T>

export interface Change<T> {
  value: T
  trace?: ChangeTrace<T>
}

export type Downstream<T> = Source<Change<T>>
export type Upstream<T> = PushSink<Change<T>>

function bouncer<T>(
  this: {
    outSink?: Sink<T>
  },
  type: CallbagMsg,
  data?: any,
): void {
  if (type === 0) {
    if (this.outSink) return
    this.outSink = data
    ;(data as Sink<T>)(0, bind(bouncerTb, this))
    return
  }
  this.outSink?.(type as any, data)
  if (type === 2) {
    this.outSink = undefined
  }
}

function bouncerTb(this: { outSink?: Sink<any> }, type: TbMsg) {
  if (type === 2) {
    this.outSink = undefined
  }
}

Functions.register({ bouncer, bouncerTb })

export function diff<T>(from: T, to: T): ChangeTrace<T> | undefined {
  if (from === to) return undefined
  if (typeof from === "object" && typeof to === "object") {
    const trace: ChangeTraceNode<T> = { subs: {} }
    const seen = new LuaTable<any, true>()
    let changed = false

    for (const [key, value] of pairs(from)) {
      seen.set(key, true)
      const subDiff = diff(value, to[key])
      if (subDiff) {
        trace.subs[key] = subDiff
        changed = true
      }
    }

    for (const [key, value] of pairs(to)) {
      if (seen.has(key)) continue
      trace.subs[key] = diff(from[key], value)
      changed = true
    }
    return changed ? trace : undefined
  }
  if (from !== to) {
    return { from, to }
  }
}

export function postTrace<T>(change: Change<T>): Change<T> {
  const { trace, value } = change
  if (trace && isLeaf(trace)) {
    const post = diff(trace.from, trace.to)
    if (post) {
      return {
        value,
        trace: post,
      }
    }
  }
  return change
}

@Classes.registerDefault()
class StateImpl<T> extends Func<any> implements State<T> {
  private value: T
  private sinks = new LuaTable<object, Sink<Change<T>>>()

  private readonly upstream: Upstream<T>
  private dsTalkback?: Talkback
  readonly changes: Downstream<T>

  constructor(initialValue: T)
  constructor(parent: StateImpl<Record<keyof any, T>>, key: keyof any)

  constructor(first: T | StateImpl<Record<keyof any, T> | undefined>, key?: keyof any) {
    super()
    let parentDownstream: Downstream<T | undefined>
    if (key !== undefined) {
      const parent = first as StateImpl<Record<keyof any, T> | undefined>
      this.value = parent.value?.[key] as T
      parentDownstream = bind(StateImpl.subDownstream, {
        parentChanges: parent.changes,
        key,
        sub: this as StateImpl<T | undefined>,
      })
      this.upstream = bind(StateImpl.subUpstream, {
        key,
        state: parent,
      })
    } else {
      this.value = first as T
      const b = bind(bouncer, {})
      this.upstream = b
      parentDownstream = b
    }

    parentDownstream(0, (this as StateImpl<T>).ref("parentDownstreamSink"))
    this.changes = (this as StateImpl<T>).ref("downstream")
  }

  get(): T {
    return this.value
  }

  set(value: T): void {
    this.upstream(1, { value, trace: { from: this.value, to: value } })
  }

  private broadcast(type: CallbagMsg, data?: any) {
    for (const [key, sink] of pairs(shallowCopy(this.sinks))) {
      if (this.sinks.get(key) === sink) {
        sink(type as any, data)
      }
    }
  }

  parentDownstreamSink(type: CallbagMsg, data?: any): void {
    if (type === 0) {
      this.dsTalkback = data
    } else if (type === 1) {
      const change = postTrace(data as Change<T>)
      this.value = change.value
      this.broadcast(1, change)
    } else if (type === 2) {
      this.broadcast(2)
      this.sinks = new LuaTable()
      this.dsTalkback = undefined
    }
  }

  downstream(type: START, sink: Sink<Change<T>>) {
    if (type !== 0) return
    const key = {}
    this.sinks.set(key, sink)
    sink(0, bind(StateImpl.downstreamTb, { sinks: this.sinks, key }))
  }

  private static downstreamTb<T>(
    this: {
      sinks: StateImpl<T>["sinks"]
      key: object
    },
    type: 1 | 2,
  ): void {
    if (type === 2) {
      this.sinks.delete(this.key)
    }
  }

  protected __call(type: START, data: Sink<T>): void {
    if (type === 0) {
      this.downstream(0, bind(StateImpl.passValueSink, { state: this, sink: data }))
    }
  }

  private static passValueSink<T>(
    this: {
      state: StateImpl<T>
      sink: Sink<T>
    },
    type: CallbagMsg,
    data?: any,
  ) {
    if (type === 0) {
      this.sink(0, data)
      this.sink(1, this.state.value)
    } else if (type === 1) {
      this.sink(1, (data as Change<T>).value)
    } else if (type === 2) {
      this.sink(2, data)
    }
  }

  end() {
    this.upstream(2)
    this.dsTalkback?.(2)
    this.dsTalkback = undefined
    this.broadcast(2)
    this.sinks = new LuaTable()
  }

  sub<K extends keyof T>(key: K): State<T[K]> {
    return new StateImpl(this as StateImpl<any>, key)
  }

  subArray<T extends unknown[], K extends number>(this: State<T | undefined>, key: K): NullableState<T[K]> {
    return this.sub(key + 1)
  }

  private static subDownstream<T, K extends keyof T>(
    this: {
      readonly parentChanges: Downstream<T | undefined>
      readonly key: K
      readonly sub: StateImpl<T[K] | undefined>
    },
    type: START,
    sink: Sink<Change<T[K] | undefined>>,
  ) {
    if (type !== 0) return
    this.parentChanges(
      0,
      bind(StateImpl.subDownstreamSink, {
        sub: this.sub,
        key: this.key,
        sink,
      }),
    )
  }

  private static subDownstreamSink<T, K extends keyof T>(
    this: {
      readonly sub: StateImpl<T[K] | undefined>
      readonly key: K
      readonly sink: Sink<Change<T[K] | undefined>>
    },
    type: CallbagMsg,
    data?: any,
  ): void {
    if (type === 1) {
      const { trace, value } = data as Change<T | undefined>
      const key = this.key
      const selfValue = value?.[key]
      const isLeafOrNone = !trace || isLeaf(trace)
      if (isLeafOrNone ? selfValue !== this.sub.value : key in trace.subs!) {
        this.sink(1, {
          value: selfValue,
          trace: isLeafOrNone ? undefined : trace.subs![key],
        })
      }
    } else {
      this.sink(type as any, data)
    }
  }

  private static subUpstream<T, K extends keyof T>(
    this: {
      readonly key: K
      readonly state: StateImpl<T | undefined>
    },
    type: CallbagMsg,
    data?: any,
  ) {
    const state = this.state
    const upstream = state.upstream
    if (type === 1) {
      const change = data as Change<T[K]>
      const value = state.value
      const key = this.key

      if (value === undefined) return
      value[key] = change.value

      upstream(1, {
        value,
        trace: {
          subs: {
            [key]: change.trace,
          },
        } as ChangeTraceNode<T>,
      })
    } else if (type === 2 && data !== undefined) {
      upstream(2, data)
    }
  }
}

export function state<T>(initialValue: T): State<T> {
  return new StateImpl(initialValue)
}
