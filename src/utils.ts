import { FileSystem, Path } from "@effect/platform"
import { Brand, Data, Effect, Array, String, Option, pipe } from "effect"

type Int = number & Brand.Brand<"Int">
const Int = Brand.refined<Int>(
  n => Number.isInteger(n),
  n => Brand.error(`Expected ${n} to be an integer`)
)

type Positive = number & Brand.Brand<"Positive">
const Positive = Brand.refined<Positive>(
  n => n > 0,
  n => Brand.error(`Expected ${n} to be positive`)
)

export const PositiveInt = Brand.all(Int, Positive)
export type PositiveInt = Brand.Brand.FromConstructor<typeof PositiveInt>

type DayNumber = number & Brand.Brand<"DayNumber">
export const DayNumber = Brand.refined<DayNumber>(
  n => Number.isInteger(n) && n >= 1 && n <= 12,
  n => Brand.error(`Expected ${n} to be an integer between 1 and 12 (included)`)
)

type DayPart = number & Brand.Brand<"DayPart">
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

export class InputFileEmptyError extends Data.TaggedError(
  "InputFileEmptyError"
)<{}> {}

export const inputLines = (day: DayNumber, part: Option.Option<DayPart>) =>
  Effect.Do.pipe(
    Effect.bind("content", () => inputContent(day, part)),
    Effect.let("lines", ({ content }) => String.split(content, "\n")),
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
    Effect.andThen(
      Array.match({
        onEmpty: () => Effect.fail(InputFileEmptyError),
        onNonEmpty: a => Effect.succeed(a),
      })
    )
  )
