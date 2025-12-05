import { FileSystem, Path } from "@effect/platform"
import { Brand, Effect, Array, String, Option, pipe, identity } from "effect"

type DayNumber = number & Brand.Brand<"DayNumber">
type DayPart = number & Brand.Brand<"DayPart">

export const DayNumber = Brand.refined<DayNumber>(
  n => Number.isInteger(n) && n >= 1 && n <= 12,
  n => Brand.error(`Expected ${n} to be an integer between 1 and 12 (included)`)
)

export const DayPart = Brand.refined<DayPart>(
  n => Number.isInteger(n) && (n === 1 || n === 2),
  n => Brand.error(`Expected ${n} to be an integer equal to 1 or 2`)
)

export const baseDirPath = Effect.Do.pipe(
  Effect.bind("fs", () => FileSystem.FileSystem),
  Effect.bind("path", () => Path.Path),
  Effect.bind("currentFilePath", ({ path }) =>
    path.fromFileUrl(new URL(import.meta.url))
  ),
  Effect.andThen(({ currentFilePath, path }) =>
    path.join(path.dirname(currentFilePath), "..")
  )
)

const inputContent = (day: DayNumber, part: Option.Option<DayPart>) =>
  Effect.Do.pipe(
    Effect.bind("baseDirPath", () => baseDirPath),
    Effect.bind("path", () => Path.Path),
    Effect.let("inputFilePath", ({ path, baseDirPath }) => {
      const basePath = path.join(baseDirPath, `src/day${day}`)
      const safePart = Option.getOrElse(part, () => "")
      return path.join(basePath, `input${safePart}.txt`)
    }),
    Effect.bind("fs", () => FileSystem.FileSystem),
    Effect.andThen(({ inputFilePath, fs }) => fs.readFileString(inputFilePath))
  )

const ensureNonEmptyArray = <A>(
  arr: A[] | readonly [A, ...A[]]
): Effect.Effect<readonly [A, ...A[]], Error, never> =>
  Array.match(arr, {
    onEmpty: () => Effect.fail(new Error("Array cannot be empty")),
    onNonEmpty: a => Effect.succeed(a),
  })

export const inputLines = (day: DayNumber, part: Option.Option<DayPart>) =>
  Effect.Do.pipe(
    Effect.bind("content", () => inputContent(day, part)),
    Effect.bind("lines", ({ content }) =>
      pipe(String.split(content, "\n"), ensureNonEmptyArray)
    ),
    Effect.andThen(({ lines }) =>
      pipe(
        Array.lastNonEmpty(lines),
        String.isEmpty,
        Effect.if({
          onTrue: () => Effect.succeed(lines.slice(0, lines.length - 1)),
          onFalse: () => Effect.succeed(lines),
        })
      )
    ),
    Effect.andThen(ensureNonEmptyArray)
  )
