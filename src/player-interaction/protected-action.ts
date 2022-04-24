import { L_Interaction } from "../locale"

export interface UserError {
  _isUserError: true
  message: LocalisedString
}
export interface UnexpectedError {
  _isUserError?: never
  message: string
  traceback: string
}

export function userError(message: LocalisedString): never {
  throw {
    _isUserError: true,
    message,
  }
}
export function isUserError(e: unknown): e is UserError {
  return typeof e === "object" && (e as UserError)._isUserError
}

export function protectedAction<T>(player: LuaPlayer, action: () => T): T | undefined {
  const [success, result] = xpcall(action, getErrorWithStacktrace)
  if (success) return result as T

  const error: UserError | UnexpectedError = result
  if (error._isUserError) {
    player.print(error.message)
  } else {
    reportUnexpectedError(error, player)
  }
}

function getErrorWithStacktrace(error: unknown): UserError | UnexpectedError {
  if (typeof error === "object" && (error as any)._isUserError) return error as UserError
  const errorToString = tostring(error)
  return {
    message: errorToString,
    traceback: debug.traceback(errorToString),
  }
}

function reportUnexpectedError(error: UnexpectedError, player: LuaPlayer): void {
  log(["", "Unexpected error occurred running protected action:\n", error.traceback])
  player.print([L_Interaction.UnexpectedError, error.message])
}
